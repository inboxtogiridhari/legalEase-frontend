import { Document } from '../../types';
import { StructuredLegalNoticeDocument } from '../../types/structuredDocument';

interface LegalNoticeRendererProps {
  document: Document;
  structured?: StructuredLegalNoticeDocument;
}

export default function LegalNoticeRenderer({ document, structured }: LegalNoticeRendererProps) {
  const data = structured || (document.form_data as unknown as StructuredLegalNoticeDocument);
  const noticeType = data?.noticeType || 'general';
  const isVerified = ['verified', 'completed', 'delivered', 'signed'].includes(document.status);

  const headerTitle = getHeaderTitle(noticeType);
  const refNo = buildRefNo(document.id, document.document_type);

  return (
    <div className="legal-notice-renderer font-serif text-[12pt] leading-[1.5] text-black bg-white p-[1in_1in_1in_1.5in] max-w-[8.27in] mx-auto">
      <style>{`
        .legal-notice-renderer {
          font-family: "Times New Roman", "Tinos", Times, serif !important;
          text-align: justify;
          color: #000;
          box-sizing: border-box;
        }
        .legal-notice-renderer * {
          box-sizing: border-box;
        }
        .court-title {
          font-size: 14pt;
          font-weight: 700;
          text-align: center;
          text-decoration: underline;
          margin-bottom: 10pt;
          text-transform: uppercase;
          line-height: 1.4;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          margin-bottom: 18pt;
          font-weight: 700;
          font-size: 11pt;
        }
        .letterhead {
          display: table;
          width: 100%;
          margin-bottom: 18pt;
          page-break-inside: avoid;
        }
        .letterhead-left, .letterhead-right {
          display: table-cell;
          vertical-align: top;
          width: 50%;
        }
        .letterhead-right {
          text-align: right;
        }
        .advocate-name {
          font-size: 14pt;
          font-weight: 700;
          letter-spacing: 0.02em;
        }
        .advocate-meta {
          font-size: 11pt;
        }
        .advocate-firm {
          font-size: 11pt;
          font-weight: 600;
        }
        .notice-meta-row {
          display: table;
          width: 100%;
          margin-bottom: 16pt;
          font-size: 11pt;
        }
        .notice-meta-row > div {
          display: table-cell;
          width: 50%;
          vertical-align: top;
        }
        .notice-meta-row > div:last-child {
          text-align: right;
        }
        .underlined {
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        .address-block {
          margin-bottom: 18pt;
          line-height: 1.5;
        }
        .subject-line {
          font-weight: bold;
          text-decoration: underline;
          margin: 20pt 0;
          text-align: left;
          text-transform: uppercase;
        }
        .preamble {
          font-weight: bold;
          margin-bottom: 12pt;
        }
        .numbered-para {
          display: flex;
          margin-bottom: 10pt;
          text-align: justify;
        }
        .para-num {
          min-width: 28pt;
          font-weight: 700;
          flex-shrink: 0;
        }
        .para-content {
          flex: 1;
        }
        .section-heading {
          font-weight: 700;
          margin: 14pt 0 8pt;
          text-transform: uppercase;
          font-size: 12pt;
        }
        .demand-block {
          margin-top: 12pt;
        }
        .consequences-block {
          margin-top: 12pt;
        }
        .closing-block {
          margin-top: 16pt;
        }
        .retained-para {
          font-style: italic;
          margin-top: 10pt;
        }
        .witness-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40pt;
          margin-top: 18pt;
        }
        .witness-item {
          text-align: left;
        }
        .witness-name {
          font-weight: 700;
          margin-bottom: 6pt;
        }
        .witness-line {
          border-top: 1px solid #111111;
          padding-top: 36pt;
          text-align: center;
        }
        .witness-label {
          text-align: center;
          font-size: 10pt;
          margin-top: 4pt;
        }
        .annexures-block {
          margin-top: 12pt;
        }
        .signature-grid {
          display: table;
          width: 100%;
          margin-top: 28pt;
        }
        .signature-line {
          display: table-cell;
          width: 50%;
          padding-right: 18pt;
          vertical-align: bottom;
        }
        .signature-line span {
          display: block;
          border-top: 1px solid #111111;
          padding-top: 36pt;
          text-align: center;
        }
        .attestation-block {
          display: table;
          width: 100%;
          margin-top: 28pt;
        }
        .attestation-left, .attestation-right {
          display: table-cell;
          vertical-align: bottom;
          width: 50%;
        }
        .attestation-right {
          text-align: right;
        }
        .seal-image {
          width: 1.2in;
          height: 1.2in;
          object-fit: contain;
          display: block;
          margin-bottom: 6pt;
        }
        .seal-meta {
          font-size: 10pt;
          margin-bottom: 8pt;
        }
        .inline-qr {
          width: 0.8in;
          height: 0.8in;
          object-fit: contain;
          display: block;
        }
        .signature-image {
          max-width: 1.8in;
          max-height: 0.9in;
          object-fit: contain;
          display: inline-block;
          margin-bottom: 4pt;
        }
        .signature-placeholder {
          min-height: 0.8in;
          display: inline-flex;
          align-items: flex-end;
          justify-content: flex-end;
          min-width: 1.8in;
          margin-bottom: 4pt;
        }
        .signature-caption {
          font-weight: 700;
        }
        .signature-subcaption {
          font-size: 10pt;
        }
        .signature-stack {
          display: inline-flex;
          gap: 14pt;
          align-items: flex-end;
        }
        .signature-party {
          text-align: center;
          max-width: 2in;
        }
        .page-break-before {
          break-before: page;
          page-break-before: always;
        }
        .page-break-safe {
          break-inside: avoid-page;
          page-break-inside: avoid;
        }
        @media print {
          @page {
            size: A4;
            margin: 0;
          }
          .legal-notice-renderer {
            padding: 1in 1in 1in 1.5in !important;
            width: auto !important;
            margin: 0 !important;
            box-shadow: none !important;
            background: white !important;
          }
        }
      `}</style>

      {/* Advocate Letterhead */}
      <div className="letterhead">
        <div className="letterhead-left">
          <div className="advocate-name">{data?.advocate?.name || 'ADVOCATE'}</div>
          <div className="advocate-meta">{data?.advocate?.designation || 'Advocate, Legal Drafting Counsel'}</div>
          {data?.advocate?.firmName ? <div className="advocate-firm">{data.advocate.firmName}</div> : null}
        </div>
        <div className="letterhead-right">
          {data?.advocate?.enrollmentNumber ? <div><strong>Enrollment No.:</strong> {data.advocate.enrollmentNumber}</div> : null}
          <div><strong>Office:</strong> {data?.advocate?.address || 'LegalEase Counsel Chamber'}</div>
          <div><strong>Contact:</strong> {data?.advocate?.phone || data?.advocate?.email || 'On Record'}</div>
        </div>
      </div>

      {/* Meta Row */}
      <div className="notice-meta-row">
        <div><strong>Ref No.:</strong> {refNo}</div>
        <div><strong>Date:</strong> {data?.noticeDate || formatIndianDate(document.created_at || document.updated_at)}</div>
      </div>

      {/* Title */}
      <div className="notice-header-block">
        <div className="court-title underlined">{headerTitle}</div>
      </div>

      {/* Recipient */}
      <div className="address-block">
        <p><strong>To,</strong></p>
        <p>{data?.recipient?.name || 'Noticee'}</p>
        {data?.recipient?.designation ? <p>{data.recipient.designation}</p> : null}
        {data?.recipient?.organization ? <p>{data.recipient.organization}</p> : null}
        <p>{data?.recipient?.address || 'Address as available on record'}</p>
        {data?.recipient?.phone ? <p><strong>Phone:</strong> {data.recipient.phone}</p> : null}
        <p className="subject-line">Subject: {data?.subject || 'Legal Notice'}</p>
      </div>

      {/* Body */}
      <div className="body-section">
        <p className="preamble">Sir/Madam,</p>
        <p>
          Under instructions from and on behalf of our Client, {data?.client?.name || 'our Client'}, here in after referred to as "Our Client", we do hereby serve upon you the present Legal Notice as under:
        </p>
        <div className="numbered-paras">
          {(data?.facts || []).map((fact: FactParagraph, idx: number) => (
            <div key={fact.id || idx} className="numbered-para">
              <div className="para-num">{idx + 1}.</div>
              <div className="para-content">
                <strong>{fact.label}.</strong> {fact.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Legal Provisions */}
          {data?.legalProvisions && data.legalProvisions.length > 0 && (
            <div className="provisions-block page-break-safe">
              <div className="section-heading">Legal Basis / Applicable Provisions</div>
              <ol className="facts-list">
                {data.legalProvisions.map((prov: LegalProvision, idx: number) => (
                  <li key={prov.id || idx}>{prov.text}</li>
                ))}
              </ol>
            </div>
          )}

      {/* Demands */}
      <div className="demand-block page-break-safe">
        <div className="section-heading">Legal Demands</div>
        <p>
          You are hereby finally called upon to comply with the following demands within <strong>{data?.compliancePeriod || '15 days'}</strong> from the receipt of this Notice:
        </p>
        <ol className="facts-list">
          {(data?.demands || []).map((demand: DemandItem, idx: number) => (
            <li key={demand.id || idx}>
              <strong>{demand.label}.</strong> {demand.text}
            </li>
          ))}
        </ol>
      </div>

      {/* Consequences */}
      {data?.consequences && (
        <div className="consequences-block page-break-safe">
          <div className="section-heading">Consequences of Non-Compliance</div>
          <p>{data.consequences}</p>
        </div>
      )}

      {/* Closing */}
      <div className="closing-block">
        {data?.closing && <p className="closing-para">{data.closing}</p>}
        <p className="retained-para">A copy of this Notice is retained in our office for future use and reference.</p>
      </div>

      {/* Witnesses */}
      {data?.signature?.hasWitness && (
        <div className="witness-block page-break-safe">
          <div className="section-heading">Witnesses</div>
          <div className="witness-grid">
            <div className="witness-item">
              <div className="witness-name">1. {data.signature.witness1 || '____________________'}</div>
              <div className="witness-line">____________________</div>
              <div className="witness-label">(Signature)</div>
            </div>
            <div className="witness-item">
              <div className="witness-name">2. {data.signature.witness2 || '____________________'}</div>
              <div className="witness-line">____________________</div>
              <div className="witness-label">(Signature)</div>
            </div>
          </div>
        </div>
      )}

      {/* Annexures */}
      {data?.annexures && data.annexures.length > 0 && (
        <div className="annexures-block page-break-before">
          <div className="section-heading">Enclosures / Annexures</div>
          <ol className="facts-list">
            {data.annexures.map((ann: AnnexureItem, idx: number) => (
              <li key={ann.id || idx}>
                <strong>{ann.label}:</strong> {ann.name}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Signature Panel */}
      <div className="attestation-block page-break-safe">
        <div className="attestation-left">
          <div className="seal-image" style={{ background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10pt', color: '#64748b' }}>
            SEAL
          </div>
          <div className="seal-meta">Bar Council No.: {data?.advocate?.enrollmentNumber || 'Pending Verification'}</div>
        </div>
        <div className="attestation-right">
          <div className="signature-stack">
            <div className="signature-party">
              <div className="signature-placeholder">Client Signature</div>
              <div className="signature-caption">{data?.client?.name || 'Client'}</div>
              <div className="signature-subcaption">Client</div>
            </div>
            <div className="signature-party">
              {isVerified && document.reviewed_by_signature_url ? (
                <img
                  src={`${(import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '')}${document.reviewed_by_signature_url}`}
                  alt="Lawyer Signature"
                  className="signature-image"
                />
              ) : (
                <div className="signature-placeholder">Verified Advocate Signature</div>
              )}
              <div className="signature-caption">{data?.advocate?.name || 'Advocate'}</div>
              <div className="signature-subcaption">Digital Signature / e-Verification</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getHeaderTitle(noticeType: string) {
  switch (noticeType) {
    case 'cheque_bounce':
      return 'NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881';
    case 'money_recovery':
      return 'LEGAL NOTICE FOR RECOVERY OF MONEY';
    case 'tenant_eviction':
      return 'LEGAL NOTICE FOR EVICTION AND ARREARS OF RENT';
    default:
      return 'LEGAL NOTICE';
  }
}

function buildRefNo(docId: string, docType: string) {
  const prefix = docType === 'affidavit' ? 'AFF' : docType === 'rent_agreement' ? 'RA' : 'LN';
  return `${prefix}/${String(docId || 'DRAFT').slice(0, 8).toUpperCase()}`;
}

function formatIndianDate(value: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}
