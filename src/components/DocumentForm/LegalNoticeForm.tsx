import { useTranslation } from 'react-i18next';
import { LegalNoticeData } from '../../types';

interface LegalNoticeFormProps {
  data: LegalNoticeData;
  onChange: (data: LegalNoticeData) => void;
  currentStep: number;
}

const NOTICE_TYPES = [
  { id: 'cheque_bounce', label: 'Cheque Bounce', summary: 'For dishonoured cheque and payment demand.' },
  { id: 'tenant_eviction', label: 'Tenant Eviction', summary: 'For non-payment of rent or breach of tenancy.' },
  { id: 'money_recovery', label: 'Money Recovery', summary: 'For unpaid dues, loans or advances.' },
  { id: 'divorce_family', label: 'Divorce / Family', summary: 'For family disputes and legal communication before filing.' },
  { id: 'employment_dispute', label: 'Employment Dispute', summary: 'For salary delay, wrongful termination or HR disputes.' },
];

export default function LegalNoticeForm({ data, onChange, currentStep }: LegalNoticeFormProps) {
  const { t } = useTranslation();

  function updateField(field: keyof LegalNoticeData, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-6">
      {currentStep === 1 && (
        <>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Notice Type + Sender Details</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('legalNotice.noticeType')}</label>
            <select
              value={data.noticeType || ''}
              onChange={(e) => updateField('noticeType', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            >
              <option value="">Select notice type</option>
              {NOTICE_TYPES.map((n) => (
                <option key={n.id} value={n.id}>{n.label}</option>
              ))}
            </select>
            {data.noticeType && (
              <p className="text-xs text-slate-500 mt-1">
                {NOTICE_TYPES.find((n) => n.id === data.noticeType)?.summary}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('legalNotice.senderName')}</label>
            <input
              type="text"
              value={data.senderName}
              onChange={(e) => updateField('senderName', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('legalNotice.senderAddress')}</label>
            <textarea
              value={data.senderAddress}
              onChange={(e) => updateField('senderAddress', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>
        </>
      )}

      {currentStep === 2 && (
        <>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Recipient Details</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('legalNotice.recipientName')}</label>
            <input
              type="text"
              value={data.recipientName}
              onChange={(e) => updateField('recipientName', e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('legalNotice.recipientAddress')}</label>
            <textarea
              value={data.recipientAddress}
              onChange={(e) => updateField('recipientAddress', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>
        </>
      )}

      {currentStep === 3 && (
        <>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Matter Facts</h3>
          </div>
          {data.noticeType === 'money_recovery' && (
            <div className="grid md:grid-cols-3 gap-3">
              <input type="text" value={data.amount || ''} onChange={(e) => updateField('amount', e.target.value)} placeholder={t('legalNotice.amount')} className="px-4 py-2 border rounded-lg" />
              <input type="date" value={data.dueDate || ''} onChange={(e) => updateField('dueDate', e.target.value)} className="px-4 py-2 border rounded-lg" />
              <input type="text" value={data.transactionId || ''} onChange={(e) => updateField('transactionId', e.target.value)} placeholder={t('legalNotice.transactionId')} className="px-4 py-2 border rounded-lg" />
            </div>
          )}
          {data.noticeType === 'divorce_family' && (
            <div className="grid md:grid-cols-3 gap-3">
              <input type="date" value={data.marriageDate || ''} onChange={(e) => updateField('marriageDate', e.target.value)} className="px-4 py-2 border rounded-lg" />
              <input type="date" value={data.lastCohabitationDate || ''} onChange={(e) => updateField('lastCohabitationDate', e.target.value)} className="px-4 py-2 border rounded-lg" />
              <input type="text" value={data.grounds || ''} onChange={(e) => updateField('grounds', e.target.value)} placeholder={t('legalNotice.grounds')} className="px-4 py-2 border rounded-lg" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('legalNotice.subject')}</label>
            <input
              type="text"
              value={data.subject}
              onChange={(e) => updateField('subject', e.target.value)}
              placeholder="e.g., Notice for Outstanding Payment"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('legalNotice.description')}</label>
            <textarea
              value={data.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={5}
              placeholder="Provide a detailed description of the issue..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>
        </>
      )}

      {currentStep === 4 && (
        <>
          <div>
            <h3 className="text-xl font-semibold text-slate-900 mb-4">Demand + Compliance</h3>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{t('legalNotice.demands')}</label>
            <textarea
              value={data.demands}
              onChange={(e) => updateField('demands', e.target.value)}
              rows={4}
              placeholder="List your specific demands or actions required..."
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              {t('legalNotice.timeline')} <span title="Expected time for recipient to comply" className="ml-1 text-slate-400">i</span>
            </label>
            <input
              type="text"
              value={data.timeline}
              onChange={(e) => updateField('timeline', e.target.value)}
              placeholder="e.g., 15 days"
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
              required
            />
          </div>

          <div className="bg-slate-50 border rounded-lg p-4">
            <p className="text-sm font-semibold text-slate-800 mb-2">Live Draft Preview</p>
            <p className="text-sm text-slate-700"><strong>Type:</strong> {data.noticeType || '-'}</p>
            <p className="text-sm text-slate-700"><strong>Sender:</strong> {data.senderName || '-'}</p>
            <p className="text-sm text-slate-700"><strong>Recipient:</strong> {data.recipientName || '-'}</p>
            <p className="text-sm text-slate-700"><strong>Subject:</strong> {data.subject || '-'}</p>
          </div>
        </>
      )}
    </div>
  );
}
