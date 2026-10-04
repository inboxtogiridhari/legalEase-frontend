import React, { useMemo } from 'react';
import { Document } from '../../types';
import { StructuredLegalNoticeDocument } from '../../types/structuredDocument';
import LegalNoticeRenderer from './LegalNoticeRenderer';

interface LegalNoticeTemplateProps {
  document: Document;
  structured?: StructuredLegalNoticeDocument;
}

export default function LegalNoticeTemplate({ document, structured }: LegalNoticeTemplateProps) {
  const resolvedStructured = useMemo(() => {
    if (structured) return structured;
    const raw = document.structured_draft as Partial<StructuredLegalNoticeDocument> | undefined;
    if (raw && raw.noticeType && raw.advocate) return raw as StructuredLegalNoticeDocument;
    return undefined;
  }, [document, structured]);

  if (resolvedStructured) {
    return <LegalNoticeRenderer document={document} structured={resolvedStructured} />;
  }

  const formData = document.form_data as any;
  const noticeType = formData?.noticeType || 'General Legal Notice';
  const safeMap = (value: any) => {
    const trimmed = String(value || '').trim();
    return trimmed !== '' ? trimmed : '[________________]';
  };

  const dynamicHeader = noticeType.toLowerCase().includes('cheque bounce')
    ? 'NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881'
    : noticeType.toLowerCase().includes('money recovery')
      ? 'LEGAL NOTICE FOR RECOVERY OF MONEY'
      : noticeType.toLowerCase().includes('tenant eviction')
        ? 'LEGAL NOTICE FOR EVICTION AND ARREARS OF RENT'
        : 'LEGAL NOTICE';

  const clientStory = safeMap(formData?.description);
  const legalDemand = safeMap(formData?.demands);
  const timeline = safeMap(formData?.timeline || '15 days');

  let interestClause = '';
  if (noticeType.toLowerCase().includes('money') || noticeType.toLowerCase().includes('cheque')) {
    const amount = formData?.amount ? `Rs. ${formData.amount}` : '[Amount]';
    interestClause = `My client further demands interest @ 18% per annum on the said amount of ${amount} from the date it became due until actual realization.`;
  }

  const noticeDate = document.created_at
    ? new Date(document.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const place = safeMap(formData?.senderAddress?.split(',').pop() || 'On Record');

  const renderNumberedParas = (text: string, startNum = 1) => {
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    return lines.map((line, index) => (
      <div key={index} className="numbered-para">
        <div className="para-num">{startNum + index}.</div>
        <div className="para-content">{line}</div>
      </div>
    ));
  };

  return (
    <div className="legal-notice-template font-serif text-[12pt] leading-[1.5] text-black bg-white p-[1in_1in_1in_1.5in] max-w-[8.27in] mx-auto">
      <style>{`
        .legal-notice-template {
          font-family: "Times New Roman", "Tinos", Times, serif !important;
          text-align: justify;
          color: #000;
        }
        .court-title {
          font-size: 14pt;
          font-weight: bold;
          text-align: center;
          text-decoration: underline;
          margin-bottom: 30pt;
          text-transform: uppercase;
          line-height: 1.4;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 25pt;
          font-weight: bold;
        }
        .subject-line {
          font-weight: bold;
          text-decoration: underline;
          margin: 25pt 0;
          text-align: left;
          text-transform: uppercase;
        }
        .address-block {
          margin-bottom: 25pt;
          line-height: 1.5;
        }
        .preamble {
          font-weight: bold;
          margin-bottom: 15pt;
        }
        .numbered-para {
          display: flex;
          margin-bottom: 12pt;
          text-align: justify;
        }
        .para-num {
          min-width: 35pt;
          font-weight: bold;
        }
        .para-content {
          flex: 1;
        }
        .footer-section {
          margin-top: 60pt;
        }
        .signature-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 50pt;
          gap: 20pt;
        }
        .sig-box {
          flex: 1;
          display: flex;
          flex-col;
          align-items: center;
          text-align: center;
        }
        .sig-line {
          border-top: 1px solid black;
          width: 100%;
          padding-top: 5pt;
          font-weight: bold;
          margin-top: 40pt;
        }
        .witness-section {
          margin-top: 80pt;
          page-break-before: auto;
        }
        .witness-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 50pt;
          margin-top: 20pt;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          .legal-notice-template {
            padding: 1in 1in 1in 1.5in !important;
            width: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
          .witness-section, .signature-container {
            page-break-inside: avoid !important;
          }
          .body-paragraphs, .demands-section {
            page-break-inside: auto;
          }
        }
      `}</style>

      <div className="header-section">
        <div>Place: {place}</div>
        <div>Date: {noticeDate}</div>
      </div>

      <div className="court-title">{dynamicHeader}</div>

      <div className="address-block">
        To,<br />
        <strong>{safeMap(formData?.recipientName)}</strong><br />
        {safeMap(formData?.recipientAddress)}
      </div>

      <div className="subject-line">
        RE: {safeMap(formData?.subject)}
      </div>

      <div className="preamble">
        Under instructions from and on behalf of my client {safeMap(formData?.senderName)}, I hereby serve you with the following legal notice:
      </div>

      <div className="body-paragraphs">
        {renderNumberedParas(clientStory)}
        {interestClause && (
          <div className="numbered-para">
            <div className="para-num">{clientStory.split('\n').filter((l) => l.trim() !== '').length + 1}.</div>
            <div className="para-content font-bold">{interestClause}</div>
          </div>
        )}
      </div>

      <div className="demands-section mt-8">
        <p className="font-bold underline mb-4">LEGAL DEMAND:</p>
        <p className="mb-4">In view of the above facts, my client hereby demands that you comply with the following within <strong>{timeline}</strong> of the receipt of this notice:</p>
        {renderNumberedParas(legalDemand)}
      </div>

      <div className="footer-section">
        <p className="italic mb-10">Copy of this notice is retained in my office for further legal action if required.</p>
        
        <p className="font-bold">Yours faithfully,</p>
        
        <div className="signature-container">
          <div className="sig-box">
            <div className="sig-line">
              (Signature)<br />
              {safeMap(formData?.senderName)}<br />
              Client
            </div>
          </div>
          
          <div className="sig-box">
            {document.reviewed_by_signature_url && (
              <img 
                src={`${(import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')}${document.reviewed_by_signature_url}`} 
                alt="Lawyer Signature" 
                className="h-16 object-contain mb-[-30pt] mx-auto" 
              />
            )}
            <div className="sig-line">
              (Advocate Signature)<br />
              {safeMap(document.reviewed_by_name || 'Advocate on Record')}<br />
              Advocate
            </div>
          </div>
        </div>

        <div className="witness-section">
          <p className="font-bold underline text-center mb-6">WITNESSES</p>
          <div className="witness-grid">
            <div>
              1. {safeMap(formData?.witness1 || '[Witness 1 Name]')}<br />
              _______________________<br />
              (Signature)
            </div>
            <div>
              2. {safeMap(formData?.witness2 || '[Witness 2 Name]')}<br />
              _______________________<br />
              (Signature)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
