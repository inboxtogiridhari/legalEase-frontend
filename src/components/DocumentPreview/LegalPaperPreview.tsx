import { Expand, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface LegalPaperPreviewProps {
  html: string;
  title: string;
}

function normalizeHtmlDocument(html: string) {
  const source = String(html || '').trim();
  const baseStyle = `
    <style>
      @page {
        size: A4;
        margin: 0;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        padding: 0;
        background: #ffffff !important;
        font-family: "Times New Roman", Times, serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000000;
        -webkit-print-color-adjust: exact;
      }
      .legal-page {
        width: 8.27in;
        min-height: 11.69in;
        margin: 0 auto;
        padding: 1in 1in 1in 1.5in; /* 1.5in left margin for tagging/filing */
        background: white;
        position: relative;
        box-shadow: none;
      }
      .court-title {
        font-size: 16pt;
        font-weight: bold;
        text-align: center;
        text-decoration: underline;
        margin-bottom: 25pt;
        text-transform: uppercase;
      }
      .header-section {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20pt;
        font-weight: bold;
      }
      .subject-line {
        font-weight: bold;
        text-decoration: underline;
        margin: 20pt 0;
        text-align: center;
        text-transform: uppercase;
      }
      .address-block {
        margin-bottom: 20pt;
        line-height: 1.4;
      }
      .preamble {
        font-weight: bold;
        margin-bottom: 15pt;
      }
      p {
        margin-bottom: 12pt;
        text-align: justify;
      }
      .numbered-para {
        display: flex;
        margin-bottom: 12pt;
        text-align: justify;
      }
      .para-num {
        min-width: 30pt;
        font-weight: bold;
      }
      .para-content {
        flex: 1;
      }
      .footer-section {
        margin-top: 50pt;
        page-break-inside: avoid;
      }
      .signature-block {
        display: flex;
        justify-content: space-between;
        margin-top: 40pt;
      }
      .sig-line {
        border-top: 1px solid black;
        width: 200pt;
        margin-top: 40pt;
        text-align: center;
        padding-top: 5pt;
      }
      .witness-section {
        margin-top: 60pt;
        border-top: 1px solid #eee;
        padding-top: 20pt;
        page-break-inside: avoid;
      }
      .witness-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 40pt;
      }
      
      /* Print Specifics */
      @media print {
        body {
          background: white !important;
        }
        .legal-page {
          margin: 0;
          box-shadow: none;
          width: 100%;
          height: auto;
        }
        .no-print {
          display: none !important;
        }
        /* Ensure no awkward splits */
        p, .numbered-para, .signature-block, .witness-section {
          page-break-inside: avoid;
        }
      }
      
      /* Signature & Seal Styling */
      .signature-image {
        max-width: 2in;
        max-height: 1in;
        object-fit: contain;
      }
      .seal-image {
        width: 1.3in;
        height: 1.3in;
        object-fit: contain;
      }
      .placeholder {
        color: #666;
        border-bottom: 1px dashed #ccc;
        padding: 0 5pt;
      }
    </style>
  `;

  if (!source) {
    return `
      <html>
        <head>${baseStyle}</head>
        <body>
          <div class="legal-page">
            <div style="text-align:center;padding-top:100px;color:#64748b;">
              <p style="text-align:center;">Draft unavailable or being generated...</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  // If it's already a full HTML, we wrap it in our legal-page container
  const content = /<body[\s>](.*?)<\/body>/is.exec(source)?.[1] || source;

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        ${baseStyle}
      </head>
      <body>
        <div class="legal-page">
          ${content}
        </div>
      </body>
    </html>
  `;
}

export default function LegalPaperPreview({ html, title }: LegalPaperPreviewProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [frameHeight, setFrameHeight] = useState(1500);
  const [fullscreenHeight, setFullscreenHeight] = useState(1500);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const fullscreenIframeRef = useRef<HTMLIFrameElement | null>(null);
  const srcDoc = useMemo(() => normalizeHtmlDocument(html), [html]);

  useEffect(() => {
    function updateHeight(frame: HTMLIFrameElement | null, setter: (height: number) => void) {
      if (!frame) return;
      const doc = frame.contentWindow?.document;
      if (!doc) return;
      const nextHeight = Math.max(
        doc.documentElement?.scrollHeight || 0,
        doc.body?.scrollHeight || 0,
        1200
      );
      setter(nextHeight + 24);
    }

    const timer = window.setTimeout(() => {
      updateHeight(iframeRef.current, setFrameHeight);
      updateHeight(fullscreenIframeRef.current, setFullscreenHeight);
    }, 80);

    return () => window.clearTimeout(timer);
  }, [srcDoc, fullscreen]);

  function renderPaper(frame: HTMLIFrameElement | null, onRef: (node: HTMLIFrameElement | null) => void, height: number) {
    return (
      <div className="rounded-[2rem] border border-slate-200 bg-[#eef1f5] p-4 md:p-8">
        <div className="mx-auto w-full max-w-[8.5in] overflow-hidden bg-white shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <iframe
            ref={(node) => {
              onRef(node);
              if (frame !== node) {
                window.setTimeout(() => {
                  const doc = node?.contentWindow?.document;
                  if (!doc) return;
                  const nextHeight = Math.max(
                    doc.documentElement?.scrollHeight || 0,
                    doc.body?.scrollHeight || 0,
                    1200
                  );
                  if (node === iframeRef.current) setFrameHeight(nextHeight + 24);
                  if (node === fullscreenIframeRef.current) setFullscreenHeight(nextHeight + 24);
                }, 60);
              }
            }}
            title={title}
            srcDoc={srcDoc}
            scrolling="no"
            className="block w-full border-0 bg-white"
            style={{ height: `${height}px` }}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Paper Preview</p>
            <p className="text-sm text-slate-700">{title}</p>
          </div>
          <button
            type="button"
            onClick={() => setFullscreen(true)}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            <Expand className="h-4 w-4" />
            Fullscreen Preview
          </button>
        </div>
        {renderPaper(iframeRef.current, (node) => { iframeRef.current = node; }, frameHeight)}
      </div>

      {fullscreen && (
        <div className="fixed inset-0 z-[160] overflow-auto bg-slate-950/70 p-4 md:p-8">
          <div className="mx-auto max-w-[11in]">
            <div className="mb-4 flex items-center justify-between rounded-2xl bg-white/95 px-5 py-3 shadow-xl">
              <div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-500">Print-accurate paper preview</p>
              </div>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {renderPaper(fullscreenIframeRef.current, (node) => { fullscreenIframeRef.current = node; }, fullscreenHeight)}
          </div>
        </div>
      )}
    </>
  );
}
