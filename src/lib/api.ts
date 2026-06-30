import { AppNotification, PaymentIntentOrder, Profile, SupportTicket } from '../types';

const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');
const TOKEN_KEY = 'legalease_token';

function parseErrorText(text: string): string {
  if (!text) return 'Request failed';
  try {
    const parsed = JSON.parse(text);
    if (parsed?.error) return String(parsed.error);
  } catch {
    // continue
  }
  const pre = text.match(/<pre>(.*?)<\/pre>/is);
  if (pre?.[1]) return pre[1].trim();
  return text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

async function readError(res: Response): Promise<never> {
  const raw = await res.text();
  const msg = parseErrorText(raw);
  throw new Error(msg || `Request failed (${res.status})`);
}

export function getAuthToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch (e) {
    console.warn('LocalStorage access failed:', e);
    return null;
  }
}

export function setAuthToken(token: string | null) {
  try {
    if (!token) {
      window.localStorage.removeItem(TOKEN_KEY);
      return;
    }
    window.localStorage.setItem(TOKEN_KEY, token);
  } catch (e) {
    console.warn('LocalStorage access failed:', e);
  }
}

async function apiFetch(path: string, init: RequestInit = {}) {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    await readError(res);
  }
  return res.json();
}

export interface AuthPayload {
  token: string;
  user: { id: string; email: string | null };
  profile: Profile;
}

export async function apiSignUp(payload: {
  email: string;
  password: string;
  full_name: string;
  role: 'client' | 'lawyer';
  phone_number?: string;
}): Promise<AuthPayload> {
  return apiFetch('/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiSignIn(payload: { email: string; password: string }): Promise<AuthPayload> {
  return apiFetch('/api/auth/signin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiRequestOtp(payload: { phone_number: string }): Promise<{ ok: boolean; dev_otp?: string; note?: string; sms_warning?: string }> {
  return apiFetch('/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiVerifyOtp(payload: {
  phone_number: string;
  otp: string;
  full_name?: string;
  role?: 'client' | 'lawyer';
}): Promise<AuthPayload> {
  return apiFetch('/api/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiForgotPassword(payload: { email: string }): Promise<{ ok: boolean; dev_reset_token?: string }> {
  return apiFetch('/api/auth/forgot-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiResetPassword(payload: { reset_token: string; new_password: string }): Promise<{ ok: boolean }> {
  return apiFetch('/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiAdminLogin(payload: { email: string; password: string }): Promise<{ ok: boolean; admin_token: string; session_token: string }> {
  return apiFetch('/api/auth/admin/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export interface LoginEvent {
  id: number;
  user_id: string | null;
  role: string;
  login_method: 'password' | 'otp' | 'admin';
  email: string | null;
  phone_number: string | null;
  otp_code: string | null;
  created_at: string;
}

export async function apiAdminLoginEvents(adminToken: string): Promise<{ events: LoginEvent[] }> {
  const res = await fetch(`${BASE}/api/auth/admin/login-events`, {
    headers: { 'x-admin-token': adminToken },
  });
  if (!res.ok) await readError(res);
  return res.json();
}

export async function apiMe(): Promise<Omit<AuthPayload, 'token'>> {
  return apiFetch('/api/auth/me');
}

export async function apiProfileMe(): Promise<{ profile: Profile }> {
  return apiFetch('/api/profile/me');
}

export async function apiLawyerProfile(): Promise<{ profile: Profile }> {
  return apiFetch('/api/lawyer/profile');
}

export interface UpdateProfilePayload {
  full_name?: string;
  phone_number?: string;
  address?: string;
  government_id_type?: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id' | '';
  government_id_number?: string;
  profile_photo?: File | null;
  bar_council_id?: string;
  license_state?: string;
  years_experience?: number | '';
  firm_name?: string;
  office_address?: string;
  signature?: File | null;
  bar_certificate?: File | null;
  identity_proof?: File | null;
}

export async function apiProfileUpdate(payload: UpdateProfilePayload): Promise<{ profile: Profile }> {
  const form = new FormData();
  const keys: (keyof UpdateProfilePayload)[] = [
    'full_name',
    'phone_number',
    'address',
    'government_id_type',
    'government_id_number',
    'bar_council_id',
    'license_state',
    'years_experience',
    'firm_name',
    'office_address',
  ];
  for (const key of keys) {
    const val = payload[key];
    if (val !== undefined && val !== null && val !== '') form.append(key, String(val));
  }
  if (payload.profile_photo) form.append('profile_photo', payload.profile_photo);
  if (payload.signature) form.append('signature', payload.signature);
  if (payload.bar_certificate) form.append('bar_certificate', payload.bar_certificate);
  if (payload.identity_proof) form.append('identity_proof', payload.identity_proof);

  const token = getAuthToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}/api/profile/me`, { method: 'PUT', headers, body: form });
  if (!res.ok) {
    await readError(res);
  }
  return res.json();
}

export async function apiAdminUsers(adminToken: string, params?: {
  role?: 'client' | 'lawyer';
  verification_status?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  government_id_status?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  q?: string;
  page?: number;
  limit?: number;
  include_deleted?: boolean;
}): Promise<{ users: Profile[]; pagination: { page: number; limit: number; total: number; total_pages: number } }> {
  const query = new URLSearchParams();
  if (params?.role) query.set('role', params.role);
  if (params?.verification_status) query.set('verification_status', params.verification_status);
  if (params?.government_id_status) query.set('government_id_status', params.government_id_status);
  if (params?.q) query.set('q', params.q);
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.include_deleted) query.set('include_deleted', 'true');
  const url = `${BASE}/api/profile/admin/users${query.toString() ? `?${query.toString()}` : ''}`;
  const token = getAuthToken();
  const headers = new Headers({ 'x-admin-token': adminToken });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(url, { headers });
  if (!res.ok) await readError(res);
  return res.json();
}

export interface AdminStats {
  overview: {
    clients: number;
    lawyers: number;
    applications: number;
    pending_review: number;
    reviewed: number;
    estimated_revenue: number;
    estimated_profit: number;
  };
  by_type: {
    legal_notice: number;
    rent_agreement: number;
    affidavit: number;
  };
  monthly_applications: Array<{ month: string; count: number }>;
}

export async function apiAdminStats(adminToken: string): Promise<AdminStats> {
  const res = await fetch(`${BASE}/api/profile/admin/stats`, {
    headers: { 'x-admin-token': adminToken },
  });
  if (!res.ok) await readError(res);
  return res.json();
}

export async function apiAdminUserDetail(adminToken: string, userId: string): Promise<{ user: Profile; documents: unknown[] }> {
  const res = await fetch(`${BASE}/api/profile/admin/users/${userId}/view`, {
    headers: { 'x-admin-token': adminToken },
  });
  if (!res.ok) await readError(res);
  return res.json();
}

export interface AdminUserUpsertPayload {
  role?: 'client' | 'lawyer';
  full_name?: string;
  email?: string | null;
  password?: string;
  phone_number?: string | null;
  phone_verified?: boolean;
  address?: string | null;
  government_id_type?: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id' | null;
  government_id_number?: string | null;
  government_id_status?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  profile_photo_url?: string | null;
  identity_proof_url?: string | null;
  bar_council_id?: string | null;
  license_state?: string | null;
  years_experience?: number | null;
  firm_name?: string | null;
  office_address?: string | null;
  signature_url?: string | null;
  bar_certificate_url?: string | null;
  verification_status?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  profile_photo?: File | null;
  identity_proof?: File | null;
  signature?: File | null;
  bar_certificate?: File | null;
}

function toAdminFormData(payload: AdminUserUpsertPayload): FormData {
  const form = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined || v === null || v === '') continue;
    if (v instanceof File) {
      form.append(k, v);
      continue;
    }
    form.append(k, String(v));
  }
  return form;
}

export async function apiAdminCreateUser(adminToken: string, payload: AdminUserUpsertPayload): Promise<{ user: Profile }> {
  const form = toAdminFormData(payload);
  const res = await fetch(`${BASE}/api/profile/admin/users`, {
    method: 'POST',
    headers: { 'x-admin-token': adminToken },
    body: form,
  });
  if (!res.ok) await readError(res);
  return res.json();
}

export async function apiAdminUpdateUser(adminToken: string, userId: string, payload: AdminUserUpsertPayload): Promise<{ user: Profile }> {
  const form = toAdminFormData(payload);
  const res = await fetch(`${BASE}/api/profile/admin/users/${userId}`, {
    method: 'PUT',
    headers: { 'x-admin-token': adminToken },
    body: form,
  });
  if (!res.ok) await readError(res);
  return res.json();
}

export async function apiAdminDeleteUser(adminToken: string, userId: string): Promise<{ ok: boolean }> {
  const res = await fetch(`${BASE}/api/profile/admin/users/${userId}`, {
    method: 'DELETE',
    headers: { 'x-admin-token': adminToken },
  });
  if (!res.ok) await readError(res);
  return res.json();
}

export async function apiAdminVerify(
  adminToken: string,
  userId: string,
  payload: {
    status?: 'verified' | 'rejected';
    government_id_status?: 'verified' | 'rejected' | 'pending' | 'unsubmitted';
  }
): Promise<{ profile: Profile }> {
  const token = getAuthToken();
  const headers = new Headers({
    'Content-Type': 'application/json',
    'x-admin-token': adminToken,
  });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}/api/profile/admin/users/${userId}/verify`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  if (!res.ok) await readError(res);
  return res.json();
}

export async function apiLawyerWallet(): Promise<{
  wallet: {
    balance: number;
    pending_earnings: number;
    total_earned: number;
    total_withdrawn: number;
    currency: string;
  };
  transactions: Array<{
    id: string;
    document_id: string | null;
    amount: number;
    commission_rate: number;
    type: 'credit' | 'debit';
    status: 'pending' | 'completed' | 'failed';
    meta: Record<string, unknown>;
    created_at: string;
  }>;
  bank: { account_name: string | null; account_number: string | null; ifsc: string | null; upi_id: string | null };
}> {
  return apiFetch('/api/lawyer/wallet');
}

export async function apiLawyerBankSave(payload: {
  account_name?: string;
  account_number?: string;
  ifsc?: string;
  upi_id?: string;
}): Promise<{ ok: boolean; bank: { account_name: string | null; account_number: string | null; ifsc: string | null; upi_id: string | null } }> {
  return apiFetch('/api/lawyer/wallet/bank', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiLawyerWithdrawRequest(payload: { amount: number }): Promise<{ ok: boolean; request: unknown }> {
  return apiFetch('/api/lawyer/wallet/withdraw', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiPublicLawyers(): Promise<{ lawyers: Profile[] }> {
  const res = await fetch(`${BASE}/api/profile/public/lawyers`);
  if (!res.ok) await readError(res);
  return res.json();
}

export async function apiDocumentsList(q?: string): Promise<unknown[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : '';
  return apiFetch(`/api/documents${query}`);
}

export async function apiDocumentNotifications(): Promise<{ pending_unclaimed: number }> {
  return apiFetch('/api/documents/notifications');
}

export async function apiClaimDocument(id: string): Promise<unknown> {
  return apiFetch(`/api/documents/${id}/claim`, { method: 'POST' });
}

export async function apiDocumentById(id: string): Promise<unknown | null> {
  const token = getAuthToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}/api/documents/${id}`, { headers });
  if (res.status === 404) return null;
  if (!res.ok) {
    await readError(res);
  }
  return res.json();
}

export async function apiDocumentDelete(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/documents/${id}`, { method: 'DELETE' });
}

export interface CreateDocumentPayload {
  document_type: 'legal_notice' | 'rent_agreement' | 'affidavit';
  client_email?: string;
  notice_subtype?: string;
  draft_session_id?: string;
  client_generated_draft?: string;
  state_law?: string;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_order_id?: string;
  payment_id?: string;
  amount_paid?: number;
  memory_snapshot?: Record<string, unknown>;
  form_data: object;
  proof?: File[];
}

export async function apiDocumentsCreate(payload: CreateDocumentPayload): Promise<unknown> {
  const form = new FormData();
  form.append('document_type', payload.document_type);
  if (payload.client_email) form.append('client_email', payload.client_email);
  if (payload.notice_subtype) form.append('notice_subtype', payload.notice_subtype);
  if (payload.draft_session_id) form.append('draft_session_id', payload.draft_session_id);
  if (payload.client_generated_draft) form.append('client_generated_draft', payload.client_generated_draft);
  if (payload.state_law) form.append('state_law', payload.state_law);
  if (payload.payment_status) form.append('payment_status', payload.payment_status);
  if (payload.payment_order_id) form.append('payment_order_id', payload.payment_order_id);
  if (payload.payment_id) form.append('payment_id', payload.payment_id);
  if (payload.amount_paid !== undefined) form.append('amount_paid', String(payload.amount_paid));
  if (payload.memory_snapshot) form.append('memory_snapshot', JSON.stringify(payload.memory_snapshot));
  form.append('form_data', JSON.stringify(payload.form_data));
  (payload.proof || []).forEach((file) => form.append('proof', file));

  const token = getAuthToken();
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}/api/documents/create`, {
    method: 'POST',
    headers,
    body: form,
  });
  if (!res.ok) {
    await readError(res);
  }
  return res.json();
}

export async function apiCreatePaymentOrder(payload: {
  document_type: 'legal_notice' | 'rent_agreement' | 'affidavit';
  notice_subtype?: string;
  document_id?: string;
  draft_session_id?: string;
}): Promise<PaymentIntentOrder> {
  return apiFetch('/api/payments/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiConfirmPayment(payload: { order_id: string }): Promise<{ ok: boolean; status: 'paid'; order_id: string; payment_id: string }> {
  return apiFetch('/api/payments/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiDocumentUpdate(
  id: string,
  data: { lawyer_draft?: string; lawyer_notes?: string; status?: string }
): Promise<unknown> {
  const token = getAuthToken();
  const headers = new Headers({ 'Content-Type': 'application/json' });
  if (token) headers.set('Authorization', `Bearer ${token}`);
  const res = await fetch(`${BASE}/api/documents/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    await readError(res);
  }
  return res.json();
}

export async function apiDocumentQuery(id: string, payload: { message: string }): Promise<{ ok: boolean }> {
  return apiFetch(`/api/documents/${id}/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiDocumentQueryReply(id: string, payload: { message: string }): Promise<unknown> {
  return apiFetch(`/api/documents/${id}/query-reply`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiAssistantHelp(payload: {
  term: string;
  document_type: 'legal_notice' | 'rent_agreement' | 'affidavit';
  current_facts?: string;
}): Promise<{ explanation: string; when_it_matters?: string; caution?: string }> {
  return apiFetch('/api/documents/assistant/help', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiDraftSessionGet(documentType: 'legal_notice' | 'rent_agreement' | 'affidavit'): Promise<{ draft: unknown | null }> {
  return apiFetch(`/api/documents/draft-session?document_type=${encodeURIComponent(documentType)}`);
}

export async function apiDraftSessionSave(payload: {
  id?: string;
  document_type: 'legal_notice' | 'rent_agreement' | 'affidavit';
  notice_subtype?: string;
  state_law?: string;
  form_data: object;
  memory_snapshot?: Record<string, unknown>;
}): Promise<{ draft: unknown }> {
  return apiFetch('/api/documents/draft-session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiDocumentMemoryUpdate(
  id: string,
  payload: { form_data?: object; memory_snapshot?: Record<string, unknown> }
): Promise<unknown> {
  return apiFetch(`/api/documents/${id}/memory`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiDocumentTransition(
  id: string,
  payload: { stage: string; meta?: Record<string, unknown>; recipient_email?: string; recipient_phone?: string; delivery_address?: string }
): Promise<unknown> {
  return apiFetch(`/api/documents/${id}/transition`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiDocumentRegenerateDraft(id: string, instructions?: string): Promise<unknown> {
  return apiFetch(`/api/documents/${id}/regenerate-draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instructions }),
  });
}

export async function apiFormSchema(noticeType: string, noticeSubtype?: string): Promise<{
  notice_type: string;
  notice_subtype?: string | null;
  schema: {
    title: string;
    steps: Array<{ title: string; fields: Array<{ key: string; label: string; type: string; required?: boolean; options?: Array<{ id: string; label: string }> }> }>;
  };
}> {
  const qs = noticeSubtype ? `?subtype=${encodeURIComponent(noticeSubtype)}` : '';
  return apiFetch(`/api/forms/schema/${encodeURIComponent(noticeType)}${qs}`);
}

export async function apiDocumentVoiceStatus(id: string): Promise<{
  document_id: string;
  stage: string;
  summary: string;
  timeline_events: Array<{ id: string; stage: string; actor: string; at: string }>;
  voice_agent_hint: string;
}> {
  return apiFetch(`/api/documents/${id}/voice-status`);
}

export async function apiAiAssistantChat(payload: {
  message: string;
  document_type?: 'legal_notice' | 'rent_agreement' | 'affidavit';
  language?: 'english' | 'hindi' | 'hinglish';
}): Promise<{ reply: string; when_it_matters?: string; caution?: string; language: string; source: string }> {
  return apiFetch('/api/ai/assistant/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiAiHelpdeskChat(payload: {
  message: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  language?: 'english' | 'hindi' | 'hinglish';
}): Promise<{
  reply: string;
  actions: Array<{ type: string; label: string; href?: string; preview?: string }>;
  language: string;
  source: string;
}> {
  return apiFetch('/api/ai/helpdesk/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiNotificationsList(): Promise<{ notifications: AppNotification[]; unread: number }> {
  return apiFetch('/api/notifications');
}

export async function apiNotificationRead(id: string): Promise<{ ok: boolean }> {
  return apiFetch(`/api/notifications/${id}/read`, { method: 'POST' });
}

export async function apiNotificationsClearAll(): Promise<{ ok: boolean; updated: number }> {
  return apiFetch('/api/notifications/read-all', { method: 'PATCH' });
}

export async function apiSupportTickets(): Promise<{ tickets: SupportTicket[] }> {
  return apiFetch('/api/support/tickets');
}

export async function apiCreateSupportTicket(payload: {
  category: SupportTicket['category'];
  subject: string;
  description: string;
  document_id?: string;
  priority?: SupportTicket['priority'];
  meta?: Record<string, unknown>;
}): Promise<{ ticket: SupportTicket }> {
  return apiFetch('/api/support/tickets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiSupportCaseStatus(): Promise<{
  document: {
    id: string;
    document_type: string;
    status: string;
    payment_status?: string;
    updated_at: string;
  } | null;
}> {
  return apiFetch('/api/support/case-status');
}

export async function apiVoiceFaq(payload: { question: string }): Promise<{ answer: string; source: string }> {
  return apiFetch('/api/ai/voice/faq', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiVoiceStatus(payload: {
  document_id: string;
  language?: 'english' | 'hindi' | 'hinglish';
}): Promise<{ document_id: string; stage: string; voice_text: string }> {
  return apiFetch('/api/ai/voice/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiEstimateNoticeCost(payload: {
  document_type: 'legal_notice' | 'rent_agreement' | 'affidavit';
  notice_subtype?: string;
}): Promise<{ base_fee: number; gst: number; total: number; currency: string }> {
  return apiFetch('/api/tools/notice-cost', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiEstimateStampDuty(payload: {
  state: string;
  rent_amount?: number;
  lease_months?: number;
  document_type?: 'rent_agreement' | 'affidavit' | 'legal_notice';
}): Promise<{ state: string; estimated_stamp_duty: number; currency: string }> {
  return apiFetch('/api/tools/stamp-duty', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiEsignRequest(payload: {
  document_id: string;
  provider?: string;
  signers?: Array<{ name: string; email?: string; phone?: string; role: 'client' | 'lawyer' | 'witness' }>;
}): Promise<{ ok: boolean; esign_status: string; esign_request_id: string }> {
  return apiFetch(`/api/esign/${payload.document_id}/request`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider: payload.provider, signers: payload.signers || [] }),
  });
}

export async function apiEsignMarkSigned(documentId: string, provider?: string): Promise<{ ok: boolean; esign_status: string }> {
  return apiFetch(`/api/esign/${documentId}/mark-signed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider }),
  });
}

export async function apiEsignStatus(documentId: string): Promise<{
  document_id: string;
  esign_status: string;
  esign_provider?: string;
  esign_request_id?: string;
  signed_at?: string;
}> {
  return apiFetch(`/api/esign/${documentId}/status`);
}

export async function apiBookLawyer(lawyerId: string, payload: {
  scheduled_for: string;
  document_id?: string;
  notes?: string;
  timezone?: string;
}): Promise<{ meeting: unknown }> {
  return apiFetch(`/api/lawyers/${lawyerId}/book`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function apiApproveDispatch(documentId: string, payload?: {
  pickup_address?: Record<string, unknown>;
  delivery_address?: Record<string, unknown>;
}): Promise<{ pdf_url: string; tracking_id: string }> {
  return apiFetch(`/api/notices/${documentId}/approve-dispatch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload || {}),
  });
}

export async function apiNoticeTrack(documentId: string): Promise<{ tracking_id: string; status: string }> {
  return apiFetch(`/api/notices/${documentId}/track`);
}

export async function apiPublicNoticeVerify(token: string): Promise<{
  document: Record<string, unknown>;
  evidence: Array<Record<string, unknown>>;
  responses: Array<Record<string, unknown>>;
}> {
  const res = await fetch(`${BASE}/api/notices/verify/${encodeURIComponent(token)}`);
  if (!res.ok) await readError(res);
  return res.json();
}

export async function apiPublicNoticeRespond(token: string, payload: {
  response_type: 'counter_response' | 'settlement_request';
  responder_name: string;
  responder_email?: string;
  responder_phone?: string;
  message: string;
}): Promise<{ response: Record<string, unknown> }> {
  const res = await fetch(`${BASE}/api/notices/verify/${encodeURIComponent(token)}/respond`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await readError(res);
  return res.json();
}
