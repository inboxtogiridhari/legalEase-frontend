import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { Bot, CheckCircle, QrCode, Smartphone, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  apiAssistantHelp,
  apiConfirmPayment,
  apiCreatePaymentOrder,
  apiDocumentsCreate,
  apiDraftSessionGet,
  apiDraftSessionSave,
  apiFormSchema,
} from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { Document, PaymentIntentOrder } from '../../types';
import { useToast } from '../Toast/ToastProvider';
import { INDIAN_STATES } from '../../constants/indianStates';
import { generatePuterLegalDraft } from '../../lib/legalDrafting';
import { validateField } from '../../utils/validators';

import { WizardLayout } from '../document-wizard/WizardLayout';
import { WizardHeader } from '../document-wizard/WizardHeader';
import { WizardStepper } from '../document-wizard/WizardStepper';
import { WizardFooter } from '../document-wizard/WizardFooter';
import { AutoSaveIndicator } from '../document-wizard/AutoSaveIndicator';
import { ValidationSummary } from '../document-wizard/ValidationSummary';
import { WizardProvider } from '../document-wizard/WizardContext';
import { useAutoSave } from '../document-wizard/useAutoSave';
import WizardTransition from '../document-wizard/WizardTransition';

interface DocumentFormProps {
  documentType: 'legal_notice' | 'rent_agreement' | 'affidavit';
  preselectedNoticeSubtype?: string;
  skipDraftSession?: boolean;
  initialDraftId?: string;
  onClose: () => void;
  onSuccess?: (createdDoc?: unknown) => void;
}

type SchemaField = {
  key: string;
  label: string;
  type: string;
  required?: boolean;
  options?: Array<{ id: string; label: string }>;
};

type SchemaStep = {
  title: string;
  fields: SchemaField[];
};

type FormSchema = {
  title: string;
  steps: SchemaStep[];
};

export default function DocumentForm({
  documentType,
  preselectedNoticeSubtype,
  skipDraftSession = false,
  initialDraftId,
  onClose,
  onSuccess,
}: DocumentFormProps) {
  const { user, profile } = useAuth();
  const { showToast } = useToast();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [draftSessionId, setDraftSessionId] = useState<string>('');
  const [stateLaw, setStateLaw] = useState('Maharashtra');
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [loadingSchema, setLoadingSchema] = useState(true);
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [assistantTerm, setAssistantTerm] = useState('');
  const [assistantReply, setAssistantReply] = useState('');
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [missingKeys, setMissingKeys] = useState<string[]>([]);
  const [paymentOrder, setPaymentOrder] = useState<PaymentIntentOrder | null>(null);
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const paymentResolverRef = useRef<((value: { paid: boolean; paymentId?: string }) => void) | null>(null);

  const [formData, setFormData] = useState<Record<string, string>>({
    noticeType: preselectedNoticeSubtype || window.localStorage.getItem('preferred_notice_type') || '',
  });

  const noticeSubtype = useMemo(
    () => (documentType === 'legal_notice' ? formData.noticeType : undefined),
    [documentType, formData.noticeType]
  );

  useEffect(() => {
    let active = true;
    async function loadSchema() {
      try {
        setLoadingSchema(true);
        const result = await apiFormSchema(documentType, noticeSubtype);
        if (!active) return;
        setSchema(result.schema);
        setFormData((prev) => {
          const next: Record<string, string> = { ...prev };
          result.schema.steps.forEach((step) => {
            step.fields.forEach((field) => {
              if (next[field.key] === undefined) next[field.key] = '';
            });
          });
          return next;
        });
      } catch (error) {
        showToast(error instanceof Error ? error.message : 'Failed to load schema', 'error');
      } finally {
        if (active) setLoadingSchema(false);
      }
    }
    loadSchema();
    return () => {
      active = false;
    };
  }, [documentType, noticeSubtype, showToast]);

  useEffect(() => {
    let active = true;
    async function loadDraftSession() {
      if (skipDraftSession) {
        setLoadingDraft(false);
        return;
      }
      try {
        setLoadingDraft(true);
        const { draft } = await apiDraftSessionGet(documentType, initialDraftId);
        if (!active || !draft) return;
        const d = draft as Document;
        setDraftSessionId(d.id);
        setStateLaw(d.state_law || 'Maharashtra');
        if (d.notice_subtype) {
          setFormData((prev) => ({ ...prev, noticeType: d.notice_subtype || '' }));
        }
        if (d.memory_snapshot?.currentStep && typeof d.memory_snapshot.currentStep === 'number') {
          setCurrentStep(Number(d.memory_snapshot.currentStep));
        }
        if (d.form_data && typeof d.form_data === 'object') {
          setFormData((prev) => ({ ...prev, ...((d.form_data as unknown) as Record<string, string>) }));
        }
      } catch (error) {
        console.error('Failed to load draft session:', error);
      } finally {
        if (active) setLoadingDraft(false);
      }
    }
    loadDraftSession();
    return () => {
      active = false;
    };
  }, [documentType, skipDraftSession, initialDraftId]);

  // Use centralized autosave hook to debounce and persist draft sessions
  const { status: autoSaveStatus, lastSavedAt } = useAutoSave(
    {
      id: draftSessionId || undefined,
      document_type: documentType,
      notice_subtype: noticeSubtype || undefined,
      form_data: formData as object,
      state_law: stateLaw,
      memory_snapshot: {
        currentStep,
      },
    },
    async (payload: {
      id?: string;
      document_type: 'legal_notice' | 'rent_agreement' | 'affidavit';
      notice_subtype?: string;
      state_law?: string;
      form_data: object;
      memory_snapshot?: Record<string, unknown>;
    }) => {
      if (loadingDraft || loadingSchema) return;
      const response = await apiDraftSessionSave(payload);
      const nextId = (response.draft as Document)?.id;
      if (nextId && nextId !== draftSessionId) {
        setDraftSessionId(nextId);
      }
      return response;
    },
    1000
  );

  const indicatorStatus = autoSaveStatus === 'idle' ? 'saved' : (autoSaveStatus as 'saving' | 'saved' | 'error');

  const schemaSteps = schema?.steps || [];
  const totalSteps = (schemaSteps?.length || (documentType === 'affidavit' ? 3 : 4)) + 1; // +1 for Review step
  const activeStep = currentStep <= (schemaSteps?.length || 0) ? schemaSteps?.[currentStep - 1] : null;
  const isReviewStep = currentStep === totalSteps;

  const titles = {
    legal_notice: t('forms.createLegalNotice'),
    rent_agreement: t('forms.createRentAgreement'),
    affidavit: t('forms.createAffidavit'),
  } as const;

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (value && missingKeys.includes(field)) {
      setMissingKeys((prev) => prev.filter((k) => k !== field));
    }
  }

  function validateCurrentStepKeys(): string[] {
    if (!activeStep) return [];
    const keys: string[] = [];
    activeStep.fields.forEach((field) => {
      const value = formData[field.key];
      const err = validateField(field.key, field.label, value, { required: field.required, type: field.type });
      if (err) keys.push(field.key);
    });
    return keys;
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount / 100);
  }

  function requestPaymentConfirmation(order: PaymentIntentOrder): Promise<{ paid: boolean; paymentId?: string }> {
    setPaymentOrder(order);
    return new Promise((resolve) => {
      paymentResolverRef.current = resolve;
    });
  }

  function closePaymentPrompt(result: { paid: boolean; paymentId?: string }) {
    paymentResolverRef.current?.(result);
    paymentResolverRef.current = null;
    setPaymentOrder(null);
  }

  // legacy helper removed in favor of validateCurrentStepKeys

  async function askAssistant() {
    if (!assistantTerm.trim()) {
      showToast(t('forms.assistantPlaceholder'), 'error');
      return;
    }
    setAssistantLoading(true);
    try {
      const reply = await apiAssistantHelp({
        term: assistantTerm.trim(),
        document_type: documentType,
        current_facts: JSON.stringify(formData).slice(0, 1000),
      });
      setAssistantReply(
        [reply.explanation, reply.when_it_matters && `When it matters: ${reply.when_it_matters}`, reply.caution && `Note: ${reply.caution}`]
          .filter(Boolean)
          .join('\n\n')
      );
    } catch (error) {
      const term = assistantTerm.trim();
      setAssistantReply(t('forms.assistantFallback', { term }));
      showToast(error instanceof Error ? error.message : t('errors.assistantUnavailable'), 'error');
    } finally {
      setAssistantLoading(false);
    }
  }

  async function handleSubmit() {
    let proofFilesToUpload = [...proofFiles];
    if (proofFilesToUpload.length === 0) {
      const summaryText = `Client Self-Declaration\nDocument Type: ${documentType}\nState Law: ${stateLaw}\nSubmitted At: ${new Date().toISOString()}\nDetails:\n${JSON.stringify(formData, null, 2)}`;
      const fallbackFile = new File([summaryText], 'client_declaration.txt', { type: 'text/plain' });
      proofFilesToUpload = [fallbackFile];
    }
    setLoading(true);
    try {
      let paymentStatus: 'pending' | 'paid' = 'pending';
      let paymentOrderId = '';
      let paymentId = '';
      let amountPaid = 0;
      let clientGeneratedDraft = '';

      if (documentType === 'legal_notice') {
        const order = await apiCreatePaymentOrder({
          document_type: 'legal_notice',
          notice_subtype: noticeSubtype || undefined,
          draft_session_id: draftSessionId || undefined,
        });
        paymentOrderId = order.order_id;
        amountPaid = order.amount;

        const paymentResult = await requestPaymentConfirmation(order);
        if (!paymentResult.paid) {
          showToast(t('forms.paymentCancelled'), 'error');
          setLoading(false);
          return;
        }

        paymentStatus = 'paid';
        paymentId = paymentResult.paymentId || '';
      }

      try {
        clientGeneratedDraft = await generatePuterLegalDraft(documentType, {
          ...formData,
          stateLaw,
          noticeType: noticeSubtype || formData.noticeType || '',
          draftingStandard: 'Indian court-style legal drafting with e-stamp reserve and eSign block',
        });
      } catch (draftError) {
        console.error('Puter draft generation failed, using backend fallback:', draftError);
      }

      const createdDoc = await apiDocumentsCreate({
        document_type: documentType,
        client_email: user?.email ?? profile?.email ?? undefined,
        notice_subtype: noticeSubtype || undefined,
        client_generated_draft: clientGeneratedDraft || undefined,
        payment_status: paymentStatus,
        payment_order_id: paymentOrderId || undefined,
        payment_id: paymentId || undefined,
        amount_paid: amountPaid || undefined,
        draft_session_id: draftSessionId || undefined,
        state_law: stateLaw,
        memory_snapshot: {
          currentStep,
          assistantTerm,
        },
        form_data: formData as object,
        proof: proofFilesToUpload,
      });

      setSuccess(true);
      showToast(t('forms.submitSuccessBody'), 'success');
      onSuccess?.(createdDoc);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error creating document:', error);
      showToast(error instanceof Error ? error.message : t('errors.createDocFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <WizardLayout>
        <div className="p-12 text-center">
          <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <CheckCircle className="w-12 h-12 text-emerald-600" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 mb-3">{t('forms.submitSuccessTitle')}</h3>
          <p className="text-slate-600 text-lg">{t('forms.submitSuccessBody')}</p>
        </div>
      </WizardLayout>
    );
  }

  if (loadingSchema) {
    return (
      <WizardLayout>
        <div className="p-16 text-center text-slate-500">
          <div className="animate-spin w-10 h-10 border-4 border-slate-200 border-t-[#1a237e] rounded-full mx-auto mb-4" />
          <p className="text-lg font-medium">Loading secure form...</p>
        </div>
      </WizardLayout>
    );
  }

  return (
    <>
      <WizardProvider totalSteps={totalSteps} controlledStep={currentStep} onStepChange={setCurrentStep}>
        <WizardLayout>
          <WizardHeader title={titles[documentType]} onClose={onClose}>
            {draftSessionId && (
              <AutoSaveIndicator 
                status={indicatorStatus} 
                lastSavedAt={lastSavedAt || undefined} 
              />
            )}
          </WizardHeader>

        <WizardStepper currentStep={currentStep} totalSteps={totalSteps} />

        <div className="p-8 sm:p-10">
          <ValidationSummary missingFields={missingKeys} />

          <div className="mb-10 p-6 bg-slate-50/80 border border-slate-200 rounded-xl space-y-4 shadow-sm">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('forms.stateLaw')}</label>
                <input
                  value={stateLaw}
                  onChange={(e) => setStateLaw(e.target.value)}
                  list="document-state-law"
                  placeholder={t('forms.stateLawPlaceholder')}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] outline-none transition-colors shadow-sm"
                />
                <datalist id="document-state-law">
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state} />
                  ))}
                </datalist>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">{t('forms.assistant')}</label>
                <div className="flex gap-2">
                  <input
                    value={assistantTerm}
                    onChange={(e) => setAssistantTerm(e.target.value)}
                    placeholder={t('forms.assistantPlaceholder')}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] outline-none transition-colors shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={askAssistant}
                    disabled={assistantLoading}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <Bot className="w-4 h-4" />
                    {assistantLoading ? t('common.thinking') : t('common.ask')}
                  </button>
                </div>
              </div>
            </div>
            {assistantReply && (
              <div className="mt-4 p-5 bg-[#1a237e]/5 border border-[#1a237e]/20 rounded-lg text-sm text-[#1a237e] whitespace-pre-wrap leading-relaxed shadow-inner">
                {assistantReply}
              </div>
            )}
          </div>

          {activeStep && (
            <WizardTransition>
              <div className="space-y-8">
              <div className="mb-2 border-b border-slate-100 pb-4">
                <h3 className="text-2xl font-bold text-slate-900">{activeStep.title}</h3>
                <p className="text-slate-500 mt-1">Please fill in the details accurately below.</p>
              </div>
              
              <div className="grid gap-6">
                {activeStep.fields.map((field) => {
                  const value = formData[field.key] || '';
                  const isMissing = missingKeys.includes(field.key);
                  const baseClass = `w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-all shadow-sm ${
                    isMissing 
                      ? 'border-rose-300 bg-rose-50 focus:ring-rose-200 focus:border-rose-400' 
                      : 'bg-white border-slate-300 focus:ring-[#1a237e]/20 focus:border-[#1a237e] hover:border-slate-400'
                  }`;
                  
                  const commonProps: {
                    id: string;
                    name: string;
                    value: string;
                    onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
                    className: string;
                    'aria-invalid'?: boolean;
                    'aria-describedby'?: string;
                  } = {
                    id: `field-${field.key}`,
                    name: field.key,
                    value,
                    onChange: (e) => updateField(field.key, e.target.value),
                    className: baseClass,
                    'aria-invalid': isMissing || undefined,
                    'aria-describedby': isMissing ? `err-${field.key}` : undefined,
                  };

                  if (field.type === 'textarea') {
                    return (
                      <div key={field.key}>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        <textarea rows={4} {...commonProps} />
                      </div>
                    );
                  }

                  if (field.type === 'select') {
                    return (
                      <div key={field.key}>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">
                          {field.label} {field.required && <span className="text-rose-500">*</span>}
                        </label>
                        <select {...commonProps}>
                          <option value="">Select an option</option>
                          {(field.options || []).map((opt) => (
                            <option key={opt.id} value={opt.id}>{opt.label}</option>
                          ))}
                        </select>
                      </div>
                    );
                  }

                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">
                        {field.label} {field.required && <span className="text-rose-500">*</span>}
                      </label>
                      <input type={field.type || 'text'} {...commonProps} />
                    </div>
                  );
                })}
              </div>
            </div>
            </WizardTransition>
          )}
          {isReviewStep && (
            <div className="mt-6 space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-3">Review your information</h3>
                <div className="text-sm text-slate-700 space-y-3">
                  {Object.entries(formData).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-4">
                      <div className="text-slate-600 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                      <div className="text-slate-900 whitespace-pre-wrap text-right max-w-[60%]">{String(value)}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 p-6 bg-slate-50 border border-slate-200 rounded-xl">
                <label className="block text-lg font-bold text-slate-900 mb-2">{t('forms.proofLabel')}</label>
                <p className="text-slate-500 mb-4">Upload supporting documents (PDF, JPG, PNG). These will be provided to your lawyer for review.</p>

                <div className="mt-1 flex justify-center px-6 pt-8 pb-10 border-2 border-slate-300 border-dashed rounded-xl bg-white hover:bg-slate-50 transition-colors shadow-inner">
                  <div className="space-y-2 text-center">
                    <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <div className="flex text-sm text-slate-600 justify-center">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-[#1a237e] hover:text-[#1a237e]/80 focus-within:outline-none">
                        <span>Upload files</span>
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          className="sr-only"
                          multiple
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                          onChange={(e) => setProofFiles(Array.from(e.target.files || []))}
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-slate-500">Up to 10MB per file</p>
                  </div>
                </div>

                {proofFiles.length > 0 && (
                  <div className="mt-6 p-4 bg-white border border-slate-200 rounded-lg shadow-sm">
                    <p className="text-sm font-semibold text-slate-700 mb-2">{t('forms.proofSelected', { count: proofFiles.length })}</p>
                    <ul className="text-sm text-slate-600 list-disc list-inside space-y-1">
                      {proofFiles.map((f, i) => <li key={i}>{f.name}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <WizardFooter
          currentStep={currentStep}
          totalSteps={totalSteps}
          isLoading={loading}
          onPrevious={() => setCurrentStep(Math.max(1, currentStep - 1))}
          onNext={() => {
            const missingKeysHere = validateCurrentStepKeys();
            if (missingKeysHere.length) {
              setMissingKeys(missingKeysHere);
              // focus first missing field
              const first = document.querySelector<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(`[name="${missingKeysHere[0]}"]`);
              if (first) first.focus();
              const missingLabels = (activeStep?.fields || []).filter((f) => missingKeysHere.includes(f.key)).map((f) => f.label || f.key);
              showToast(t('forms.missingFields', { fields: missingLabels.join(', ') }), 'error');
              return;
            }
            setMissingKeys([]);
            setCurrentStep(currentStep + 1);
          }}
          nextLabel={currentStep + 1 === totalSteps ? 'Review' : 'Next'}
          submitLabel={'Generate Draft'}
          onSubmit={handleSubmit}
        />
        </WizardLayout>
      </WizardProvider>

      {/* Payment Modal remains outside the layout but visible */}
      {paymentOrder && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#fffef7,#ffffff_35%,#eff6ff)] shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">UPI Payment</p>
                <p className="text-xs text-slate-500">Scan the QR or continue with your preferred app</p>
              </div>
              <button
                type="button"
                onClick={() => closePaymentPrompt({ paid: false })}
                className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 px-5 py-5">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Payable Amount</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">{formatCurrency(paymentOrder.amount)}</p>
                <p className="mt-1 text-xs text-slate-500">Order ID: {paymentOrder.order_id}</p>
                <div className="mt-4 flex justify-center">
                  <img src={paymentOrder.qr_code_data_url} alt="UPI QR code" className="h-56 w-56 rounded-3xl border border-slate-200 bg-white p-3 shadow-sm" />
                </div>
                <p className="mt-3 inline-flex items-center gap-2 text-sm text-slate-600">
                  <QrCode className="h-4 w-4" />
                  Dynamic QR generated for intent flow
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">UPI Apps</p>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {paymentOrder.apps.map((app) => (
                    <a
                      key={app.id}
                      href={app.intent_url}
                      className="rounded-3xl border border-slate-200 bg-white px-3 py-4 text-center text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-900 transition-all hover:shadow-md"
                    >
                      <Smartphone className="mx-auto mb-2 h-4 w-4 text-[#1a237e]" />
                      {app.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end mt-6">
                <button
                  type="button"
                  onClick={() => closePaymentPrompt({ paid: false })}
                  className="rounded-full border border-slate-300 px-6 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={confirmingPayment}
                  onClick={async () => {
                    try {
                      setConfirmingPayment(true);
                      const pay = await apiConfirmPayment({ order_id: paymentOrder.order_id });
                      closePaymentPrompt({ paid: true, paymentId: pay.payment_id });
                    } catch (error) {
                      showToast(error instanceof Error ? error.message : 'Payment confirmation failed', 'error');
                    } finally {
                      setConfirmingPayment(false);
                    }
                  }}
                  className="rounded-full bg-[#1a237e] hover:bg-[#1a237e]/90 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60 shadow-sm"
                >
                  {confirmingPayment ? 'Confirming payment...' : 'I have paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
