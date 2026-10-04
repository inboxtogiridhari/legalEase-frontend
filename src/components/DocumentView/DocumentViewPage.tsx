import React, { useState } from 'react';
import { ArrowLeft, Download, Printer, ShieldCheck, Clock, FileText, Send, AlertCircle, MessageSquare } from 'lucide-react';
import { Document } from '../../types';
import { mapDocumentStatus, getNextAction, getContextualGuidance } from '../../utils/documentLifecycle';
import { DocumentTracking } from '../DocumentTracking/DocumentTracking';
import LegalNoticeTemplate from '../DocumentPreview/LegalNoticeTemplate';
import LegalPaperPreview from '../DocumentPreview/LegalPaperPreview';
import { apiDocumentQueryReply } from '../../lib/api';
import { useToast } from '../Toast/ToastProvider';

interface DocumentViewPageProps {
  document: Document;
  onClose: () => void;
  onContinueEditing?: (doc: Document) => void;
  onReload?: () => void;
}

export function DocumentViewPage({ document, onClose, onContinueEditing, onReload }: DocumentViewPageProps) {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'document' | 'tracking'>('document');
  const [replyMessage, setReplyMessage] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const statusMeta = mapDocumentStatus(document);
  const nextAction = getNextAction(document);
  const guidance = getContextualGuidance(document);

  const isLegalNotice = document.document_type === 'legal_notice';
  const displayDraft = document.lawyer_draft || document.ai_draft;
  const isHtmlDraft = /<html[\s>]|<body[\s>]|<div[\s>]|<p[\s>]/i.test(displayDraft || '');

  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  const deliveryMeta = (document.delivery_meta || {}) as Record<string, any>;
  const preferredPdfPath = deliveryMeta?.soft_copy?.pdf_url || deliveryMeta?.pdf_url || null;

  function handlePrintOrDownload() {
    if (preferredPdfPath) {
      window.open(`${apiBase}${preferredPdfPath}`, '_blank', 'noopener,noreferrer');
      return;
    }
    window.print();
  }

  async function handleSendReply() {
    if (!replyMessage.trim()) {
      showToast('Please type a reply message.', 'error');
      return;
    }
    try {
      setSendingReply(true);
      await apiDocumentQueryReply(document.id, { message: replyMessage.trim() });
      showToast('Reply sent to lawyer', 'success');
      setReplyMessage('');
      if (onReload) onReload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to send reply', 'error');
    } finally {
      setSendingReply(false);
    }
  }

  const typeTitle = document.document_type.replace(/_/g, ' ');

  return (
    <div className="space-y-8">
      {/* Print Styles */}
      <style>{`
        @media print {
          @page { size: A4; margin: 0; }
          nav, header, footer, button, .no-print { display: none !important; }
          body { background: white !important; }
          .print-container { padding: 0 !important; border: none !important; box-shadow: none !important; }
        }
      `}</style>

      {/* Top Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between no-print">
        <button
          onClick={onClose}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status-based Action Button */}
          {nextAction.actionType === 'edit' && onContinueEditing && (
            <button
              onClick={() => onContinueEditing(document)}
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--court-gold)] px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-sm hover:bg-[var(--court-gold)]/90"
            >
              Continue Editing
            </button>
          )}

          <button
            onClick={handlePrintOrDownload}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Printer className="h-4 w-4" />
            Print / Download
          </button>
        </div>
      </div>

      {/* Main Document Container Card */}
      <div className="rounded-[2rem] border border-slate-200 bg-white shadow-sm print-container">
        {/* Document Header */}
        <div className="bg-slate-900 px-6 py-6 sm:px-8 rounded-t-[2rem] text-white no-print">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-[var(--court-gold)]" />
                <h1 className="text-2xl font-bold capitalize">{typeTitle}</h1>
              </div>
              <p className="mt-2 text-xs font-mono text-slate-400">
                Document ID: {document.id} | Created: {new Date(document.created_at).toLocaleDateString()} | Updated: {new Date(document.updated_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <span className={`inline-flex rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider ${statusMeta.badgeBg} ${statusMeta.badgeText}`}>
                {statusMeta.label}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 px-6 sm:px-8 no-print">
          <button
            onClick={() => setActiveTab('document')}
            className={`border-b-2 py-4 px-4 text-sm font-semibold transition-colors ${
              activeTab === 'document' ? 'border-[#1a237e] text-[#1a237e]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Court Draft View
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            className={`border-b-2 py-4 px-4 text-sm font-semibold transition-colors ${
              activeTab === 'tracking' ? 'border-[#1a237e] text-[#1a237e]' : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Lifecycle Tracking & Events
          </button>
        </div>

        {/* Tab 1: Rendered Document View */}
        {activeTab === 'document' && (
          <div className="p-6 sm:p-10 space-y-8">
            {/* Lawyer Feedback Panel if Notes present */}
            {document.lawyer_notes && (
              <div className="rounded-3xl border border-indigo-200 bg-indigo-50/50 p-6 no-print space-y-4">
                <div className="flex items-center gap-3 text-indigo-900">
                  <MessageSquare className="h-5 w-5 text-indigo-700" />
                  <h3 className="text-lg font-bold">Advocate Review Feedback</h3>
                </div>
                <div className="rounded-2xl bg-white p-4 text-sm text-slate-800 border border-indigo-100 whitespace-pre-wrap">
                  {document.lawyer_notes}
                </div>

                {/* Reply Input Box */}
                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Reply to Advocate</label>
                  <div className="flex gap-2">
                    <input
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      placeholder="Type your clarification or reply to lawyer..."
                      className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm focus:border-indigo-600 focus:outline-none"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply}
                      className="inline-flex items-center gap-2 rounded-xl bg-indigo-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-800 disabled:opacity-50"
                    >
                      <Send className="h-4 w-4" />
                      {sendingReply ? 'Sending...' : 'Send Reply'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Document Content Box */}
            <div className="prose max-w-none">
              {isLegalNotice ? (
                <div className="rounded-[2rem] border border-slate-200 bg-[#eef1f5] p-4 sm:p-8 print:p-0 print:border-0 print:bg-white">
                  <div className="mx-auto bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] print:shadow-none">
                    <LegalNoticeTemplate document={document} structured={document.structured_draft as any} />
                  </div>
                </div>
              ) : isHtmlDraft ? (
                <LegalPaperPreview html={displayDraft} title={`${statusMeta.label}: ${typeTitle}`} />
              ) : (
                <div className="rounded-[2rem] border border-slate-200 bg-[#eef1f5] p-4 sm:p-8">
                  <div className="mx-auto w-full max-w-[8.5in] min-h-[11in] bg-white p-10 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                    <div className="whitespace-pre-wrap font-serif text-slate-900 leading-relaxed text-base">
                      {displayDraft || 'No draft content available.'}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata Footer Section */}
            <div className="border-t border-slate-200 pt-8 no-print space-y-4">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Document Metadata</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-600">
                <div>
                  <p className="text-slate-400">Document Type</p>
                  <p className="font-semibold text-slate-800 capitalize">{typeTitle}</p>
                </div>
                <div>
                  <p className="text-slate-400">Status</p>
                  <p className="font-semibold text-slate-800">{statusMeta.label}</p>
                </div>
                <div>
                  <p className="text-slate-400">Assigned Advocate</p>
                  <p className="font-semibold text-slate-800">
                    {document.reviewed_by_name || 'Awaiting lawyer assignment'}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400">Payment Status</p>
                  <p className="font-semibold text-slate-800 capitalize">{document.payment_status || 'Paid'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Tracking Stepper */}
        {activeTab === 'tracking' && (
          <div className="p-6 sm:p-10">
            <DocumentTracking document={document} />
          </div>
        )}
      </div>
    </div>
  );
}
