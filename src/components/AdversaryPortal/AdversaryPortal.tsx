import { useEffect, useState } from 'react';
import { apiPublicNoticeRespond, apiPublicNoticeVerify } from '../../lib/api';

interface AdversaryPortalProps {
  secureToken: string;
}

export default function AdversaryPortal({ secureToken }: AdversaryPortalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [responseType, setResponseType] = useState<'counter_response' | 'settlement_request'>('counter_response');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    apiPublicNoticeVerify(secureToken)
      .then((res) => setData(res))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load notice'))
      .finally(() => setLoading(false));
  }, [secureToken]);

  async function submitResponse() {
    if (!name.trim() || !message.trim()) {
      setError('Name and message are required.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiPublicNoticeRespond(secureToken, {
        response_type: responseType,
        responder_name: name,
        responder_email: email || undefined,
        responder_phone: phone || undefined,
        message,
      });
      setSubmitted(true);
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit response');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading notice...</div>;
  }

  if (error) {
    return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  }

  const doc = data?.document || {};
  const attachments = doc.attachments || [];
  const evidence = data?.evidence || [];
  const apiBase = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
  const pdfPath = doc.delivery_meta?.soft_copy?.pdf_url || doc.delivery_meta?.pdf_url || null;
  const pdfUrl = pdfPath ? `${apiBase}${pdfPath}` : null;

  return (
    <div className="min-h-screen bg-[var(--court-ivory)] text-slate-900">
      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h1 className="text-3xl font-law font-bold">Notice Verification</h1>
          <p className="text-sm text-slate-600">Document ID: {doc.id}</p>
          <p className="text-sm text-slate-600 capitalize">Type: {String(doc.document_type || '').replace(/_/g, ' ')}</p>
          <p className="text-sm text-slate-600">Status: {String(doc.status || '').replace(/_/g, ' ')}</p>
          {pdfUrl && (
            <a className="inline-block mt-4 px-4 py-2 rounded-lg bg-slate-900 text-white" href={pdfUrl} target="_blank" rel="noreferrer">
              Download PDF
            </a>
          )}
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-2xl font-law font-semibold mb-4">Notice Summary</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            {Object.entries(doc.form_data || {}).map(([key, value]) => (
              <div key={key} className="border rounded-lg p-3 bg-slate-50">
                <p className="text-xs uppercase text-slate-500">{key.replace(/([A-Z])/g, ' $1')}</p>
                <p className="text-slate-900 mt-1">{String(value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="text-xl font-law font-semibold mb-3">Proof Attachments</h3>
            {attachments.length === 0 ? (
              <p className="text-sm text-slate-600">No attachments available.</p>
            ) : (
              <ul className="space-y-2">
                {attachments.map((file: any) => (
                  <li key={file.url} className="flex items-center justify-between text-sm">
                    <span>{file.name}</span>
                    <a className="text-blue-600" href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${file.url}`} target="_blank" rel="noreferrer">Download</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white rounded-2xl border shadow-sm p-6">
            <h3 className="text-xl font-law font-semibold mb-3">Evidence Vault</h3>
            {evidence.length === 0 ? (
              <p className="text-sm text-slate-600">No evidence uploaded yet.</p>
            ) : (
              <ul className="space-y-2">
                {evidence.map((file: any) => (
                  <li key={file.id} className="flex items-center justify-between text-sm">
                    <span>{file.file_name}</span>
                    <a className="text-blue-600" href={`${import.meta.env.VITE_API_URL || 'http://localhost:4000'}${file.file_url}`} target="_blank" rel="noreferrer">Download</a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm p-6">
          <h2 className="text-2xl font-law font-semibold mb-4">Counter-Response / Settlement Request</h2>
          {submitted && <p className="text-green-700 text-sm mb-4">Response submitted successfully.</p>}
          {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
          <div className="grid md:grid-cols-2 gap-4">
            <select value={responseType} onChange={(e) => setResponseType(e.target.value as 'counter_response' | 'settlement_request')} className="px-3 py-2 border rounded-lg">
              <option value="counter_response">Counter-Response</option>
              <option value="settlement_request">Settlement Request</option>
            </select>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="px-3 py-2 border rounded-lg" />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className="px-3 py-2 border rounded-lg" />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional)" className="px-3 py-2 border rounded-lg" />
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write your response or settlement proposal..." rows={4} className="w-full mt-4 px-3 py-2 border rounded-lg" />
          <button onClick={submitResponse} disabled={submitting} className="mt-4 px-5 py-2 bg-slate-900 text-white rounded-lg disabled:opacity-60">
            {submitting ? 'Submitting...' : 'Submit Response'}
          </button>
        </div>
      </div>
    </div>
  );
}
