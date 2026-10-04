export interface Profile {
  id: string;
  email: string | null;
  full_name: string;
  role: 'client' | 'lawyer';
  phone_number?: string | null;
  phone_verified?: boolean;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  government_id_type?: 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id' | null;
  government_id_number?: string | null;
  government_id_status?: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  profile_photo_url?: string | null;
  bar_council_id?: string | null;
  license_state?: string | null;
  years_experience?: number | null;
  firm_name?: string | null;
  office_address?: string | null;
  signature_url?: string | null;
  bar_certificate_url?: string | null;
  identity_proof_url?: string | null;
  professional_bio?: string | null;
  practice_areas?: string | null;
  courts?: string | null;
  bar_association?: string | null;
  enrollment_number?: string | null;
  enrollment_year?: number | null;
  enrollment_date?: string | null;
  verification_status?: 'unsubmitted' | 'pending' | 'verified' | 'rejected' | 'format_valid' | 'submitted' | 'document_review_pending' | 'official_verification_pending';
  verification_source?: string | null;
  verified_at?: string | null;
  verification_reason?: string | null;
  bank_account_number?: string | null;
  bank_ifsc?: string | null;
  bank_upi_id?: string | null;
  bank_account_name?: string | null;
  rating?: number | null;
  created_at: string;
  updated_at: string;
}

export interface DocumentAttachment {
  url: string;
  name: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  milestone: string;
  channel: 'in_app' | 'email' | 'sms' | 'whatsapp';
  document_id?: string | null;
  deep_link_url?: string | null;
  status: 'queued' | 'sent' | 'failed' | 'read';
  created_at: string;
  read_at?: string | null;
  meta?: Record<string, unknown>;
}

export interface PaymentIntentApp {
  id: string;
  label: string;
  intent_url: string;
}

export interface PaymentIntentOrder {
  ok: boolean;
  gateway: string;
  order_id: string;
  amount: number;
  currency: string;
  qr_code_data_url: string;
  upi_uri: string;
  apps: PaymentIntentApp[];
}

export interface SupportTicket {
  id: string;
  user_id: string;
  document_id?: string | null;
  category: 'payment_refund' | 'case_status' | 'call_support' | 'general';
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved';
  priority: 'low' | 'medium' | 'high';
  meta?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  client_id: string;
  document_type: 'legal_notice' | 'rent_agreement' | 'affidavit';
  notice_subtype?: string | null;
  status:
    | 'draft'
    | 'pending_review'
    | 'reviewed'
    | 'completed'
    | 'drafting'
    | 'lawyer_review'
    | 'verified'
    | 'signed'
    | 'payment'
    | 'sent_soft_copy'
    | 'out_for_delivery'
    | 'delivered';
  is_session_draft?: boolean;
  form_data: LegalNoticeData | RentAgreementData | AffidavitData;
  memory_snapshot?: Record<string, unknown>;
  ai_draft: string;
  lawyer_draft: string;
  lawyer_notes: string;
  reviewed_by: string | null;
  reviewed_by_name?: string | null;
  reviewed_by_signature_url?: string | null;
  reviewed_by_profile?: {
    id: string;
    full_name: string;
    firm_name?: string | null;
    years_experience?: number | null;
    profile_photo_url?: string | null;
    bar_council_id?: string | null;
  } | null;
  client_profile?: {
    id: string;
    full_name: string;
    email?: string | null;
    phone_number?: string | null;
    address?: string | null;
    history_count?: number | null;
    latest_reason?: string | null;
  } | null;
  assigned_lawyer_id?: string | null;
  claimed_at?: string | null;
  reviewed_at: string | null;
  attachments?: DocumentAttachment[];
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  payment_order_id?: string | null;
  payment_id?: string | null;
  amount_paid?: number | null;
  timeline_events?: Array<{
    id: string;
    stage: string;
    actor: string;
    at: string;
    metadata?: Record<string, unknown>;
  }>;
  delivery_meta?: {
    soft_copy?: Record<string, unknown>;
    hard_copy?: Record<string, unknown>;
    notifications?: Record<string, { sent?: boolean; mocked?: boolean; reason?: boolean; at?: string }>;
  };
  esign_status?: 'not_requested' | 'requested' | 'sent' | 'signed' | 'failed';
  esign_provider?: string | null;
  esign_request_id?: string | null;
  signed_at?: string | null;
  state_law?: string | null;
  structured_draft?: Record<string, unknown>;
  document_meta?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LegalNoticeData {
  noticeType: string;
  senderName: string;
  senderAddress: string;
  senderPhone?: string;
  senderEmail?: string;
  recipientName: string;
  recipientAddress: string;
  recipientPhone?: string;
  recipientEmail?: string;
  subject: string;
  description: string;
  demands: string;
  timeline: string;
  // Cheque bounce
  chequeNumber?: string;
  chequeDate?: string;
  chequeAmount?: string;
  bankName?: string;
  branch?: string;
  presentationDate?: string;
  dishonourDate?: string;
  dishonourReason?: string;
  returnMemoDate?: string;
  underlyingLiability?: string;
  demandAmount?: string;
  // Tenant eviction
  landlordName?: string;
  tenantName?: string;
  propertyAddress?: string;
  tenancyAgreementDate?: string;
  rentAmount?: string;
  securityDeposit?: string;
  arrears?: string;
  evictionGround?: string;
  previousNoticeDetails?: string;
  requiredPossessionDate?: string;
  // Money recovery
  transactionDate?: string;
  transactionType?: string;
  invoiceNumber?: string;
  principalAmount?: string;
  interestRate?: string;
  totalOutstanding?: string;
  dueDate?: string;
  remindersMade?: string;
  paymentHistory?: string;
  // Divorce / family
  spouseName?: string;
  marriageDate?: string;
  marriagePlace?: string;
  matrimonialResidence?: string;
  childrenDetails?: string;
  priorResolutionAttempts?: string;
  requestedAction?: string;
  // Employment
  employeeName?: string;
  employerName?: string;
  designation?: string;
  employerAddress?: string;
  employmentStartDate?: string;
  disputeType?: string;
  salaryDues?: string;
  dueFromDate?: string;
  dueToDate?: string;
  terminationDate?: string;
  terminationReason?: string;
  noticePeriod?: string;
  deductionAmount?: string;
  deductionDate?: string;
  gratuityAmount?: string;
  yearsOfService?: string;
  lastWorkingDay?: string;
  letterRequestedDate?: string;
  otherDescription?: string;
  // Common
  hasWitnesses?: string;
  legalProvisions?: string;
  consequences?: string;
  closing?: string;
  witness1?: string;
  witness2?: string;
}

export interface RentAgreementData {
  landlordName: string;
  landlordAddress: string;
  tenantName: string;
  tenantAddress: string;
  propertyAddress: string;
  rentAmount: string;
  securityDeposit: string;
  leasePeriod: string;
  startDate: string;
  specialTerms: string;
}

export interface AffidavitData {
  deponentName: string;
  deponentAge: string;
  deponentAddress: string;
  deponentOccupation: string;
  purpose: string;
  facts: string;
  verification: string;
}
