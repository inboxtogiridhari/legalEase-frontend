export type BarCouncilVerificationStatus =
  | 'NOT_SUBMITTED'
  | 'SUBMITTED'
  | 'FORMAT_VALID'
  | 'DOCUMENT_REVIEW_PENDING'
  | 'OFFICIAL_VERIFICATION_PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'EXPIRED';

export interface BarCouncilVerificationResult {
  status: 'verified' | 'not_found' | 'manual_review' | 'unavailable';
  source: string;
  verifiedAt?: string;
  message: string;
}

export function verifyEnrollment({
  barCouncil,
  enrollmentNumber,
  enrollmentYear,
}: {
  barCouncil?: string | null;
  enrollmentNumber?: string | null;
  enrollmentYear?: string | number | null;
}): BarCouncilVerificationResult {
  if (!barCouncil || !enrollmentNumber || !enrollmentYear) {
    return {
      status: 'unavailable',
      source: 'local-validation',
      message: 'Profile submission is incomplete. Formal verification requires state, enrolment number, and enrolment year.',
    };
  }

  const cleaned = String(enrollmentNumber).trim();
  const numericYear = Number(enrollmentYear);
  if (!cleaned || Number.isNaN(numericYear) || numericYear > new Date().getFullYear()) {
    return {
      status: 'manual_review',
      source: 'local-validation',
      message: 'The enrolment details need review before official verification can proceed.',
    };
  }

  return {
    status: 'manual_review',
    source: 'admin-review',
    message: 'Format and document checks passed. Official verification is pending admin review for the selected State Bar Council.',
  };
}

export function getVerificationStatusMeta(status?: string | null) {
  const normalized = (status || 'NOT_SUBMITTED').toUpperCase();
  const map: Record<string, { label: string; tone: string }> = {
    NOT_SUBMITTED: { label: 'Not Submitted', tone: 'bg-slate-100 text-slate-700' },
    SUBMITTED: { label: 'Submitted', tone: 'bg-amber-100 text-amber-700' },
    FORMAT_VALID: { label: 'Format Validated', tone: 'bg-sky-100 text-sky-700' },
    DOCUMENT_REVIEW_PENDING: { label: 'Document Review Pending', tone: 'bg-violet-100 text-violet-700' },
    OFFICIAL_VERIFICATION_PENDING: { label: 'Official Verification Pending', tone: 'bg-amber-100 text-amber-700' },
    VERIFIED: { label: 'Verified Advocate', tone: 'bg-emerald-100 text-emerald-700' },
    REJECTED: { label: 'Rejected', tone: 'bg-rose-100 text-rose-700' },
    EXPIRED: { label: 'Needs Renewal', tone: 'bg-orange-100 text-orange-700' },
  };

  return map[normalized] || map.NOT_SUBMITTED;
}
