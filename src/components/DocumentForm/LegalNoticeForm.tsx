import { useTranslation } from 'react-i18next';
import { LegalNoticeData } from '../../types';

interface LegalNoticeFormProps {
  data: LegalNoticeData;
  onChange: (data: LegalNoticeData) => void;
  currentStep: number;
}

const NOTICE_TYPES = [
  { id: 'cheque_bounce', label: 'Cheque Bounce', summary: 'For dishonoured cheque and payment demand under Section 138 NI Act.' },
  { id: 'tenant_eviction', label: 'Tenant Eviction', summary: 'For non-payment of rent or breach of tenancy terms.' },
  { id: 'money_recovery', label: 'Money Recovery', summary: 'For unpaid dues, loans or advances.' },
  { id: 'divorce_family', label: 'Divorce / Family', summary: 'For family disputes and legal communication before filing.' },
  { id: 'employment_dispute', label: 'Employment Dispute', summary: 'For salary delay, wrongful termination or HR disputes.' },
];

export default function LegalNoticeForm({ data, onChange, currentStep }: LegalNoticeFormProps) {
  const { t } = useTranslation();

  function updateField(field: keyof LegalNoticeData, value: string) {
    onChange({ ...data, [field]: value });
  }

  const timelineWarning = data.noticeType === 'cheque_bounce' && data.dishonourDate && data.chequeDate
    ? validateChequeBounceTimeline({
        chequeDate: data.chequeDate,
        presentationDate: data.presentationDate,
        dishonourDate: data.dishonourDate,
        returnMemoDate: data.returnMemoDate,
      })
    : null;

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

          {data.noticeType === 'cheque_bounce' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cheque Number</label>
                  <input type="text" value={data.chequeNumber || ''} onChange={(e) => updateField('chequeNumber', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cheque Amount (INR)</label>
                  <input type="text" value={data.chequeAmount || ''} onChange={(e) => updateField('chequeAmount', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cheque Date</label>
                  <input type="date" value={data.chequeDate || ''} onChange={(e) => updateField('chequeDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Bank Name</label>
                  <input type="text" value={data.bankName || ''} onChange={(e) => updateField('bankName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Branch</label>
                  <input type="text" value={data.branch || ''} onChange={(e) => updateField('branch', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Presentation Date</label>
                  <input type="date" value={data.presentationDate || ''} onChange={(e) => updateField('presentationDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dishonour Date</label>
                  <input type="date" value={data.dishonourDate || ''} onChange={(e) => updateField('dishonourDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Return Memo Date</label>
                  <input type="date" value={data.returnMemoDate || ''} onChange={(e) => updateField('returnMemoDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dishonour Reason</label>
                <input type="text" value={data.dishonourReason || ''} onChange={(e) => updateField('dishonourReason', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Underlying Liability</label>
                <textarea value={data.underlyingLiability || ''} onChange={(e) => updateField('underlyingLiability', e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
              </div>
              {timelineWarning && (
                <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg text-sm">
                  {timelineWarning}
                </div>
              )}
            </div>
          )}

          {data.noticeType === 'tenant_eviction' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Landlord Name</label>
                  <input type="text" value={data.landlordName || ''} onChange={(e) => updateField('landlordName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tenant Name</label>
                  <input type="text" value={data.tenantName || ''} onChange={(e) => updateField('tenantName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Property Address</label>
                <textarea value={data.propertyAddress || ''} onChange={(e) => updateField('propertyAddress', e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Tenancy Agreement Date</label>
                  <input type="date" value={data.tenancyAgreementDate || ''} onChange={(e) => updateField('tenancyAgreementDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Monthly Rent (INR)</label>
                  <input type="text" value={data.rentAmount || ''} onChange={(e) => updateField('rentAmount', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Security Deposit (INR)</label>
                  <input type="text" value={data.securityDeposit || ''} onChange={(e) => updateField('securityDeposit', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Arrears Amount (INR)</label>
                  <input type="text" value={data.arrears || ''} onChange={(e) => updateField('arrears', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Ground for Eviction</label>
                <textarea value={data.evictionGround || ''} onChange={(e) => updateField('evictionGround', e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Previous Notice Details</label>
                <textarea value={data.previousNoticeDetails || ''} onChange={(e) => updateField('previousNoticeDetails', e.target.value)} rows={2} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Required Possession Date</label>
                <input type="date" value={data.requiredPossessionDate || ''} onChange={(e) => updateField('requiredPossessionDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
              </div>
            </div>
          )}

          {data.noticeType === 'money_recovery' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Date</label>
                  <input type="date" value={data.transactionDate || ''} onChange={(e) => updateField('transactionDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Transaction Type</label>
                  <select value={data.transactionType || ''} onChange={(e) => updateField('transactionType', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required>
                    <option value="">Select type</option>
                    <option value="loan">Loan / Advance</option>
                    <option value="goods">Sale of Goods / Services</option>
                    <option value="contract">Contractual Obligation</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Invoice / Agreement / Reference</label>
                  <input type="text" value={data.invoiceNumber || ''} onChange={(e) => updateField('invoiceNumber', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Due Date</label>
                  <input type="date" value={data.dueDate || ''} onChange={(e) => updateField('dueDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Principal Amount (INR)</label>
                  <input type="text" value={data.principalAmount || ''} onChange={(e) => updateField('principalAmount', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Interest Rate (% p.a.)</label>
                  <input type="text" value={data.interestRate || ''} onChange={(e) => updateField('interestRate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Total Outstanding (INR)</label>
                  <input type="text" value={data.totalOutstanding || ''} onChange={(e) => updateField('totalOutstanding', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Reminders Made / Payment History</label>
                <textarea value={data.paymentHistory || ''} onChange={(e) => updateField('paymentHistory', e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
            </div>
          )}

          {data.noticeType === 'divorce_family' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Spouse / Opposite Party Name</label>
                  <input type="text" value={data.spouseName || ''} onChange={(e) => updateField('spouseName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Marriage Place</label>
                  <input type="text" value={data.marriagePlace || ''} onChange={(e) => updateField('marriagePlace', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Marriage Date</label>
                  <input type="date" value={data.marriageDate || ''} onChange={(e) => updateField('marriageDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Matrimonial Residence</label>
                  <input type="text" value={data.matrimonialResidence || ''} onChange={(e) => updateField('matrimonialResidence', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Children Details</label>
                <textarea value={data.childrenDetails || ''} onChange={(e) => updateField('childrenDetails', e.target.value)} rows={2} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Prior Resolution Attempts</label>
                <textarea value={data.priorResolutionAttempts || ''} onChange={(e) => updateField('priorResolutionAttempts', e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Requested Action / Relief</label>
                <textarea value={data.requestedAction || ''} onChange={(e) => updateField('requestedAction', e.target.value)} rows={4} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
              </div>
            </div>
          )}

          {data.noticeType === 'employment_dispute' && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employee Name</label>
                  <input type="text" value={data.employeeName || ''} onChange={(e) => updateField('employeeName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employer / Organization Name</label>
                  <input type="text" value={data.employerName || ''} onChange={(e) => updateField('employerName', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Designation</label>
                  <input type="text" value={data.designation || ''} onChange={(e) => updateField('designation', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Employment Start Date</label>
                  <input type="date" value={data.employmentStartDate || ''} onChange={(e) => updateField('employmentStartDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Employer Address</label>
                <textarea value={data.employerAddress || ''} onChange={(e) => updateField('employerAddress', e.target.value)} rows={2} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Dispute Type</label>
                <select value={data.disputeType || ''} onChange={(e) => updateField('disputeType', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required>
                  <option value="">Select dispute type</option>
                  <option value="unpaid_salary">Unpaid Salary</option>
                  <option value="wrongful_termination">Wrongful Termination</option>
                  <option value="unauthorized_deduction">Unauthorized Deduction</option>
                  <option value="gratuity_dues">Gratuity Dues</option>
                  <option value="employment_contract_breach">Employment Contract Breach</option>
                  <option value="relieving_experience_letter">Relieving / Experience Letter</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {data.disputeType === 'unpaid_salary' && (
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Salary Dues (INR)</label>
                    <input type="text" value={data.salaryDues || ''} onChange={(e) => updateField('salaryDues', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">From Date</label>
                    <input type="date" value={data.dueFromDate || ''} onChange={(e) => updateField('dueFromDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">To Date</label>
                    <input type="date" value={data.dueToDate || ''} onChange={(e) => updateField('dueToDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                  </div>
                </div>
              )}
              {data.disputeType === 'wrongful_termination' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Termination Date</label>
                    <input type="date" value={data.terminationDate || ''} onChange={(e) => updateField('terminationDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Notice Period (contractual)</label>
                    <input type="text" value={data.noticePeriod || ''} onChange={(e) => updateField('noticePeriod', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                  </div>
                </div>
              )}
              {data.disputeType === 'wrongful_termination' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Termination Reason</label>
                  <textarea value={data.terminationReason || ''} onChange={(e) => updateField('terminationReason', e.target.value)} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                </div>
              )}
              {data.disputeType === 'relieving_experience_letter' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Working Day</label>
                    <input type="date" value={data.lastWorkingDay || ''} onChange={(e) => updateField('lastWorkingDay', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Letter Requested Date</label>
                    <input type="date" value={data.letterRequestedDate || ''} onChange={(e) => updateField('letterRequestedDate', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg" />
                  </div>
                </div>
              )}
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