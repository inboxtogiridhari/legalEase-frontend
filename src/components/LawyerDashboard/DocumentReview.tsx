import { useState } from 'react';
import { ArrowLeft, Save, CheckCircle, Truck, MessageSquare, User } from 'lucide-react';
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
  const [lawyerDraft, setLawyerDraft] = useState(document.lawyer_draft || document.ai_draft);
  const [lawyerNotes, setLawyerNotes] = useState(document.lawyer_notes || '');
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [querying, setQuerying] = useState(false);
  const [success, setSuccess] = useState(false);

  const clientProfile = document.client_profile;
  const queryTimeline = [...(document.timeline_events || [])]
    .filter((event) => ['query', 'query_reply'].includes(event.stage))
    .sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());
  const recipientName =
    'recipientName' in document.form_data
      ? document.form_data.recipientName
      : 'tenantName' in document.form_data
        ? document.form_data.tenantName
        : 'Recipient';
  const recipientAddress =
    'recipientAddress' in document.form_data
      ? document.form_data.recipientAddress
      : 'propertyAddress' in document.form_data
        ? document.form_data.propertyAddress
        : 'Address not provided';

  async function handleSave() {
    setLoading(true);
    try {
      await apiDocumentUpdate(document.id, {
        lawyer_draft: lawyerDraft,
        lawyer_notes: lawyerNotes,
        status: 'verified',
      });

      setSuccess(true);
      showToast('Review saved', 'success');
      setTimeout(() => {
        onClose();
      }, 1500);
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
      const result = await apiApproveDispatch(document.id, {
        delivery_address: {
          name: recipientName,
          address: recipientAddress,
        },
      });
      showToast(`Dispatched. Tracking ID: ${result.tracking_id}`, 'success');
      setTimeout(() => onClose(), 1500);
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
      showToast('Query sent to client', 'success');
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Failed to send query', 'error');
    } finally {
      setQuerying(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-md mx-auto mt-20">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Review Saved!</h3>
        <p className="text-slate-600">The document has been marked as reviewed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <h2 className="text-2xl font-bold text-slate-900 capitalize">
          Review: {document.document_type.replace('_', ' ')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleQueryClient}
            disabled={querying}
            className="flex items-center gap-2 px-4 py-2 bg-slate-200 text-slate-900 rounded-lg font-semibold hover:bg-slate-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
            {querying ? 'Sending...' : 'Query'}
          </button>
          <button
            onClick={handleApproveDispatch}
            disabled={dispatching}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Truck className="w-4 h-4" />
            {dispatching ? 'Dispatching...' : 'Approve & Dispatch'}
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {loading ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
            <h3 className="font-semibold text-white">Client Snapshot</h3>
          </div>
          <div className="p-6 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                <User className="w-5 h-5 text-slate-600" />
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
            <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700">
              <p className="font-medium text-slate-900 mb-1">Reason / Context</p>
              <p>{clientProfile?.latest_reason || 'Not specified'}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200">
          <div className="bg-slate-100 px-6 py-4 border-b border-slate-200">
            <h3 className="font-semibold text-slate-900">Original Client Data</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(document.form_data as unknown as Record<string, string>).map(([key, value]) => (
                <div key={key}>
                  <p className="text-sm font-medium text-slate-700 mb-1 capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="text-slate-900 bg-slate-50 p-3 rounded-lg whitespace-pre-wrap">
                    {value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200">
          <div className="bg-slate-900 px-6 py-4 border-b border-slate-700">
            <h3 className="font-semibold text-white">Edit Draft Document</h3>
          </div>
          <div className="p-6 space-y-4">
            <textarea
              value={lawyerDraft}
              onChange={(e) => setLawyerDraft(e.target.value)}
              className="w-full h-56 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none font-mono text-sm"
              placeholder="Edit the draft HTML..."
            />
            <LegalPaperPreview
              html={lawyerDraft}
              title={`Drafting: ${document.document_type.replace(/_/g, ' ')}`}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Lawyer Notes</h3>
        <textarea
          value={lawyerNotes}
          onChange={(e) => setLawyerNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none"
          placeholder="Add any notes, suggestions, or changes made..."
        />
      </div>

      <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6">
        <h3 className="font-semibold text-slate-900 mb-4">Query Thread</h3>
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
  );
}
