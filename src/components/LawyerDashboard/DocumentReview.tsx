import { useMemo, useState } from 'react';
import { ArrowLeft, Save, CheckCircle, Truck, MessageSquare, User, ShieldCheck, AlertTriangle } from 'lucide-react';
import { apiApproveDispatch, apiDocumentQuery, apiDocumentUpdate } from '../../lib/api';
import { Document } from '../../types';
import { useToast } from '../Toast/ToastProvider';
import LegalPaperPreview from '../DocumentPreview/LegalPaperPreview';

interface DocumentReviewProps {
  document: Document;
  onClose: () => void;
}

export default function DocumentReview({ document, onClose }: DocumentReviewProps) {
  const { showToast } = useToast();
  const [reviewDecision, setReviewDecision] = useState<'approved' | 'needs_changes' | 'query'>('approved');
  const [lawyerNotes, setLawyerNotes] = useState(document.lawyer_notes || 'Document reviewed and ready for dispatch.');
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [success, setSuccess] = useState(false);

  const clientProfile = document.client_profile;
  const formData = (document.form_data && typeof document.form_data === 'object'
    ? document.form_data
    : {}) as Record<string, unknown>;
  const queryTimeline = useMemo(
    () =>
      [...(document.timeline_events || [])]
        .filter((event) => ['query', 'query_reply'].includes(event.stage))
        .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime()),
    [document.timeline_events],
  );

  const recipientName = String(formData.recipientName || formData.tenantName || 'Recipient');
  const recipientAddress = String(formData.recipientAddress || formData.propertyAddress || 'Address not provided');

  const reviewSummary = useMemo(() => {
    if (document.document_type === 'legal_notice') return 'Notice facts, legal basis, and demand are reviewed; ensure the chronology and compliance language are consistent.';
    if (document.document_type === 'rent_agreement') return 'Rent clauses, maintenance, deposit, and termination clauses are checked for legal consistency and clarity.';
    return 'Affidavit statements are verified for factual accuracy, legal grounding, and signature-ready language.';
  }, [document.document_type]);

  async function handleSave() {
    setLoading(true);
    try {
      const nextStatus = reviewDecision === 'approved' ? 'reviewed' : reviewDecision === 'needs_changes' ? 'pending_review' : 'lawyer_review';
      await apiDocumentUpdate(document.id, {
        lawyer_notes: lawyerNotes,
        status: nextStatus,
      });

      setSuccess(true);
      showToast('Review saved', 'success');
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (error) {
      console.error('Error saving review:', error);
      showToast(error instanceof Error ? error.message : 'Failed to save review', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleApproveDispatch() {
    if (!window.confirm('Approve and dispatch hard copy?')) return;
    setDispatching(true);
    try {
      await apiDocumentUpdate(document.id, {
        lawyer_notes: lawyerNotes,
        status: 'reviewed',
      });
      const result = await apiApproveDispatch(document.id, {
        delivery_address: {
          name: recipientName,
          address: recipientAddress,
        },
      });
      showToast(`Dispatched. Tracking ID: ${result.tracking_id}`, 'success');
      setTimeout(() => onClose(), 1200);
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Dispatch failed', 'error');
    } finally {
      setDispatching(false);
    }
  }

  async function handleQueryClient() {
    const message = window.prompt('Enter your query for the client:');
    if (!message) return;
    setQuerying(true);
    try {
      await apiDocumentQuery(document.id, { message });
      setReviewDecision('query');
      setLawyerNotes((current) => current ? `${current}\n\nFollow-up query: ${message}` : `Follow-up query: ${message}`);
      showToast('Query sent to client', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to send query', 'error');
    } finally {
      setQuerying(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto mt-20 max-w-md rounded-xl bg-white p-12 text-center shadow-lg">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
        <h3 className="mb-2 text-2xl font-bold text-slate-900">Review Saved!</h3>
        <p className="text-slate-600">The document status has been updated successfully.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button onClick={onClose} className="flex items-center gap-2 text-slate-600 hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold capitalize text-slate-900">Review: {document.document_type.replace('_', ' ')}</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleQueryClient}
            disabled={querying}
            className="rounded-lg bg-slate-200 px-4 py-2 font-semibold text-slate-900 transition-colors hover:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {querying ? 'Sending...' : 'Query'}
            </span>
          </button>
          <button
            onClick={handleApproveDispatch}
            disabled={dispatching}
            className="rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {dispatching ? 'Dispatching...' : 'Approve & Dispatch'}
            </span>
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="rounded-lg bg-green-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {loading ? 'Saving...' : 'Save Review'}
            </span>
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-900 px-6 py-4">
              <h3 className="font-semibold text-white">Client Snapshot</h3>
            </div>
            <div className="space-y-3 p-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100">
                  <User className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{clientProfile?.full_name || 'Client'}</p>
                  <p className="text-xs text-slate-500">{clientProfile?.email || '-'}</p>
                </div>
              </div>
              <div className="text-sm text-slate-700">
                <p><strong>Phone:</strong> {clientProfile?.phone_number || '-'}</p>
                <p><strong>Address:</strong> {clientProfile?.address || '-'}</p>
                <p><strong>History:</strong> {clientProfile?.history_count ?? 0} documents</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">
                <p className="mb-1 font-medium text-slate-900">Reason / Context</p>
                <p>{clientProfile?.latest_reason || 'Not specified'}</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-100 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Review Decision</h3>
            </div>
            <div className="space-y-3 p-5">
              {[
                { key: 'approved', label: 'Approved', description: 'Ready for dispatch', icon: ShieldCheck },
                { key: 'needs_changes', label: 'Needs changes', description: 'Return for revision', icon: AlertTriangle },
                { key: 'query', label: 'Send follow-up query', description: 'Request clarifications', icon: MessageSquare },
              ].map((option) => {
                const Icon = option.icon;
                const active = reviewDecision === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setReviewDecision(option.key as typeof reviewDecision)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-colors ${
                      active ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <div className={`mt-0.5 rounded-md p-1.5 ${active ? 'bg-indigo-100 text-indigo-700' : 'bg-white text-slate-600'}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-600">{option.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-100 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Original Client Input</h3>
            </div>
            <div className="space-y-4 p-6">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key}>
                  <p className="mb-1 text-sm font-medium capitalize text-slate-700">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                    {typeof value === 'string' ? value : JSON.stringify(value, null, 2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 bg-slate-100 px-6 py-4">
              <h3 className="font-semibold text-slate-900">Structured Review</h3>
            </div>
            <div className="space-y-4 p-6">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900">
                <p className="font-semibold">Legal review checklist</p>
                <p className="mt-1">{reviewSummary}</p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Recipient</p>
                  <p className="mt-2 font-semibold text-slate-900">{recipientName}</p>
                  <p className="text-sm text-slate-600">{recipientAddress}</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Document type</p>
                  <p className="mt-2 font-semibold capitalize text-slate-900">{document.document_type.replace('_', ' ')}</p>
                  <p className="text-sm text-slate-600">{document.state_law || 'State law not specified'}</p>
                </div>
              </div>

              <LegalPaperPreview
                html={document.lawyer_draft || document.ai_draft || '<p>No draft available.</p>'}
                title={`Drafting: ${document.document_type.replace(/_/g, ' ')}`}
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Lawyer Notes</h3>
            <textarea
              value={lawyerNotes}
              onChange={(e) => setLawyerNotes(e.target.value)}
              rows={5}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none transition focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              placeholder="Add your legal review notes, risk flags, or compliance instructions..."
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="mb-4 font-semibold text-slate-900">Query Thread</h3>
            {queryTimeline.length === 0 ? (
              <p className="text-sm text-slate-500">No clarification thread yet.</p>
            ) : (
              <div className="space-y-3">
                {queryTimeline.map((event) => {
                  const isReply = event.stage === 'query_reply';
                  return (
                    <div
                      key={event.id}
                      className={`rounded-lg border p-3 ${isReply ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}
                    >
                      <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${isReply ? 'text-emerald-800' : 'text-amber-800'}`}>
                        {isReply ? 'Client Reply' : 'Lawyer Query'}
                      </p>
                      <p className="mt-2 text-sm text-slate-900">{String(event.metadata?.message || '')}</p>
                      <p className="mt-1 text-[11px] text-slate-500">{new Date(event.at).toLocaleString()}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
