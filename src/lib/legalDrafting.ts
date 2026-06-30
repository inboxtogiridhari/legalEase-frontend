import puter from './puter';

type SupportedDraftType = 'legal_notice' | 'rent_agreement' | 'affidavit';

const DRAFTING_PROMPT = [
  'You are a Senior Indian Advocate with 25+ years of experience in Supreme Court and High Court legal drafting.',
  'Your task is to generate a COURT-READY draft for an Indian Legal Notice, Rent Agreement, or Affidavit based on provided user data.',
  'The draft MUST strictly adhere to Indian Civil Procedure Code (CPC) and Indian Evidence Act standards.',
  
  'Output Format: return only a valid HTML string with inline CSS. NO markdown, NO conversational text, NO backticks.',
  'CRITICAL: Use placeholders like [________] if data is missing. DO NOT use "undefined" or "null".',
  
  'CRITICAL LEGAL FORMATTING RULES:',
  '1. FONT: Use "Times New Roman" or "serif", size 12pt for body, 14pt-16pt for headings.',
  '2. MARGINS: Left margin 1.5 inches (for tagging/filing), Top/Right/Bottom 1.0 inch.',
  '3. SPACING: Line spacing MUST be exactly 1.5.',
  '4. HEADINGS: All major headings must be BOLD, CENTERED, and UNDERLINED (e.g., LEGAL NOTICE).',
  '5. PARAGRAPHS: All paragraphs must be JUSTIFIED. Use numbered paragraphs for facts.',
  
  'SMART CONTENT RULES:',
  '1. CLIENT STORY: Write the {{detailedFacts}} section in 3rd person ("My client states that...", "It is further stated that...").',
  '2. LEGAL DEMAND: Include a specific timeline for compliance (e.g., "within 15 days of receipt") in the {{legalDemands}} section.',
  '3. INTEREST CLAUSE: For Money Recovery or Cheque Bounce cases, explicitly mention a demand for interest (e.g., 18% p.a.).',
  
  'NOTICE STRUCTURE:',
  '<div class="header-section"><div>Place: {{place}}</div><div>Date: {{noticeDate}}</div></div>',
  '<div class="court-title">{{dynamicHeader}}</div>',
  '<div class="address-block">To,<br><strong>{{recipientName}}</strong><br>{{recipientAddress}}</div>',
  '<div class="subject-line">RE: {{subject}}</div>',
  '<div class="preamble">Under instructions from and on behalf of my client {{clientName}}, I hereby serve you with the following legal notice:</div>',
  '{{detailedFacts}} (as numbered paragraphs)',
  '<div class="demands-section"><p><strong>LEGAL DEMAND:</strong></p>{{legalDemands}}</div>',
  '<div class="footer-section">',
  '  <p>Yours Faithfully,</p>',
  '  <div class="signature-container">',
  '    <div>(Signature)<br>{{clientName}}<br>Client</div>',
  '    <div>{{signature_image}}<br>(Advocate Signature)<br>{{lawyerName}}<br>Advocate</div>',
  '  </div>',
  '  <div class="witness-section">',
  '    <p>WITNESSES:</p>',
  '    <div class="witness-grid">',
  '      <div>1. {{witness1}}<br>________________</div>',
  '      <div>2. {{witness2}}<br>________________</div>',
  '    </div>',
  '  </div>',
  '</div>',

  'TECHNICAL PLACEHOLDERS:',
  'Insert {{signature_image}} for advocate signature.',
  'Insert {{bar_seal}} for official seal.',
].join(' ');

/**
 * Robustly maps form data to template placeholders with safe defaults.
 */
function mapLegalNoticeData(formData: any): Record<string, string> {
  const safe = (val: any) => val && String(val).trim() !== '' ? String(val) : '[________]';
  const noticeType = formData.noticeType || 'General Legal Notice';
  
  let dynamicHeader = 'LEGAL NOTICE';
  if (noticeType.toLowerCase().includes('cheque bounce')) {
    dynamicHeader = 'NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881';
  } else if (noticeType.toLowerCase().includes('money recovery')) {
    dynamicHeader = 'LEGAL NOTICE FOR RECOVERY OF MONEY';
  } else if (noticeType.toLowerCase().includes('tenant eviction')) {
    dynamicHeader = 'LEGAL NOTICE FOR EVICTION AND ARREARS OF RENT';
  }

  return {
    noticeDate: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' }),
    place: safe(formData.place || 'On Record'),
    recipientName: safe(formData.recipientName),
    recipientAddress: safe(formData.recipientAddress),
    subject: safe(formData.subject),
    clientName: safe(formData.senderName),
    dynamicHeader,
    detailedFacts: safe(formData.description),
    legalDemands: safe(formData.demands),
    lawyerName: '[Advocate Name]', 
    witness1: safe(formData.witness1 || '[Witness 1 Name]'),
    witness2: safe(formData.witness2 || '[Witness 2 Name]')
  };
}

/**
 * Generates an initial draft using AI (Puter/GPT-4o) with Indian Court-Ready standards.
 */
export async function generatePuterLegalDraft(documentType: SupportedDraftType, formData: Record<string, unknown>) {
  const mappedData = documentType === 'legal_notice' ? mapLegalNoticeData(formData) : formData;
  
  const prompt = [
    DRAFTING_PROMPT,
    `Document type: ${documentType}`,
    `Mapped Data: ${JSON.stringify(mappedData)}`,
    `Raw Form JSON: ${JSON.stringify(formData)}`,
  ].join('\n\n');

  const result = await puter.ai.chat(prompt, {
    model: 'gpt-4o',
  });

  const html = extractText(result);
  if (!html || !/<html[\s>]|<body[\s>]|<div[\s>]|<p[\s>]/i.test(html)) {
    throw new Error('Puter draft response was not valid HTML');
  }

  // Clean up potential markdown artifacts from AI response
  const cleanedHtml = html
    .replace(/^```html\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();

  return cleanedHtml;
}
