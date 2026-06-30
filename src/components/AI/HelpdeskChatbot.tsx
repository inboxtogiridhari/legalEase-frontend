import { FormEvent, useState } from 'react';
import { Bot, CornerDownLeft, FileText, Loader2, MessageSquareText, Route, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import puter from '../../lib/puter';
import { apiAiHelpdeskChat, apiDocumentsList } from '../../lib/api';
import { Document } from '../../types';

interface ChatMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ActionItem {
  type: 'route' | 'status' | 'preview';
  label: string;
  href?: string;
  preview?: string;
}

interface HelpdeskChatbotProps {
  defaultLanguage?: 'english' | 'hindi' | 'hinglish';
}

function buildSystemPrompt(language: 'english' | 'hindi' | 'hinglish') {
  const languageDirective =
    language === 'hindi'
      ? 'Reply in simple Hindi with occasional English legal words when needed.'
      : language === 'english'
      ? 'Reply in simple practical English.'
      : 'Reply in simple Hinglish, mixing Hindi and English naturally.';

  return [
    'You are the LegalEase Intelligent Legal Help-Desk.',
    languageDirective,
    'Your job is to help with legal notices, rent agreements, affidavits, status tracking, refund guidance, and plain-language legal explanations.',
    'Current pricing is INR 499 for legal notice, INR 999 for rent agreement, and INR 1999 for affidavit.',
    'Explain the workflow as form -> proof upload -> payment when required -> lawyer review -> verified copy -> delivery updates.',
    'Prefer actionable answers.',
    'If the user asks for status, use the check_document_status tool.',
    'If the user asks for refund or a new notice, use the route_user_intent tool.',
    'If the user asks for a rough draft before the formal form, use the draft_preview tool.',
    'Keep answers concise and user-centric.',
  ].join(' ');
}

function detectIntent(message: string) {
  const text = message.toLowerCase();
  return {
    wantsStatus: /status|track|vault|where.*document|document.*where|notice.*status/.test(text),
    wantsRefund: /refund|money back|cancel.*order|payment issue/.test(text),
    wantsNotice: /new notice|legal notice|notice draft|send notice|draft notice/.test(text),
    wantsPreview: /preview|draft/i.test(text),
  };
}

function buildPreview(category: string, facts: string) {
  const normalized = category.toLowerCase();
  if (normalized.includes('rent')) {
    return [
      'RENT AGREEMENT PREVIEW',
      '',
      '[DRAFT WATERMARK: LEGAL EASE PREVIEW]',
      `Property terms summary: ${facts || 'To be filled from the formal form.'}`,
      'Key placeholders: landlord, tenant, rent, deposit, tenure, witness signatures.',
    ].join('\n');
  }

  if (normalized.includes('affidavit')) {
    return [
      'AFFIDAVIT PREVIEW',
      '',
      '[DRAFT WATERMARK: LEGAL EASE PREVIEW]',
      `Facts summary: ${facts || 'To be filled from the formal form.'}`,
      'Verification clause and deponent details will be finalized in the form.',
    ].join('\n');
  }

  return [
    'LEGAL NOTICE PREVIEW',
    '',
    '[DRAFT WATERMARK: LEGAL EASE PREVIEW]',
    `Facts summary: ${facts || 'To be filled from the formal form.'}`,
    'Demand, timeline, and recipient details will be finalized in the form.',
  ].join('\n');
}

async function lookupDocumentStatus(documentHint?: string) {
  const documents = (await apiDocumentsList()) as Document[];
  if (!documents.length) {
    return {
      summary: 'User has no document in the vault yet.',
      href: '/dashboard',
      document: null,
    };
  }

  const hint = String(documentHint || '').trim().toLowerCase();
  const matched =
    documents.find((doc) => doc.id.toLowerCase() === hint) ||
    documents.find((doc) => doc.id.toLowerCase().includes(hint)) ||
    documents[0];

  return {
    summary: `Latest matching document is ${matched.document_type.replace(/_/g, ' ')} and is currently at ${matched.status.replace(/_/g, ' ')} stage.`,
    href: `/dashboard?document=${matched.id}`,
    document: matched,
  };
}

function routeForIntent(message: string) {
  const text = message.toLowerCase();
  if (/refund|money back|cancel.*order|payment issue/.test(text)) {
    return {
      label: 'Open refund portal',
      href: '/refund-portal',
      summary: 'Refund-related request detected. Redirecting user to refund flow.',
    };
  }
  if (/notice|new notice|draft notice|send notice/.test(text)) {
    return {
      label: 'Open notice form',
      href: '/notice-form',
      summary: 'New notice intent detected. Redirecting user to notice form.',
    };
  }
  return {
    label: 'Open dashboard',
    href: '/dashboard',
    summary: 'General guidance route selected.',
  };
}

export default function HelpdeskChatbot({ defaultLanguage = 'hinglish' }: HelpdeskChatbotProps) {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Namaste. Main LegalEase help-desk hoon. Aap notice types, pricing, status, refund route, ya process ke baare mein pooch sakte hain.',
    },
  ]);
  const [actions, setActions] = useState<ActionItem[]>([]);

  async function streamFromPuter(history: ChatMessage[], assistantId: string, nextActions: ActionItem[]) {
    const statusAction = nextActions.find((action) => action.type === 'status' && action.href);
    const routeAction = nextActions.find((action) => action.type === 'route' && action.href);
    const previewAction = nextActions.find((action) => action.type === 'preview' && action.preview);

    const localContext = [
      statusAction ? `Known tracker link: ${statusAction.href}` : '',
      routeAction ? `Suggested route: ${routeAction.href}` : '',
      previewAction ? `Preview available: ${previewAction.preview}` : '',
    ].filter(Boolean).join('\n');

    const result = await puter.ai.chat(
      [
        { role: 'system', content: `${buildSystemPrompt(defaultLanguage)} Use these local app hints when relevant:\n${localContext}` },
        ...history
          .filter((item) => item.id !== assistantId)
          .map((item) => ({ role: item.role, content: item.content })),
      ],
      {
        model: 'gpt-4o',
        stream: true,
      }
    );

    let finalText = '';
    const maybeAsyncIterable = result as AsyncIterable<{ text?: string }> | { message?: { content?: string } };

    if (maybeAsyncIterable && Symbol.asyncIterator in Object(maybeAsyncIterable)) {
      for await (const part of maybeAsyncIterable as AsyncIterable<{ text?: string }>) {
        if (!part?.text) continue;
        finalText += part.text;
        setMessages((prev) => prev.map((item) => (item.id === assistantId ? { ...item, content: finalText } : item)));
      }
      return finalText;
    }

    finalText = String((maybeAsyncIterable as { message?: { content?: string } })?.message?.content || '').trim();
    if (finalText) {
      setMessages((prev) => prev.map((item) => (item.id === assistantId ? { ...item, content: finalText } : item)));
    }
    return finalText;
  }

  async function fallbackToBackend(history: ChatMessage[], message: string, assistantId: string) {
    const result = await apiAiHelpdeskChat({
      message,
      language: defaultLanguage,
      history: history.filter((item) => item.role !== 'system').map((item) => ({ role: item.role === 'assistant' ? 'assistant' : 'user', content: item.content })),
    });
    setActions((result.actions || []) as ActionItem[]);
    setMessages((prev) => prev.map((item) => (item.id === assistantId ? { ...item, content: result.reply } : item)));
  }

  async function buildActions(message: string) {
    const intent = detectIntent(message);
    const nextActions: ActionItem[] = [];

    if (intent.wantsStatus) {
      const status = await lookupDocumentStatus();
      if (status.document) {
        nextActions.push({
          type: 'status',
          label: 'Open tracker',
          href: status.href,
        });
      }
    }

    if (intent.wantsRefund || intent.wantsNotice) {
      const route = routeForIntent(message);
      nextActions.push({
        type: 'route',
        label: route.label,
        href: route.href,
      });
    }

    if (intent.wantsPreview || intent.wantsNotice) {
      nextActions.push({
        type: 'preview',
        label: 'Preview ready',
        preview: buildPreview(intent.wantsNotice ? 'legal_notice' : 'general', message),
      });
    }

    return nextActions;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const message = input.trim();
    if (!message || loading) return;

    const assistantId = `${Date.now()}-assistant`;
    const nextHistory: ChatMessage[] = [
      ...messages,
      { id: `${Date.now()}-user`, role: 'user', content: message },
      { id: assistantId, role: 'assistant', content: '' },
    ];

    setMessages(nextHistory);
    setInput('');
    setLoading(true);

    try {
      const nextActions = await buildActions(message);
      setActions(nextActions);

      let finalText = '';
      try {
        finalText = await streamFromPuter(nextHistory, assistantId, nextActions);
      } catch (puterError) {
        console.error('Puter streaming failed, falling back to backend helpdesk:', puterError);
        toast('Puter unavailable, using LegalEase fallback help-desk.');
        await fallbackToBackend(nextHistory, message, assistantId);
        return;
      }

      if (!finalText.trim()) {
        await fallbackToBackend(nextHistory, message, assistantId);
      }
    } catch (error) {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === assistantId
            ? { ...item, content: 'Help-desk is temporarily unavailable. Please try again in a moment.' }
            : item
        )
      );
      toast.error(error instanceof Error ? error.message : 'Help-desk request failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top,_rgba(15,23,42,0.06),_transparent_45%),linear-gradient(135deg,#fff9ed,#ffffff_40%,#eef4ff)] shadow-lg">
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-slate-900 p-3 text-white">
            <Bot className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">Intelligent Legal Help-Desk</p>
            <p className="text-xs text-slate-500">Puter.js streaming agent for status, routes, and draft previews</p>
          </div>
        </div>
      </div>

      <div className="max-h-[24rem] space-y-3 overflow-auto px-5 py-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                message.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'border border-slate-200 bg-white text-slate-700'
              }`}
            >
              {message.content || (
                <span className="inline-flex items-center gap-2 text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing with Puter...
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {actions.length > 0 && (
        <div className="border-t border-slate-200 bg-white/70 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Suggested Actions</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((action) => (
              <a
                key={`${action.type}-${action.label}`}
                href={action.href || '#'}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400"
                onClick={(event) => {
                  if (!action.href) event.preventDefault();
                  if (action.type === 'preview' && action.preview) {
                    event.preventDefault();
                    navigator.clipboard.writeText(action.preview).then(() => {
                      toast.success('Preview copied to clipboard');
                    }).catch(() => {
                      toast('Preview generated below');
                    });
                  }
                }}
              >
                {action.type === 'route' && <Route className="h-4 w-4" />}
                {action.type === 'status' && <MessageSquareText className="h-4 w-4" />}
                {action.type === 'preview' && <FileText className="h-4 w-4" />}
                {action.label}
              </a>
            ))}
          </div>
          {actions.some((action) => action.preview) && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-amber-900">
                <Sparkles className="h-4 w-4" />
                Draft Preview
              </p>
              <pre className="mt-2 whitespace-pre-wrap text-xs text-amber-950">
                {actions.find((action) => action.preview)?.preview}
              </pre>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white px-5 py-4">
        <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Ask the agent
        </label>
        <div className="flex gap-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            rows={3}
            placeholder="Example: meri notice ka status kya hai, refund ke liye kahaan jaun, ya ek legal notice preview draft karo"
            className="min-h-[84px] flex-1 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none ring-0 placeholder:text-slate-400 focus:border-slate-900"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 self-end rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CornerDownLeft className="h-4 w-4" />}
            Send
          </button>
        </div>
      </form>
    </section>
  );
}
