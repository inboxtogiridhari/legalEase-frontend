import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Bot, CheckCircle, QrCode, Save, Smartphone, X } from 'lucide-react';
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

interface DocumentFormProps {
  documentType: 'legal_notice' | 'rent_agreement' | 'affidavit';
  preselectedNoticeSubtype?: string;
  skipDraftSession?: boolean;
  onClose: () => void;
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

export default function DocumentForm({ documentType, preselectedNoticeSubtype, skipDraftSession = false, onClose }: DocumentFormProps) {
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
        const { draft } = await apiDraftSessionGet(documentType);
        if (!active || !draft) return;
        const d = draft as Document;
        setDraftSessionId(d.id);
        setStateLaw(d.state_law || 'Maharashtra');
        if (d.memory_snapshot?.currentStep && typeof d.memory_snapshot.currentStep === 'number') {
          setCurrentStep(Number(d.memory_snapshot.currentStep));
        }
        setFormData((prev) => ({ ...prev, ...((d.form_data as unknown) as Record<string, string>) }));
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
  }, [documentType, skipDraftSession]);

  useEffect(() => {
    if (loadingDraft || loadingSchema) return;
    const timer = window.setTimeout(async () => {
      try {
        const response = await apiDraftSessionSave({
          id: draftSessionId || undefined,
          document_type: documentType,
          notice_subtype: noticeSubtype || undefined,
          form_data: formData as object,
          state_law: stateLaw,
          memory_snapshot: {
            currentStep,
            lastSavedAt: new Date().toISOString(),
          },
        });
        const nextId = (response.draft as Document)?.id;
        if (nextId && nextId !== draftSessionId) {
          setDraftSessionId(nextId);
        }
      } catch (error) {
        console.error('Draft autosave failed:', error);
      }
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [loadingDraft, loadingSchema, draftSessionId, documentType, noticeSubtype, formData, stateLaw, currentStep]);

  const totalSteps = schema?.steps?.length || (documentType === 'affidavit' ? 3 : 4);
  const activeStep = schema?.steps?.[currentStep - 1];

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

  function validateCurrentStep(): string[] {
    if (!activeStep) return [];
    const missing: string[] = [];
    activeStep.fields.forEach((field) => {
      if (!field.required) return;
      const value = String(formData[field.key] || '').trim();
      if (!value) missing.push(field.label || field.key);
    });
    return missing;
  }

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
    if (proofFiles.length === 0) {
      showToast(t('forms.missingProof'), 'error');
      return;
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

      await apiDocumentsCreate({
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
        proof: proofFiles.length ? proofFiles : undefined,
      });

      setSuccess(true);
      showToast(t('forms.submitSuccessBody'), 'success');
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
      <div className="bg-white rounded-xl shadow-lg p-12 text-center max-w-md mx-auto mt-20">
        <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">{t('forms.submitSuccessTitle')}</h3>
        <p className="text-slate-600">{t('forms.submitSuccessBody')}</p>
      </div>
    );
  }

  if (loadingSchema) {
    return <div className="text-center py-10">Loading form schema...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-slate-900 text-white p-6">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-slate-300 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('nav.backHome')}
          </button>
          <h2 className="text-2xl font-bold">{titles[documentType]}</h2>
          <div className="flex items-center gap-2 mt-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full ${
                  i + 1 <= currentStep ? 'bg-white' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
          <p className="text-slate-300 text-sm mt-2">
            {t('forms.step', { current: currentStep, total: totalSteps })} {draftSessionId ? `| ${t('forms.autosaved')}` : ''}
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div className="grid md:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-lg p-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">{t('forms.stateLaw')}</label>
              <input
                value={stateLaw}
                onChange={(e) => setStateLaw(e.target.value)}
                list="document-state-law"
                placeholder={t('forms.stateLawPlaceholder')}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
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
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={askAssistant}
                  disabled={assistantLoading}
                  className="inline-flex items-center gap-1 px-3 py-2 bg-slate-900 text-white rounded-lg text-sm"
                >
                  <Bot className="w-4 h-4" />
                  {assistantLoading ? t('common.thinking') : t('common.ask')}
                </button>
              </div>
            </div>
            {assistantReply && (
              <div className="md:col-span-2 text-sm bg-white border border-slate-200 rounded-lg p-3 whitespace-pre-wrap text-slate-700">
                {assistantReply}
              </div>
            )}
          </div>

          {activeStep && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-slate-900">{activeStep.title}</h3>
              {activeStep.fields.map((field) => {
                const value = formData[field.key] || '';
                const isMissing = missingKeys.includes(field.key);
                const baseClass = `w-full px-4 py-2 border rounded-lg ${isMissing ? 'border-red-400 bg-red-50' : 'border-slate-300'}`;
                const commonProps = {
                  value,
                  onChange: (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => updateField(field.key, e.target.value),
                  className: baseClass,
                };

                if (field.type === 'textarea') {
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{field.label}</label>
                      <textarea rows={4} {...commonProps} />
                      {isMissing && <p className="text-xs text-red-600 mt-1">Required</p>}
                    </div>
                  );
                }

                if (field.type === 'select') {
                  return (
                    <div key={field.key}>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{field.label}</label>
                      <select {...commonProps}>
                        <option value="">Select</option>
                        {(field.options || []).map((opt) => (
                          <option key={opt.id} value={opt.id}>{opt.label}</option>
                        ))}
                      </select>
                      {isMissing && <p className="text-xs text-red-600 mt-1">Required</p>}
                    </div>
                  );
                }

                return (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{field.label}</label>
                    <input type={field.type || 'text'} {...commonProps} />
                    {isMissing && <p className="text-xs text-red-600 mt-1">Required</p>}
                  </div>
                );
              })}
            </div>
          )}

          {currentStep === totalSteps && (
            <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {t('forms.proofLabel')}
              </label>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                onChange={(e) => setProofFiles(Array.from(e.target.files || []))}
                className="w-full text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-200 file:text-slate-800"
              />
              {proofFiles.length > 0 && (
                <div className="mt-3 space-y-2">
                  <p className="text-slate-500 text-sm">{t('forms.proofSelected', { count: proofFiles.length })}</p>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              className="flex items-center gap-2 px-6 py-2 border-2 border-slate-300 rounded-lg font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('common.previous')}
            </button>

            {currentStep < totalSteps ? (
              <button
                onClick={() => {
                  const missing = validateCurrentStep();
                  if (missing.length) {
                    const keys = (activeStep?.fields || []).filter((f) => f.required && !String(formData[f.key] || '').trim()).map((f) => f.key);
                    setMissingKeys(keys);
                    showToast(t('forms.missingFields', { fields: missing.join(', ') }), 'error');
                    return;
                  }
                  setMissingKeys([]);
                  setCurrentStep(currentStep + 1);
                }}
                className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-lg font-semibold hover:bg-slate-800 transition-colors"
              >
                {t('common.next')}
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {loading ? t('common.processing') : t('common.submit')}
              </button>
            )}
          </div>
        </div>
      </div>

      {paymentOrder && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/40 p-4">
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
                  <img src={paymentOrder.qr_code_data_url} alt="UPI QR code" className="h-56 w-56 rounded-3xl border border-slate-200 bg-white p-3" />
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
                      className="rounded-3xl border border-slate-200 bg-white px-3 py-4 text-center text-sm font-semibold text-slate-700 shadow-sm hover:border-slate-900"
                    >
                      <Smartphone className="mx-auto mb-2 h-4 w-4" />
                      {app.label}
                    </a>
                  ))}
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => closePaymentPrompt({ paid: false })}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
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
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {confirmingPayment ? 'Confirming payment...' : 'I have paid'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
