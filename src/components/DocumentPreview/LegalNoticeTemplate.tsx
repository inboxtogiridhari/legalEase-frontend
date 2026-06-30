import React, { useMemo } from 'react';
import { Document, LegalNoticeData } from '../../types';

interface LegalNoticeTemplateProps {
  document: Document;
}

/**
 * Safe mapping function to handle missing fields with placeholders.
 */
const safeMap = (value: any) => {
  const trimmed = String(value || '').trim();
  return trimmed !== '' ? trimmed : '[________________]';
};

export default function LegalNoticeTemplate({ document }: LegalNoticeTemplateProps) {
  const formData = document.form_data as LegalNoticeData;
  
  const mappedData = useMemo(() => {
    const noticeType = formData.noticeType || 'General Legal Notice';
    
    // Determine dynamic preamble/header based on noticeType
    let dynamicHeader = 'LEGAL NOTICE';
    let preamblePrefix = `Under instructions from and on behalf of my client ${safeMap(formData.senderName)}, I hereby serve you with the following legal notice:`;

    if (noticeType.toLowerCase().includes('cheque bounce')) {
      dynamicHeader = 'NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881';
    } else if (noticeType.toLowerCase().includes('money recovery')) {
      dynamicHeader = 'LEGAL NOTICE FOR RECOVERY OF MONEY';
    } else if (noticeType.toLowerCase().includes('tenant eviction')) {
      dynamicHeader = 'LEGAL NOTICE FOR EVICTION AND ARREARS OF RENT';
    }

    // Smart Placeholders
    const clientStory = safeMap(formData.description);
    const legalDemand = safeMap(formData.demands);
    const timeline = safeMap(formData.timeline || '15 days');
    
    // Interest Clause for Money/Cheque cases
    let interestClause = '';
    if (noticeType.toLowerCase().includes('money') || noticeType.toLowerCase().includes('cheque')) {
      const amount = formData.amount ? `₹${formData.amount}` : '[Amount]';
      interestClause = `My client further demands interest @ 18% per annum on the said amount of ${amount} from the date it became due until actual realization.`;
    }

    return {
      noticeDate: document.created_at 
        ? new Date(document.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
      place: safeMap(formData.senderAddress?.split(',').pop() || 'On Record'),
      recipientName: safeMap(formData.recipientName),
      recipientAddress: safeMap(formData.recipientAddress),
      subject: safeMap(formData.subject),
      clientName: safeMap(formData.senderName),
      dynamicHeader,
      preamblePrefix,
      clientStory,
      legalDemand,
      timeline,
      interestClause,
      lawyerName: safeMap(document.reviewed_by_name || 'Advocate on Record'),
      witness1: safeMap(formData.witness1 || '[Witness 1 Name]'),
      witness2: safeMap(formData.witness2 || '[Witness 2 Name]'),
    };
  }, [document, formData]);

  // Split facts and demands into numbered paragraphs if they aren't already
  const renderNumberedParas = (text: string, startNum = 1) => {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    return lines.map((line, index) => (
      <div key={index} className="numbered-para">
        <div className="para-num">{startNum + index}.</div>
        <div className="para-content">{line}</div>
      </div>
    ));
  };

  return (
    <div className="legal-notice-template font-serif text-[12pt] leading-[1.5] text-black bg-white p-[1in_1in_1in_1.5in] max-w-[8.27in] mx-auto shadow-none print:p-0 print:w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Tinos:ital,wght@0,400;0,700;1,400;1,700&display=swap');
        
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
        <div>Place: {mappedData.place}</div>
        <div>Date: {mappedData.noticeDate}</div>
      </div>

      <div className="court-title">{mappedData.dynamicHeader}</div>

      <div className="address-block">
        To,<br />
        <strong>{mappedData.recipientName}</strong><br />
        {mappedData.recipientAddress}
      </div>

      <div className="subject-line">
        RE: {mappedData.subject}
      </div>

      <div className="preamble">
        {mappedData.preamblePrefix}
      </div>

      <div className="body-paragraphs">
        {renderNumberedParas(mappedData.clientStory)}
        {mappedData.interestClause && (
          <div className="numbered-para">
            <div className="para-num">{mappedData.clientStory.split('\n').filter(l => l.trim() !== '').length + 1}.</div>
            <div className="para-content font-bold">{mappedData.interestClause}</div>
          </div>
        )}
      </div>

      <div className="demands-section mt-8">
        <p className="font-bold underline mb-4">LEGAL DEMAND:</p>
        <p className="mb-4">In view of the above facts, my client hereby demands that you comply with the following within <strong>{mappedData.timeline}</strong> of the receipt of this notice:</p>
        {renderNumberedParas(mappedData.legalDemand)}
      </div>

      <div className="footer-section">
        <p className="italic mb-10">Copy of this notice is retained in my office for further legal action if required.</p>
        
        <p className="font-bold">Yours faithfully,</p>
        
        <div className="signature-container">
          <div className="sig-box">
            <div className="sig-line">
              (Signature)<br />
              {mappedData.clientName}<br />
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
              {mappedData.lawyerName}<br />
              Advocate
            </div>
          </div>
        </div>

        <div className="witness-section">
          <p className="font-bold underline text-center mb-6">WITNESSES</p>
          <div className="witness-grid">
            <div>
              1. {mappedData.witness1}<br />
              _______________________<br />
              (Signature)
            </div>
            <div>
              2. {mappedData.witness2}<br />
              _______________________<br />
              (Signature)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
