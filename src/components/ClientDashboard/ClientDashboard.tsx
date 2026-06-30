import { useEffect, useMemo, useState } from 'react';
import { FileSearch, FileText, Languages, Mic, PenLine, Plus, Eye, PhoneCall, Send, Trash2, Truck, BadgeCheck, MapPinned, CalendarCheck2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  apiDocumentDelete,
  apiDocumentQueryReply,
  apiDocumentTransition,
  apiDocumentsList,
  apiEsignRequest,
  apiBookLawyer,
  apiVoiceFaq,
  apiDocumentVoiceStatus,
} from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Document } from '../../types';
import DashboardLayout from '../Layout/DashboardLayout';
import DocumentForm from '../DocumentForm/DocumentForm';
import DocumentPreview from '../DocumentPreview/DocumentPreview';
import ProfilePage from '../Profile/ProfilePage';
import { useToast } from '../Toast/ToastProvider';

const TIMELINE_STEPS = ['drafting', 'lawyer_review', 'verified', 'signed', 'sent_soft_copy', 'out_for_delivery', 'delivered'];

const COMPLIANCE_SCORE: Record<string, number> = {
  drafting: 20,
  lawyer_review: 40,
  verified: 60,
  signed: 75,
  payment: 80,
  sent_soft_copy: 85,
  out_for_delivery: 95,
  delivered: 100,
};

interface ClientDashboardProps {
  serviceRoute?: 'legal_notice' | 'rent_agreement' | 'affidavit' | null;
}

export default function ClientDashboard({ serviceRoute = null }: ClientDashboardProps) {
  const currentPath = window.location.pathname;
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t, i18n } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(currentPath === '/notice-form');
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState('');
  const [voiceQuestion, setVoiceQuestion] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'legal_notice' | 'rent_agreement' | 'affidavit'>(
    currentPath === '/notice-form' ? 'legal_notice' : 'legal_notice'
  );
  const [selectedNoticeSubtype, setSelectedNoticeSubtype] = useState<string>('');
  const [skipDraftSession, setSkipDraftSession] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [consultDoc, setConsultDoc] = useState<Document | null>(null);
  const [consultDateTime, setConsultDateTime] = useState('');
  const [speakingDocId, setSpeakingDocId] = useState<string | null>(null);
  const [queryReplies, setQueryReplies] = useState<Record<string, string>>({});
  const [replyingDocId, setReplyingDocId] = useState<string | null>(null);
  const serviceTitle = serviceRoute === 'legal_notice'
    ? 'Drafting: Legal Notice'
    : serviceRoute === 'rent_agreement'
      ? 'Drafting: Rent Agreement'
      : serviceRoute === 'affidavit'
        ? 'Drafting: Affidavit'
        : null;

  const heroSlides = useMemo(
    () => (t('landing.heroSlides', { returnObjects: true }) as string[]) || [],
    [t]
  );

  useEffect(() => {
    loadDocuments();
  }, [user]);

  useEffect(() => {
    if (currentPath === '/refund-portal') {
      showToast('Refund guidance is available through support review. Share your payment issue in the help-desk panel.', 'info');
    }
  }, [currentPath, showToast]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadDocuments(search);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlides.length);
    }, 3500);
    return () => window.clearInterval(timer);
  }, [heroSlides.length]);

  async function loadDocuments(q?: string) {
    try {
      if (user?.id) {
        const data = await apiDocumentsList(q) as Document[];
        setDocuments(data || []);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  }

  function handleCreateNew(type: 'legal_notice' | 'rent_agreement' | 'affidavit', subtype?: string) {
    setSelectedType(type);
    if (subtype) {
      setSelectedNoticeSubtype(subtype);
      window.localStorage.setItem('preferred_notice_type', subtype);
    }
    setSkipDraftSession(true);
    setShowForm(true);
  }

  function handleFormClose() {
    setShowForm(false);
    setSkipDraftSession(false);
    loadDocuments(search);
  }

  async function runTransition(doc: Document, stage: 'sent_soft_copy' | 'out_for_delivery') {
    try {
      const formData = (doc?.form_data || {}) as Record<string, unknown>;
      const recipientEmail = (formData?.recipientEmail as string | undefined) || undefined;
      const recipientPhone = (formData?.recipientPhone as string | undefined) || undefined;
      await apiDocumentTransition(doc.id, {
        stage,
        recipient_email: recipientEmail,
        recipient_phone: recipientPhone,
      });
      showToast(`${t('common.save')} ${stage.replace(/_/g, ' ')}`, 'success');
      await loadDocuments(search);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('errors.transitionFailed'), 'error');
    }
  }

  async function runEsign(doc: Document) {
    try {
      await apiEsignRequest({
        document_id: doc.id,
        provider: 'leegality',
        signers: [{ role: 'client', name: user?.email || 'Client', email: user?.email || undefined }],
      });
      await apiDocumentTransition(doc.id, { stage: 'signed' });
      showToast('E-sign request created and stage moved to signed', 'success');
      await loadDocuments(search);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('errors.esignFailed'), 'error');
    }
  }

  async function askVoiceFaq() {
    try {
      setVoiceLoading(true);
      const answer = await apiVoiceFaq({ question: voiceQuestion || 'Where is my notice?' });
      setVoiceReply(answer.answer);
    } catch (error) {
      showToast(error instanceof Error ? error.message : t('errors.voiceFaqFailed'), 'error');
    } finally {
      setVoiceLoading(false);
    }
  }

  function timelineFor(doc: Document) {
    const seen = new Set((doc.timeline_events || []).map((t) => t.stage));
    return TIMELINE_STEPS.map((step) => ({
      step,
      done: seen.has(step) || TIMELINE_STEPS.indexOf(step) <= TIMELINE_STEPS.indexOf(doc.status),
    }));
  }

  function latestQueryThread(doc: Document) {
    const events = [...(doc.timeline_events || [])].sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
    const latestQuery = [...events].reverse().find((event) => event.stage === 'query');
    const latestReply = [...events].reverse().find((event) => event.stage === 'query_reply');
    const hasPendingReply =
      !!latestQuery && (!latestReply || new Date(latestReply.at).getTime() < new Date(latestQuery.at).getTime());

    return { latestQuery, latestReply, hasPendingReply };
  }

  async function sendQueryReply(doc: Document) {
    const message = String(queryReplies[doc.id] || '').trim();
    if (!message) {
      showToast('Please enter your reply for the lawyer.', 'error');
      return;
    }
    try {
      setReplyingDocId(doc.id);
      await apiDocumentQueryReply(doc.id, { message });
      setQueryReplies((prev) => ({ ...prev, [doc.id]: '' }));
      showToast('Reply sent to lawyer', 'success');
      await loadDocuments(search);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to send reply', 'error');
    } finally {
      setReplyingDocId(null);
    }
  }

  function statusAccent(status: string) {
    if (status === 'verified' || status === 'signed' || status === 'delivered') return 'border-l-[var(--court-gold)]';
    if (status === 'drafting' || status === 'lawyer_review') return 'border-l-sky-700';
    return 'border-l-slate-400';
  }

  function expiryText(doc: Document) {
    if (doc.document_type !== 'rent_agreement') return 'No expiry reminder';
    const created = new Date(doc.created_at).getTime();
    const expiry = new Date(created + 1000 * 60 * 60 * 24 * 330);
    const today = new Date();
    const days = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return days >= 0 ? `Validity expires in ${days} day(s)` : `Expired ${Math.abs(days)} day(s) ago`;
  }

  function renderNotificationBanner(doc: Document) {
    const notifications = doc.delivery_meta?.notifications || {};
    const entries: Array<[string, { sent?: boolean; mocked?: boolean; reason?: string; at?: string }]> = [
      ['Recipient Email', notifications.recipient_email],
      ['Recipient WhatsApp', notifications.recipient_whatsapp],
      ['Soft Copy Email', notifications.soft_copy_email],
      ['Soft Copy WhatsApp', notifications.soft_copy_whatsapp],
    ].filter(([, value]) => Boolean(value)) as Array<[string, { sent?: boolean; mocked?: boolean; reason?: string; at?: string }]>;
    if (!entries.length) return null;

    return (
      <div className="mt-3 rounded-lg border bg-slate-50 p-3 text-xs text-slate-700">
        <p className="font-semibold text-slate-800 mb-2">Delivery Status</p>
        <div className="flex flex-wrap gap-2">
          {entries.map(([label, status]) => {
            const sent = status?.sent;
            const mocked = status?.mocked;
            const color = sent ? (mocked ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200') : 'bg-rose-100 text-rose-800 border-rose-200';
            const text = sent ? (mocked ? 'Mocked' : 'Sent') : 'Failed';
            return (
              <span key={label as string} className={`px-2 py-1 rounded-full border ${color}`}>
                {label}: {text}
              </span>
            );
          })}
        </div>
      </div>
    );
  }

  function speakText(text: string) {
    if (!('speechSynthesis' in window)) {
      showToast(t('voice.unsupported'), 'error');
      return;
    }
    const lang = i18n.language === 'hi' ? 'hi-IN' : i18n.language === 'hinglish' ? 'en-IN' : 'en-US';
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeakingDocId(null);
    utterance.onerror = () => setSpeakingDocId(null);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  async function handleVoiceStatus(doc: Document) {
    try {
      setSpeakingDocId(doc.id);
      const status = await apiDocumentVoiceStatus(doc.id);
      speakText(status.summary);
      showToast(status.summary, 'success');
    } catch (error) {
      setSpeakingDocId(null);
      showToast(error instanceof Error ? error.message : t('errors.voiceStatusFailed'), 'error');
    }
  }

  function complianceScore() {
    if (!documents.length) return 0;
    const scores = documents.map((doc) => COMPLIANCE_SCORE[doc.status] || 15);
    const avg = scores.reduce((sum, val) => sum + val, 0) / scores.length;
    return Math.round(avg);
  }

  if (showProfile) {
    return (
      <DashboardLayout onProfileClick={() => setShowProfile(true)}>
        <ProfilePage onBack={() => setShowProfile(false)} />
      </DashboardLayout>
    );
  }

  if (showForm) {
    return (
      <DashboardLayout onProfileClick={() => setShowProfile(true)}>
        <DocumentForm
            documentType={selectedType}
            preselectedNoticeSubtype={selectedNoticeSubtype}
            skipDraftSession={skipDraftSession}
            onClose={handleFormClose}
          />
      </DashboardLayout>
    );
  }

  if (previewDocument) {
    return (
      <DashboardLayout onProfileClick={() => setShowProfile(true)}>
        <DocumentPreview
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
        />
      </DashboardLayout>
    );
  }

  const vaultDocs = documents.filter((d) => ['signed', 'delivered'].includes(d.status));
  const filteredDocuments = serviceRoute ? documents.filter((d) => d.document_type === serviceRoute) : [];
  const compliance = complianceScore();
  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (compliance / 100) * circumference;

  return (
    <DashboardLayout onProfileClick={() => setShowProfile(true)}>
      <div className="space-y-8">
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6">
          <div className="bg-gradient-to-r from-[var(--court-midnight)] via-[var(--court-charcoal)] to-[var(--court-midnight)] rounded-2xl p-6 text-white shadow-lg">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">{t('dashboard.clientTitle')}</p>
            <h2 className="text-4xl font-bold font-law mt-2">{heroSlides[heroIndex]}</h2>
            <p className="text-slate-300 mt-2">{t('dashboard.activeSubtitle')}</p>
            <div className="mt-3 flex items-center gap-2">
              {heroSlides.map((_, idx) => (
                <span key={idx} className={`h-1.5 rounded-full transition-all ${heroIndex === idx ? 'w-8 bg-[var(--court-gold)]' : 'w-3 bg-white/40'}`} />
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Legal Compliance Meter</p>
            <div className="mt-4 flex items-center gap-6">
              <div className="compliance-ring">
                <svg width="140" height="140">
                  <circle cx="70" cy="70" r="52" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                  <circle cx="70" cy="70" r="52" stroke="#d4af37" strokeWidth="10" fill="none" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" />
                </svg>
                <div className="label">{compliance}%</div>
              </div>
              <div>
                <p className="text-sm text-slate-600">Active cases aligned with compliance milestones.</p>
                <p className="text-xs text-slate-500 mt-2">Auto-calculated from verified, signed, and delivery stages.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-3xl font-bold text-slate-900 font-law">{serviceTitle || t('dashboard.activeCases')}</h3>
            <p className="text-slate-600">{serviceTitle ? 'Dedicated paper-first workspace for this service.' : t('dashboard.activeSubtitle')}</p>
          </div>
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-96">
              <FileSearch className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('dashboard.searchPlaceholder')}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg bg-white"
              />
            </div>
            <div className="relative">
              <Languages className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
              <select
                value={i18n.language}
                onChange={(e) => {
                  const lang = e.target.value;
                  i18n.changeLanguage(lang);
                  window.localStorage.setItem('legalease_lang', lang);
                }}
                className="pl-9 pr-3 py-2.5 border border-slate-300 rounded-lg bg-white"
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="hinglish">Hinglish</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => { window.location.pathname = '/dashboard'; }} className={`rounded-full px-4 py-2 text-sm font-semibold ${!serviceRoute ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}>Overview</button>
          <button onClick={() => { window.location.pathname = '/dashboard/legal-notices'; }} className={`rounded-full px-4 py-2 text-sm font-semibold ${serviceRoute === 'legal_notice' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}>Legal Notices</button>
          <button onClick={() => { window.location.pathname = '/dashboard/rent-agreements'; }} className={`rounded-full px-4 py-2 text-sm font-semibold ${serviceRoute === 'rent_agreement' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}>Rent Agreements</button>
          <button onClick={() => { window.location.pathname = '/dashboard/affidavits'; }} className={`rounded-full px-4 py-2 text-sm font-semibold ${serviceRoute === 'affidavit' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border border-slate-300'}`}>Affidavits</button>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Mic className="w-4 h-4 text-slate-700" />
            <p className="font-semibold text-slate-900">{t('dashboard.interactiveBar')}</p>
            {voiceLoading && (
              <span className="voice-wave ml-2" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              value={voiceQuestion}
              onChange={(e) => setVoiceQuestion(e.target.value)}
              placeholder={t('dashboard.askPlaceholder')}
              className="flex-1 px-3 py-2 border rounded-lg"
            />
            <button onClick={askVoiceFaq} className="px-4 py-2 bg-slate-900 text-white rounded-lg">{t('dashboard.askButton')}</button>
          </div>
          {voiceReply && <p className="text-sm text-slate-700 mt-2 whitespace-pre-wrap">{voiceReply}</p>}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <button onClick={() => handleCreateNew('legal_notice', window.localStorage.getItem('preferred_notice_type') || 'money_recovery')} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-l-sky-700 border-y border-r border-slate-200 text-left group">
            <div className="bg-slate-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6 text-white" /></div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2 font-law">{t('dashboard.createLegalNotice')}</h3>
            <p className="text-slate-600 text-sm">AI-assisted notice draft with lawyer verification workflow</p>
          </button>
          <button onClick={() => handleCreateNew('rent_agreement')} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-l-[var(--court-gold)] border-y border-r border-slate-200 text-left group">
            <div className="bg-slate-900 w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><FileText className="w-6 h-6 text-white" /></div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2 font-law">{t('dashboard.createRentAgreement')}</h3>
            <p className="text-slate-600 text-sm">State-aware clauses and print-ready witness blocks</p>
          </button>
          <button onClick={() => handleCreateNew('affidavit')} className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-all border-l-4 border-l-slate-700 border-y border-r border-slate-200 text-left group">
            <div className="bg-white p-1 rounded-lg inline-flex mb-4 border border-slate-200"><Plus className="w-5 h-5 text-slate-700" /></div>
            <h3 className="text-2xl font-semibold text-slate-900 mb-2 font-law">{t('dashboard.createAffidavit')}</h3>
            <p className="text-slate-600 text-sm">Guided affidavit builder with timeline tracking</p>
          </button>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <h3 className="text-2xl font-semibold text-slate-900 mb-3 font-law">{t('dashboard.chooseNotice')}</h3>
          <div className="grid md:grid-cols-3 gap-3">
            {[
              ['money_recovery', 'Money Recovery'],
              ['cheque_bounce', 'Cheque Bounce'],
              ['tenant_eviction', 'Tenant Eviction'],
              ['divorce_family', 'Divorce / Family'],
              ['employment_dispute', 'Employment Dispute'],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => handleCreateNew('legal_notice', id)}
                className="text-left px-4 py-3 rounded-lg border hover:border-slate-900 hover:bg-slate-50"
              >
                <p className="font-medium text-slate-900">{label}</p>
                <p className="text-xs text-slate-500">Start this notice</p>
              </button>
            ))}
          </div>
        </div>

        {!serviceRoute && (
          <section className="grid md:grid-cols-3 gap-6">
            <button onClick={() => { window.location.pathname = '/dashboard/legal-notices'; }} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dedicated Page</p>
              <h4 className="mt-2 text-2xl font-law font-semibold text-slate-900">Legal Notices</h4>
              <p className="mt-2 text-sm text-slate-600">Separate listing, drafting header, and paper preview workflow for notices.</p>
            </button>
            <button onClick={() => { window.location.pathname = '/dashboard/rent-agreements'; }} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dedicated Page</p>
              <h4 className="mt-2 text-2xl font-law font-semibold text-slate-900">Rent Agreements</h4>
              <p className="mt-2 text-sm text-slate-600">Clause-first workflow for licensor/licensee agreements and expiry reminders.</p>
            </button>
            <button onClick={() => { window.location.pathname = '/dashboard/affidavits'; }} className="rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm hover:shadow-md">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Dedicated Page</p>
              <h4 className="mt-2 text-2xl font-law font-semibold text-slate-900">Affidavits</h4>
              <p className="mt-2 text-sm text-slate-600">Separate affidavit drafting space with notary-ready preview.</p>
            </button>
          </section>
        )}

        {serviceRoute && (
        <div>
          {loading ? (
            <div className="text-center py-12"><div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-300 border-t-slate-900" /></div>
          ) : filteredDocuments.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-slate-300">
              <Plus className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">No documents in this service yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredDocuments.map((doc) => {
                const timeline = timelineFor(doc);
                const queryThread = latestQueryThread(doc);
                const canSendSoftCopy = doc.status === 'signed' || doc.status === 'payment' || doc.payment_status === 'paid';
                const canDispatchHardCopy = doc.status === 'sent_soft_copy';
                const canEsign = doc.status === 'verified' || doc.status === 'reviewed';
                const hasGoldBadge = (doc.reviewed_by_profile?.years_experience || 0) >= 8;

                return (
                  <div key={doc.id} className={`bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-slate-200 border-l-4 ${statusAccent(doc.status)}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="w-5 h-5 text-slate-700" />
                          <h4 className="font-semibold text-slate-900 capitalize">{doc.document_type.replace('_', ' ')}</h4>
                          <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">{doc.status.replace(/_/g, ' ')}</span>
                        </div>
                        <p className="text-sm text-slate-600 mb-3">Created on {new Date(doc.created_at).toLocaleDateString()}</p>

                        {doc.reviewed_by_profile && (
                          <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-blue-900">Lawyer Consultation Hub</p>
                                <p className="text-xs text-blue-800">{doc.reviewed_by_profile.full_name} | Bar ID: {doc.reviewed_by_profile.bar_council_id || 'N/A'} | {doc.reviewed_by_profile.years_experience || 0} yrs</p>
                              </div>
                              {hasGoldBadge && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-amber-100 text-amber-800 border border-amber-300">
                                  <BadgeCheck className="w-3 h-3" /> Gold Badge
                                </span>
                              )}
                            </div>
                            <button onClick={() => setConsultDoc(doc)} className="mt-2 px-3 py-1.5 text-xs bg-blue-700 text-white rounded-lg inline-flex items-center gap-1"><PhoneCall className="w-3 h-3" />Book Consultation</button>
                          </div>
                        )}

                        <div className="grid md:grid-cols-7 gap-2 mb-2">
                          {timeline.map((tItem) => (
                            <div key={tItem.step} className={`text-[11px] rounded px-2 py-1 border ${tItem.done ? 'bg-green-50 border-green-200 text-green-800' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              {tItem.step.replace(/_/g, ' ')}
                            </div>
                          ))}
                        </div>

                        {queryThread.latestQuery && (
                          <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-800">Lawyer Query</p>
                            <p className="mt-2 text-sm text-amber-950">
                              {String(queryThread.latestQuery.metadata?.message || 'No query message available.')}
                            </p>
                            <p className="mt-1 text-[11px] text-amber-700">
                              Asked on {new Date(queryThread.latestQuery.at).toLocaleString()}
                            </p>

                            {queryThread.latestReply && (
                              <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-800">Your Last Reply</p>
                                <p className="mt-2 text-sm text-emerald-950">
                                  {String(queryThread.latestReply.metadata?.message || 'No reply message available.')}
                                </p>
                              </div>
                            )}

                            {queryThread.hasPendingReply && (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  value={queryReplies[doc.id] || ''}
                                  onChange={(event) => setQueryReplies((prev) => ({ ...prev, [doc.id]: event.target.value }))}
                                  rows={3}
                                  placeholder="Reply to the lawyer here..."
                                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm"
                                />
                                <button
                                  onClick={() => sendQueryReply(doc)}
                                  disabled={replyingDocId === doc.id}
                                  className="rounded-lg bg-amber-700 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                                >
                                  {replyingDocId === doc.id ? 'Sending reply...' : 'Send Reply'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {(doc.status === 'out_for_delivery' || doc.status === 'delivered') && (
                          <div className="mt-3 p-3 rounded-lg border bg-slate-50">
                            <p className="text-xs font-semibold text-slate-700 mb-2 inline-flex items-center gap-1"><MapPinned className="w-3.5 h-3.5" /> Case Tracking Map</p>
                            <div className="grid grid-cols-3 text-[11px] text-slate-600">
                              <p className="text-center">Lawyer Office</p>
                              <p className="text-center">Transit Hub</p>
                              <p className="text-center">Recipient City</p>
                            </div>
                            <div className="mt-2 h-1 bg-slate-200 rounded-full overflow-hidden">
                              <div className={`h-full bg-emerald-500 ${doc.status === 'delivered' ? 'w-full' : 'w-2/3'}`} />
                            </div>
                          </div>
                        )}

                        {renderNotificationBanner(doc)}
                      </div>

                      <div className="flex flex-col gap-2">
                        <button onClick={() => setPreviewDocument(doc)} className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors">
                          <Eye className="w-4 h-4" />{t('dashboard.quickAction')}
                        </button>
                        <button
                          onClick={async () => {
                            if (!window.confirm('Delete this document?')) return;
                            try {
                              await apiDocumentDelete(doc.id);
                              showToast('Document deleted', 'success');
                              await loadDocuments(search);
                            } catch (error) {
                              showToast(error instanceof Error ? error.message : t('errors.deleteFailed'), 'error');
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />{t('dashboard.delete')}
                        </button>
                        {canEsign && (
                          <button onClick={() => runEsign(doc)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                            <PenLine className="w-4 h-4" />{t('dashboard.requestEsign')}
                          </button>
                        )}
                        {canSendSoftCopy && (
                          <button onClick={() => runTransition(doc, 'sent_soft_copy')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                            <Send className="w-4 h-4" />{t('dashboard.sendSoftCopy')}
                          </button>
                        )}
                        {canDispatchHardCopy && (
                          <button onClick={() => runTransition(doc, 'out_for_delivery')} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors">
                            <Truck className="w-4 h-4" />{t('dashboard.dispatchHardCopy')}
                          </button>
                        )}
                        <button
                          onClick={() => handleVoiceStatus(doc)}
                          className="flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          <Mic className="w-4 h-4" />{speakingDocId === doc.id ? t('voice.speaking') : t('dashboard.voiceStatus')}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        )}

        <div className="bg-white border rounded-xl p-5">
          <h3 className="text-2xl font-law font-semibold text-slate-900 mb-3">{t('dashboard.vaultTitle')}</h3>
          {vaultDocs.length === 0 ? (
            <p className="text-sm text-slate-600">{t('dashboard.noVault')}</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-3">
              {vaultDocs.map((doc) => (
                <div key={`vault-${doc.id}`} className="border rounded-lg p-3 bg-slate-50">
                  <p className="font-medium text-slate-900 capitalize">{doc.document_type.replace('_', ' ')} #{doc.id.slice(0, 8)}</p>
                  <p className="text-xs text-slate-600">{expiryText(doc)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {consultDoc && (
        <div className="fixed inset-0 z-50 bg-black/35 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-xl shadow-2xl border p-5">
            <h4 className="text-xl font-law font-semibold text-slate-900">{t('dashboard.consultationTitle')}</h4>
            <p className="text-sm text-slate-600 mt-1">Lawyer: {consultDoc.reviewed_by_profile?.full_name || 'Assigned Lawyer'}</p>
            <label className="block text-sm font-medium text-slate-700 mt-4 mb-1">{t('dashboard.selectDateTime')}</label>
            <input
              type="datetime-local"
              value={consultDateTime}
              onChange={(e) => setConsultDateTime(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { setConsultDoc(null); setConsultDateTime(''); }} className="px-3 py-2 rounded-lg border">{t('dashboard.cancel')}</button>
              <button
                onClick={() => {
                  if (!consultDateTime) {
                    showToast(t('errors.selectSlot'), 'error');
                    return;
                  }
                  const lawyerId = consultDoc.reviewed_by || consultDoc.assigned_lawyer_id || consultDoc.reviewed_by_profile?.id;
                  if (!lawyerId) {
                    showToast(t('errors.generic'), 'error');
                    return;
                  }
                  apiBookLawyer(lawyerId, {
                    scheduled_for: consultDateTime,
                    document_id: consultDoc.id,
                    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  }).then(() => {
                    showToast(t('dashboard.consultationRequested', { time: new Date(consultDateTime).toLocaleString() }), 'success');
                    setConsultDoc(null);
                    setConsultDateTime('');
                  }).catch((error) => {
                    showToast(error instanceof Error ? error.message : t('errors.generic'), 'error');
                  });
                }}
                className="px-3 py-2 rounded-lg bg-slate-900 text-white inline-flex items-center gap-1"
              >
                <CalendarCheck2 className="w-4 h-4" /> {t('dashboard.confirmSlot')}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
