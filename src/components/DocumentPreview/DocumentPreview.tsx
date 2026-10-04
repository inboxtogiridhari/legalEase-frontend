import { ArrowLeft, Download, FileText } from 'lucide-react';
import { Document } from '../../types';
import LegalPaperPreview from './LegalPaperPreview';
import LegalNoticeTemplate from './LegalNoticeTemplate';

interface DocumentPreviewProps {
  document: Document;
  onClose: () => void;
}

export default function DocumentPreview({ document, onClose }: DocumentPreviewProps) {
  const displayDraft = document.lawyer_draft || document.ai_draft;
  const isHtmlDraft = /<html[\s>]|<body[\s>]|<div[\s>]|<p[\s>]/i.test(displayDraft || '');
  const isLegalNotice = document.document_type === 'legal_notice';
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  const deliveryMeta = (document.delivery_meta || {}) as Record<string, any>;
  const preferredPdfPath =
    deliveryMeta?.soft_copy?.pdf_url ||
    deliveryMeta?.pdf_url ||
    null;
  const signatureUrl = document.reviewed_by_signature_url
    ? `${apiBase}${document.reviewed_by_signature_url}`
    : '';
  const canRenderSignatureImage = /\.(png|jpg|jpeg|gif|webp)$/i.test(document.reviewed_by_signature_url || '');

  function handlePrint() {
    if (preferredPdfPath) {
      window.open(`${apiBase}${preferredPdfPath}`, '_blank', 'noopener,noreferrer');
      return;
    }
    
    if (isLegalNotice) {
      window.print();
      return;
    }
    
    if (isHtmlDraft) {
      window.print();
      return;
    }
    
    window.print();
  }

  const statusInfo = {
    draft: {
      title: 'Draft',
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      message: 'This document is in draft status.',
    },
    pending_review: {
      title: 'Pending Review',
      color: 'text-yellow-700',
      bg: 'bg-yellow-100',
      message: 'This document is awaiting lawyer review.',
    },
    drafting: {
      title: 'Drafting',
      color: 'text-slate-700',
      bg: 'bg-slate-100',
      message: 'AI-first draft is being prepared.',
    },
    lawyer_review: {
      title: 'Lawyer Review',
      color: 'text-yellow-700',
      bg: 'bg-yellow-100',
      message: 'Assigned lawyer is reviewing your draft.',
    },
    reviewed: {
      title: 'Reviewed',
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      message: 'This document has been reviewed by a lawyer.',
    },
    verified: {
      title: 'Verified',
      color: 'text-blue-700',
      bg: 'bg-blue-100',
      message: 'Lawyer verification is complete.',
    },
    signed: {
      title: 'Signed',
      color: 'text-violet-700',
      bg: 'bg-violet-100',
      message: 'Document has been digitally signed.',
    },
    payment: {
      title: 'Payment',
      color: 'text-indigo-700',
      bg: 'bg-indigo-100',
      message: 'Payment stage is complete.',
    },
    sent_soft_copy: {
      title: 'Sent (Soft Copy)',
      color: 'text-cyan-700',
      bg: 'bg-cyan-100',
      message: 'A soft copy has been sent.',
    },
    out_for_delivery: {
      title: 'Out for Delivery',
      color: 'text-orange-700',
      bg: 'bg-orange-100',
      message: 'Hard copy dispatch is in progress.',
    },
    delivered: {
      title: 'Delivered',
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
      message: 'Document delivery has been completed.',
    },
    completed: {
      title: 'Completed',
      color: 'text-green-700',
      bg: 'bg-green-100',
      message: 'This document is completed and ready for use.',
    },
  };

  const status = statusInfo[document.status] || statusInfo.draft;
  const dynamicHeader = `${status.title}: ${document.document_type.replace(/_/g, ' ')}`;

  return (
    <div className="space-y-6">
      <style>{`
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          
          nav, 
          header, 
          footer, 
          aside,
          button,
          .no-print, 
          .print\\:hidden,
          [role="complementary"],
          .floating-helpdesk,
          #support-drawer {
            display: none !important;
          }

          body, html {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }

          .print-document-container {
            padding: 0 !important;
            margin: 0 !important;
            border: 0 !important;
            box-shadow: none !important;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
          }

          .bg-slate-900, 
          .status-badge,
          .lawyer-notes-section,
          .document-details-section {
            display: none !important;
          }

          .legal-notice-template {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
        }
      `}</style>
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
        >
          <Download className="w-4 h-4" />
          Print / Download (Court-Ready)
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-slate-200 print:shadow-none print:border-0 print-document-container">
        <div className="bg-slate-900 px-6 py-4 rounded-t-xl print:hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-white" />
              <h2 className="text-xl font-bold text-white capitalize">
                {dynamicHeader}
              </h2>
            </div>
            <div className={`px-4 py-2 rounded-full text-sm font-semibold ${status.bg} ${status.color}`}>
              {status.title}
            </div>
          </div>
        </div>

        <div className="p-4 md:p-8 print:p-0">
          <div className="hidden print:block text-center border-b border-slate-400 pb-3 mb-6 no-print">
            <p className="font-bold text-lg tracking-wide uppercase">{document.document_type.replace(/_/g, ' ')} - COURT READY DRAFT</p>
            <p className="text-[10px] text-slate-600">Generated by LegalEase | Final legal validity subject to advocate review</p>
          </div>
          <div className={`${status.bg} border-l-4 border-slate-900 px-4 py-3 mb-6 print:hidden`}>
            <p className={`text-sm font-medium ${status.color}`}>{status.message}</p>
          </div>

          <div className="prose max-w-none relative">
            {isLegalNotice ? (
              <div className="rounded-[2rem] border border-slate-200 bg-[#eef1f5] p-4 md:p-8 print:p-0 print:border-0 print:bg-white">
                <div className="mx-auto bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)] print:shadow-none">
                  <LegalNoticeTemplate document={document} structured={document.structured_draft as any} />
                </div>
              </div>
            ) : isHtmlDraft ? (
              <LegalPaperPreview html={displayDraft} title={dynamicHeader} />
            ) : (
              <div className="rounded-[2rem] border border-slate-200 bg-[#eef1f5] p-4 md:p-8">
                <div className="mx-auto w-full max-w-[8.5in] min-h-[14in] bg-white p-10 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
                  <div className="whitespace-pre-wrap font-serif text-slate-900 leading-relaxed">
                    {displayDraft}
                  </div>
                </div>
              </div>
            )}
            {!isLegalNotice && !isHtmlDraft && ['reviewed', 'verified', 'completed', 'delivered'].includes(document.status) && (
              <div className="absolute bottom-8 right-8 w-32 h-16 flex items-center justify-end print:block" aria-hidden>
                {canRenderSignatureImage ? (
                  <img src={signatureUrl} alt="Lawyer signature" className="max-h-12 w-auto object-contain" />
                ) : (
                  <div className="text-xs text-slate-600 text-right">
                    <p>Signed by</p>
                    <p className="font-semibold">{document.reviewed_by_name || 'Verified Lawyer'}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {!isLegalNotice && (
            <div className="mt-16 grid grid-cols-2 gap-12 text-xs text-slate-800 border-t pt-8 print:hidden">
              <div>
                <p className="font-semibold mb-6">Witness 1</p>
                <p className="border-b border-slate-400 mb-2"></p>
                <p>Name:</p>
              </div>
              <div>
                <p className="font-semibold mb-6">Witness 2</p>
                <p className="border-b border-slate-400 mb-2"></p>
                <p>Name:</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {document.lawyer_notes && (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-6 print:hidden lawyer-notes-section">
          <h3 className="font-semibold text-slate-900 mb-3">Lawyer Notes</h3>
          <div className="bg-slate-50 p-4 rounded-lg">
            <p className="text-slate-700 whitespace-pre-wrap">{document.lawyer_notes}</p>
          </div>
        </div>
      )}

      <div className="bg-slate-50 rounded-xl p-6 print:hidden document-details-section">
        <h3 className="font-semibold text-slate-900 mb-4">Document Details</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-600 mb-1">Document Type</p>
            <p className="text-slate-900 font-medium capitalize">
              {document.document_type.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-slate-600 mb-1">Status</p>
            <p className="text-slate-900 font-medium capitalize">
              {document.status.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="text-slate-600 mb-1">Created On</p>
            <p className="text-slate-900 font-medium">
              {new Date(document.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          {document.reviewed_at && (
            <div>
              <p className="text-slate-600 mb-1">Reviewed On</p>
              <p className="text-slate-900 font-medium">
                {new Date(document.reviewed_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          )}
          <div>
            <p className="text-slate-600 mb-1">Assigned Lawyer / Reviewer</p>
            <p className="text-slate-900 font-medium">
              {document.reviewed_by_name || (['lawyer_review', 'pending_review', 'drafting'].includes(document.status) ? 'Awaiting lawyer assignment' : 'Not assigned')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
