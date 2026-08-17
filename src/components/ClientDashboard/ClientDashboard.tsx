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
import { DocumentViewPage } from '../DocumentView/DocumentViewPage';
import ProfilePage from '../Profile/ProfilePage';
import { useToast } from '../Toast/ToastProvider';
import { mapDocumentStatus, getNextAction, calculateDashboardCounts } from '../../utils/documentLifecycle';

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
  const { user, profile } = useAuth();
  const { showToast, notifications } = useToast();
  const { t, i18n } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const isCreationPath = Boolean(serviceRoute) || [
    '/notice-form', '/rent-form', '/affidavit-form',
    '/dashboard/legal-notice', '/dashboard/legal-notices',
    '/dashboard/rent-agreement', '/dashboard/rent-agreements',
    '/dashboard/affidavit', '/dashboard/affidavits'
  ].includes(currentPath);
  const [showForm, setShowForm] = useState(isCreationPath);
  const [showProfile, setShowProfile] = useState(false);
  const [search, setSearch] = useState('');
  const [voiceQuestion, setVoiceQuestion] = useState('');
  const [voiceReply, setVoiceReply] = useState('');
  const [voiceLoading, setVoiceLoading] = useState(false);
  const [selectedType, setSelectedType] = useState<'legal_notice' | 'rent_agreement' | 'affidavit'>(
    serviceRoute ||
    (currentPath.includes('rent') ? 'rent_agreement' : currentPath.includes('affidavit') ? 'affidavit' : 'legal_notice')
  );
  const [selectedNoticeSubtype, setSelectedNoticeSubtype] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'legal_notice' | 'rent_agreement' | 'affidavit'>(
    serviceRoute || 'all'
  );
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'updated'>('newest');
  const [activeDraftId, setActiveDraftId] = useState<string | undefined>(undefined);
  const [skipDraftSession, setSkipDraftSession] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [heroIndex, setHeroIndex] = useState(0);
  const [consultDoc, setConsultDoc] = useState<Document | null>(null);
  const [consultDateTime, setConsultDateTime] = useState('');
  const [speakingDocId, setSpeakingDocId] = useState<string | null>(null);
  const [queryReplies, setQueryReplies] = useState<Record<string, string>>({});
  const [replyingDocId, setReplyingDocId] = useState<string | null>(null);

  useEffect(() => {
    if (serviceRoute) {
      setSelectedType(serviceRoute);
      setShowForm(true);
    }
  }, [serviceRoute]);

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
        const data = (await apiDocumentsList(q)) as Document[];
        setDocuments(data || []);

        // Route deep-linking support for /documents/:id, /documents/:id/edit, /documents/:id/preview, /documents/:id/tracking
        const docMatch = currentPath.match(/^\/documents\/([a-zA-Z0-9-]+)(\/(edit|preview|tracking))?$/);
        if (docMatch && data && data.length > 0) {
          const targetId = docMatch[1];
          const action = docMatch[3];
          const found = data.find((d) => d.id === targetId);
          if (found) {
            if (action === 'edit' && (found.is_session_draft || ['draft', 'drafting'].includes(found.status))) {
              setSelectedType(found.document_type);
              if (found.notice_subtype) setSelectedNoticeSubtype(found.notice_subtype);
              setShowForm(true);
            } else {
              setPreviewDocument(found);
            }
          }
        }
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
    } else {
      setSelectedNoticeSubtype('');
    }
    setActiveDraftId(undefined);
    setSkipDraftSession(true);
    setShowForm(true);
    const targetRoute = type === 'rent_agreement' ? '/dashboard/rent-agreements' : type === 'affidavit' ? '/dashboard/affidavits' : '/dashboard/legal-notices';
    if (window.location.pathname !== targetRoute) {
      window.history.pushState({}, '', targetRoute);
    }
  }

  function handleFormClose() {
    setShowForm(false);
    setSkipDraftSession(false);
    setActiveDraftId(undefined);
    if (window.location.pathname !== '/dashboard') {
      window.history.pushState({}, '', '/dashboard');
    }
    loadDocuments(search);
  }

  async function handleDeleteDocument(id: string) {
    if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }
    try {
      await apiDocumentDelete(id);
      showToast('Draft deleted successfully', 'success');
      loadDocuments(search);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to delete draft', 'error');
    }
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
          initialDraftId={activeDraftId}
          onClose={handleFormClose}
          onSuccess={() => {
            setSearch('');
            setTypeFilter('all');
            setStatusFilter('all');
            setSortOrder('newest');
            loadDocuments('');
          }}
        />
      </DashboardLayout>
    );
  }

  if (previewDocument) {
    return (
      <DashboardLayout onProfileClick={() => setShowProfile(true)}>
        <DocumentViewPage
          document={previewDocument}
          onClose={() => setPreviewDocument(null)}
          onContinueEditing={(doc) => {
            setPreviewDocument(null);
            setSelectedType(doc.document_type);
            if (doc.notice_subtype) setSelectedNoticeSubtype(doc.notice_subtype);
            setActiveDraftId(doc.id);
            setSkipDraftSession(false);
            setShowForm(true);
          }}
          onReload={() => loadDocuments(search)}
        />
      </DashboardLayout>
    );
  }

  const vaultDocs = documents.filter((d) =>
    ['signed', 'delivered'].includes(d.status)
  );

  const filteredDocuments = documents.filter((doc) => {
    // Type filter
    const matchesType =
      typeFilter === 'all' ||
      doc.document_type === typeFilter;

    // Status filter
    const matchesStatus =
      statusFilter === 'all' ||
      doc.status === statusFilter;

    // Search filter
    const searchTerm = search.trim().toLowerCase();

    const matchesSearch =
      !searchTerm ||
      typeLabel(doc.document_type).toLowerCase().includes(searchTerm) ||
      doc.document_type.toLowerCase().includes(searchTerm) ||
      doc.status?.toLowerCase().includes(searchTerm);

    return matchesType && matchesStatus && matchesSearch;
  });

  const dashboardCounts = calculateDashboardCounts(documents);

  const statusSummary = [
    { label: 'Drafts', count: dashboardCounts.drafts },
    { label: 'Awaiting Lawyer', count: dashboardCounts.awaitingLawyer },
    { label: 'Under Review', count: dashboardCounts.underReview },
    { label: 'Changes Requested', count: dashboardCounts.changesRequested },
    { label: 'Verified', count: dashboardCounts.verified },
    { label: 'Completed', count: dashboardCounts.completed },
  ];

  const docsToShow = [...filteredDocuments].sort((a, b) => {
    if (sortOrder === 'oldest') {
      return (
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
      );
    }

    if (sortOrder === 'updated') {
      return (
        new Date(b.updated_at || b.created_at).getTime() -
        new Date(a.updated_at || a.created_at).getTime()
      );
    }

    // newest
    return (
      new Date(b.created_at).getTime() -
      new Date(a.created_at).getTime()
    );
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Welcome back';

  function typeLabel(type: Document['document_type']) {
    return type === 'legal_notice' ? 'Legal Notice' : type === 'rent_agreement' ? 'Rent Agreement' : 'Affidavit';
  }

  function statusDisplay(status: string) {
    if (['draft', 'drafting'].includes(status)) return 'Draft';
    if (['pending_review', 'lawyer_review'].includes(status)) return 'Awaiting Lawyer';
    if (status === 'reviewed') return 'Under Review';
    if (['verified', 'signed', 'payment'].includes(status)) return 'Verified';
    if (['sent_soft_copy', 'out_for_delivery', 'delivered', 'completed'].includes(status)) return 'Completed';
    return status.replace(/_/g, ' ');
  }

  function lawyerStatus(doc: Document) {
    if (doc.reviewed_by_profile?.full_name) return `Reviewed by ${doc.reviewed_by_profile.full_name}`;
    if (doc.reviewed_by_name) return `Reviewed by ${doc.reviewed_by_name}`;
    if (['pending_review', 'lawyer_review'].includes(doc.status)) return 'Awaiting lawyer assignment';
    return 'Not assigned yet';
  }

  const recentNotifications = notifications.slice(0, 5);

  return (
    <DashboardLayout onProfileClick={() => setShowProfile(true)}>
      <div className="space-y-8">
        <section className="grid gap-6 xl:grid-cols-[1.6fr,1fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
            <small className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Client command center</small>
            <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-slate-500">{greeting}, {profile?.full_name?.split(' ')[0] || 'there'}</p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">Your legal workspace</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">Create, track and manage your legal documents with a secure, advocate-backed workflow.</p>
              </div>
              <button
                onClick={() => handleCreateNew('legal_notice')}
                className="inline-flex items-center justify-center rounded-2xl bg-[var(--court-gold)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-card transition hover:bg-[var(--court-gold)]/95"
              >
                Create Document
              </button>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {statusSummary.map((stat) => (
                <div key={stat.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                  <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold text-slate-900">{stat.count}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Document Overview</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">{serviceRoute ? typeLabel(serviceRoute) : 'All documents'}</h2>
                </div>
                <span className="rounded-2xl bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{docsToShow.length} items</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                  The dashboard reflects live case progress from your documents. Use the quick cards below to start a new premium draft or continue an active case.
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Verified workflows</p>
                    <p className="mt-2 text-sm text-slate-600">Every notice, agreement and affidavit includes lawyer review and legal quality checks.</p>
                  </div>
                  <div className="rounded-3xl border border-slate-200 bg-white p-4">
                    <p className="text-sm font-semibold text-slate-900">Activity feed</p>
                    <p className="mt-2 text-sm text-slate-600">Latest notifications and document milestones are shown in the activity panel.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Activity</p>
                  <h2 className="mt-2 text-2xl font-semibold text-slate-900">Recent updates</h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{recentNotifications.length} items</span>
              </div>
              <div className="mt-6 space-y-4">
                {recentNotifications.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                    No activity yet. Your latest document updates will appear here.
                  </div>
                ) : (
                  recentNotifications.map((item) => (
                    <article key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="mt-1 text-sm text-slate-600">{item.message}</p>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(item.created_at).toLocaleString()}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-white px-2 py-1 border border-slate-200">{item.milestone || item.channel}</span>
                        {item.deep_link_url ? (
                          <a href={item.deep_link_url} className="text-indigo-700 underline">Open</a>
                        ) : null}
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Create a premium draft</p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">Start your next document</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              <button onClick={() => handleCreateNew('legal_notice')} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">Legal Notice</button>
              <button onClick={() => handleCreateNew('rent_agreement')} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">Rent Agreement</button>
              <button onClick={() => handleCreateNew('affidavit')} className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50">Affidavit</button>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <button onClick={() => handleCreateNew('legal_notice', window.localStorage.getItem('preferred_notice_type') || 'money_recovery')} className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-[var(--court-midnight)] text-white shadow-card">
                <FileText className="h-6 w-6" />
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-900">Legal Notice</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Issue a formal legal notice with review and download-ready delivery.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--court-midnight)]">
                Start draft
                <span aria-hidden="true">→</span>
              </span>
            </button>
            <button onClick={() => handleCreateNew('rent_agreement')} className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-[var(--court-gold)] text-slate-900 shadow-card">
                <FileText className="h-6 w-6" />
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-900">Rent Agreement</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Create a tenancy agreement with state-specific clauses and witness-ready format.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--court-midnight)]">
                Start draft
                <span aria-hidden="true">→</span>
              </span>
            </button>
            <button onClick={() => handleCreateNew('affidavit')} className="group rounded-[1.75rem] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-3xl bg-slate-900 text-white shadow-card">
                <Plus className="h-6 w-6" />
              </div>
              <p className="mt-5 text-lg font-semibold text-slate-900">Affidavit</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Build an affidavit with verified statements and a notary-ready preview.</p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[var(--court-midnight)]">
                Start draft
                <span aria-hidden="true">→</span>
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Document Management</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-900">Your Documents & Drafts</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${typeFilter === 'all'
                    ? 'bg-[var(--court-midnight)] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                All
              </button>
              <button
                onClick={() => setTypeFilter('legal_notice')}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${typeFilter === 'legal_notice'
                    ? 'bg-[var(--court-midnight)] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                Notices
              </button>
              <button
                onClick={() => setTypeFilter('rent_agreement')}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${typeFilter === 'rent_agreement'
                    ? 'bg-[var(--court-midnight)] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                Rent
              </button>
              <button
                onClick={() => setTypeFilter('affidavit')}
                className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${typeFilter === 'affidavit'
                    ? 'bg-[var(--court-midnight)] text-white shadow-sm'
                    : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
              >
                Affidavits
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative flex-1">
              <FileSearch className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, type, or status..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 focus:border-[var(--court-midnight)] focus:outline-none focus:ring-2 focus:ring-[var(--court-midnight)]/10"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-[var(--court-midnight)] focus:outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="drafting">In Draft</option>
                <option value="lawyer_review">Under Lawyer Review</option>
                <option value="verified">Verified / Approved</option>
                <option value="delivered">Delivered / Completed</option>
              </select>

              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'updated')}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-slate-700 focus:border-[var(--court-midnight)] focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="updated">Recently Updated</option>
              </select>

              {(search || typeFilter !== 'all' || statusFilter !== 'all' || sortOrder !== 'newest') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setTypeFilter('all');
                    setStatusFilter('all');
                    setSortOrder('newest');
                  }}
                  className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50">
            {loading ? (
              <div className="flex min-h-[240px] items-center justify-center p-10">
                <div className="inline-block h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-slate-900" />
              </div>
            ) : docsToShow.length === 0 ? (
              <div className="p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-100 text-[var(--court-midnight)]">
                  <Plus className="h-8 w-8" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-slate-900">No matching documents found</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {documents.length === 0
                    ? 'No documents available yet. Start by creating a notice, agreement, or affidavit.'
                    : 'No documents match your active search or filters.'}
                </p>
                <button
                  onClick={() => handleCreateNew('legal_notice')}
                  className="mt-6 inline-flex rounded-2xl bg-[var(--court-gold)] px-5 py-3 text-sm font-semibold text-slate-900 shadow-card hover:bg-[var(--court-gold)]/95"
                >
                  Create Document
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-700">
                  <thead className="bg-slate-100 text-slate-600 font-medium">
                    <tr>
                      <th className="px-6 py-4">Document Type</th>
                      <th className="px-6 py-4">Created Date</th>
                      <th className="px-6 py-4">Updated Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Lawyer</th>
                      <th className="px-6 py-4">Last Activity</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docsToShow.map((doc) => {
                      const meta = mapDocumentStatus(doc);
                      const act = getNextAction(doc);
                      const isDraft = doc.is_session_draft || doc.status === 'drafting';
                      const lastEvent = Array.isArray(doc.timeline_events) && doc.timeline_events.length > 0
                        ? doc.timeline_events[doc.timeline_events.length - 1]
                        : null;
                      const lastActivityLabel = lastEvent?.stage
                        ? `${lastEvent.stage.replace(/_/g, ' ')} (${lastEvent.actor || 'system'})`
                        : isDraft ? 'Draft updated' : 'Document submitted';
                      return (
                        <tr key={doc.id} className="border-t border-slate-200 bg-white hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            <div className="flex flex-col">
                              <span>{typeLabel(doc.document_type)}</span>
                              {doc.notice_subtype && (
                                <span className="text-xs text-slate-500 font-normal capitalize">
                                  {doc.notice_subtype.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                            {new Date(doc.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4 text-slate-600 font-mono text-xs">
                            {new Date(doc.updated_at || doc.created_at).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider ${meta.badgeBg} ${meta.badgeText}`}
                            >
                              {meta.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{lawyerStatus(doc)}</td>
                          <td className="px-6 py-4 text-slate-600 text-xs capitalize">{lastActivityLabel}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  if (act.actionType === 'edit') {
                                    setSelectedType(doc.document_type);
                                    if (doc.notice_subtype) setSelectedNoticeSubtype(doc.notice_subtype);
                                    setActiveDraftId(doc.id);
                                    setSkipDraftSession(false);
                                    setShowForm(true);
                                  } else {
                                    setPreviewDocument(doc);
                                  }
                                }}
                                className="inline-flex rounded-2xl bg-[var(--court-midnight)] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[var(--court-midnight)]/90"
                              >
                                {act.label}
                              </button>
                              {isDraft && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  className="rounded-2xl border border-slate-200 bg-white p-2 text-slate-400 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition"
                                  title="Delete draft"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr,0.8fr]">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.2em] text-slate-500">AI assistant</p>
                <h2 className="mt-2 text-2xl font-semibold text-slate-900">Quick legal actions</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Live</span>
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-3">
                <Mic className="h-5 w-5 text-slate-700" />
                <p className="text-sm font-semibold text-slate-900">Ask the assistant</p>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <input
                  value={voiceQuestion}
                  onChange={(e) => setVoiceQuestion(e.target.value)}
                  placeholder="Ask about your document status"
                  className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:border-[var(--court-midnight)] focus:outline-none focus:ring-2 focus:ring-[var(--court-midnight)]/10"
                />
                <button
                  onClick={askVoiceFaq}
                  className="rounded-2xl bg-[var(--court-midnight)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--court-midnight)]/90"
                >
                  Ask
                </button>
              </div>
              {voiceReply && <p className="mt-4 rounded-3xl bg-white p-4 text-sm leading-6 text-slate-700">{voiceReply}</p>}
            </div>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Vault</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Filed documents</h2>
            <div className="mt-6 grid gap-4">
              {vaultDocs.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  No completed filings yet. Complete a document to move it into your vault.
                </div>
              ) : (
                vaultDocs.map((doc) => (
                  <div key={doc.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm font-semibold text-slate-900">{typeLabel(doc.document_type)}</p>
                    <p className="mt-1 text-xs text-slate-600">Filed {new Date(doc.created_at).toLocaleDateString()}</p>
                    <p className="mt-2 text-sm text-slate-700">{expiryText(doc)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
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
