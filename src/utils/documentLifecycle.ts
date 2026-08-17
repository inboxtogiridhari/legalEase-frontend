import { Document } from '../types';

export type ClientDocumentStatus =
  | 'DRAFT'
  | 'AWAITING_LAWYER'
  | 'UNDER_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'VERIFIED'
  | 'PAYMENT_PENDING'
  | 'PROCESSING'
  | 'COMPLETED';

export interface StatusMeta {
  clientStatus: ClientDocumentStatus;
  label: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  description: string;
}

export interface ContextualGuidance {
  whereAmI: string;
  whatStatus: string;
  whatHappened: string;
  whatToDo: string;
  whatHappensNext: string;
}

export interface DocumentAction {
  label: string;
  actionType: 'edit' | 'track' | 'review' | 'view' | 'download' | 'pay';
}

export const LIFECYCLE_STAGES = [
  { id: 'drafting', label: 'Draft Created', desc: 'Form details collected' },
  { id: 'lawyer_review', label: 'Submitted for Review', desc: 'Assigned to verified advocate' },
  { id: 'query', label: 'Lawyer Reviewing', desc: 'Lawyer scrutinizing facts & law' },
  { id: 'reviewed', label: 'Changes / Feedback', desc: 'Lawyer provided guidance or queries' },
  { id: 'verified', label: 'Verified & Approved', desc: 'Court-style legal draft verified' },
  { id: 'payment', label: 'Payment Completed', desc: 'Fee processed successfully' },
  { id: 'sent_soft_copy', label: 'Soft Copy Sent', desc: 'Digital PDF dispatched via email/whatsapp' },
  { id: 'out_for_delivery', label: 'Out for Delivery', desc: 'Stamp paper dispatch initiated' },
  { id: 'delivered', label: 'Completed & Delivered', desc: 'Document ready for use & court filing' },
];

export function mapDocumentStatus(doc: Document): StatusMeta {
  const status = doc.status;
  const isDraft = doc.is_session_draft || status === 'draft' || status === 'drafting';
  const hasLawyerNotes = Boolean(doc.lawyer_notes && doc.lawyer_notes.trim());

  if (isDraft) {
    return {
      clientStatus: 'DRAFT',
      label: 'Draft',
      badgeBg: 'bg-slate-100',
      badgeText: 'text-slate-700',
      borderColor: 'border-slate-300',
      description: 'Your document details are saved as a draft.',
    };
  }

  if (status === 'pending_review' || status === 'lawyer_review') {
    return {
      clientStatus: 'AWAITING_LAWYER',
      label: 'Awaiting Lawyer',
      badgeBg: 'bg-amber-100',
      badgeText: 'text-amber-800',
      borderColor: 'border-amber-300',
      description: 'Your document is queued for advocate assignment and review.',
    };
  }

  if (status === 'reviewed') {
    if (hasLawyerNotes) {
      return {
        clientStatus: 'CHANGES_REQUESTED',
        label: 'Changes Requested',
        badgeBg: 'bg-[#1a237e]/10',
        badgeText: 'text-[#1a237e]',
        borderColor: 'border-[#1a237e]',
        description: 'The reviewing advocate has left comments or feedback.',
      };
    }
    return {
      clientStatus: 'UNDER_REVIEW',
      label: 'Under Review',
      badgeBg: 'bg-sky-100',
      badgeText: 'text-sky-800',
      borderColor: 'border-sky-300',
      description: 'The assigned lawyer is currently inspecting your draft.',
    };
  }

  if (status === 'verified' || status === 'signed') {
    return {
      clientStatus: 'VERIFIED',
      label: 'Verified',
      badgeBg: 'bg-indigo-100',
      badgeText: 'text-indigo-800',
      borderColor: 'border-indigo-300',
      description: 'Lawyer verification complete. Court-ready draft approved.',
    };
  }

  if (status === 'payment' || doc.payment_status === 'pending') {
    return {
      clientStatus: 'PAYMENT_PENDING',
      label: 'Payment Pending',
      badgeBg: 'bg-violet-100',
      badgeText: 'text-violet-800',
      borderColor: 'border-violet-300',
      description: 'Payment is required to unlock full delivery and verified PDF.',
    };
  }

  if (status === 'sent_soft_copy' || status === 'out_for_delivery') {
    return {
      clientStatus: 'PROCESSING',
      label: 'Processing Delivery',
      badgeBg: 'bg-cyan-100',
      badgeText: 'text-cyan-800',
      borderColor: 'border-cyan-300',
      description: 'Soft copy sent or physical dispatch in transit.',
    };
  }

  if (status === 'delivered' || status === 'completed') {
    return {
      clientStatus: 'COMPLETED',
      label: 'Completed',
      badgeBg: 'bg-emerald-100',
      badgeText: 'text-emerald-800',
      borderColor: 'border-emerald-300',
      description: 'Your document execution and review lifecycle is complete.',
    };
  }

  return {
    clientStatus: 'DRAFT',
    label: 'In Progress',
    badgeBg: 'bg-slate-100',
    badgeText: 'text-slate-700',
    borderColor: 'border-slate-300',
    description: 'Document in progress.',
  };
}

export function getNextAction(doc: Document): DocumentAction {
  const meta = mapDocumentStatus(doc);

  switch (meta.clientStatus) {
    case 'DRAFT':
      return { label: 'Continue', actionType: 'edit' };
    case 'AWAITING_LAWYER':
      return { label: 'Track Review', actionType: 'track' };
    case 'UNDER_REVIEW':
      return { label: 'Track Review', actionType: 'track' };
    case 'CHANGES_REQUESTED':
      return { label: 'Review Changes', actionType: 'review' };
    case 'VERIFIED':
      return { label: 'View Verified Document', actionType: 'view' };
    case 'PAYMENT_PENDING':
      return { label: 'Complete Payment', actionType: 'pay' };
    case 'PROCESSING':
      return { label: 'Track Delivery', actionType: 'track' };
    case 'COMPLETED':
      return { label: 'View / Download', actionType: 'download' };
    default:
      return { label: 'View Document', actionType: 'view' };
  }
}

export function calculateDashboardCounts(documents: Document[]) {
  const counts = {
    drafts: 0,
    awaitingLawyer: 0,
    underReview: 0,
    changesRequested: 0,
    verified: 0,
    completed: 0,
  };

  documents.forEach((doc) => {
    const meta = mapDocumentStatus(doc);
    switch (meta.clientStatus) {
      case 'DRAFT':
        counts.drafts += 1;
        break;
      case 'AWAITING_LAWYER':
        counts.awaitingLawyer += 1;
        break;
      case 'UNDER_REVIEW':
        counts.underReview += 1;
        break;
      case 'CHANGES_REQUESTED':
        counts.changesRequested += 1;
        break;
      case 'VERIFIED':
      case 'PAYMENT_PENDING':
        counts.verified += 1;
        break;
      case 'PROCESSING':
      case 'COMPLETED':
        counts.completed += 1;
        break;
    }
  });

  return counts;
}

export function getContextualGuidance(doc: Document): ContextualGuidance {
  const meta = mapDocumentStatus(doc);
  const typeLabel = doc.document_type.replace(/_/g, ' ');

  switch (meta.clientStatus) {
    case 'DRAFT':
      return {
        whereAmI: `Drafting ${typeLabel}`,
        whatStatus: 'Draft Saved',
        whatHappened: 'You have started filling the document wizard.',
        whatToDo: 'Click Continue to finish filling required details and submit for advocate review.',
        whatHappensNext: 'After submission, an advocate will review your draft for legal accuracy.',
      };
    case 'AWAITING_LAWYER':
      return {
        whereAmI: `Review Pipeline for ${typeLabel}`,
        whatStatus: 'Awaiting Lawyer Assignment',
        whatHappened: 'Your document details and proof attachments were submitted successfully.',
        whatToDo: 'No action required from you right now.',
        whatHappensNext: 'A verified advocate will claim your case and inspect all legal clauses.',
      };
    case 'UNDER_REVIEW':
      return {
        whereAmI: `Advocate Reviewing ${typeLabel}`,
        whatStatus: 'Under Lawyer Scrutiny',
        whatHappened: `Lawyer ${doc.reviewed_by_name || 'Advocate'} is inspecting your submission.`,
        whatToDo: 'Check lawyer notes or reply to queries if requested.',
        whatHappensNext: 'Once verified, the lawyer will sign off on the court-ready draft.',
      };
    case 'CHANGES_REQUESTED':
      return {
        whereAmI: `Lawyer Feedback for ${typeLabel}`,
        whatStatus: 'Lawyer Feedback Provided',
        whatHappened: 'The advocate left notes or requested clarification on your matter facts.',
        whatToDo: 'Review the lawyer notes below and respond or update your inputs.',
        whatHappensNext: 'Your reply will be sent directly to the lawyer to approve the draft.',
      };
    case 'VERIFIED':
      return {
        whereAmI: `Verified ${typeLabel}`,
        whatStatus: 'Legal Draft Approved',
        whatHappened: `Verified by ${doc.reviewed_by_name || 'Assigned Advocate'}. Legal quality checks passed.`,
        whatToDo: 'Review the court-ready layout or proceed to digital signing / print.',
        whatHappensNext: 'You can download the final PDF or print for official use.',
      };
    case 'PAYMENT_PENDING':
      return {
        whereAmI: `Payment Stage for ${typeLabel}`,
        whatStatus: 'Payment Required',
        whatHappened: 'Draft is verified by advocate. Payment order created.',
        whatToDo: 'Complete payment to unlock high-resolution PDF download & delivery.',
        whatHappensNext: 'Soft copy & tracking instructions will be dispatched immediately.',
      };
    case 'PROCESSING':
      return {
        whereAmI: `Delivery Dispatch for ${typeLabel}`,
        whatStatus: 'Out for Delivery / Sent',
        whatHappened: 'Soft copy dispatched via email/whatsapp or hard copy shipped.',
        whatToDo: 'Check your email/SMS or monitor courier tracking status.',
        whatHappensNext: 'Final delivery completion sign-off.',
      };
    case 'COMPLETED':
      return {
        whereAmI: `Completed ${typeLabel}`,
        whatStatus: 'Workflow Completed',
        whatHappened: 'Document lifecycle complete. All legal checks & delivery finalized.',
        whatToDo: 'Print or download your court-ready document anytime.',
        whatHappensNext: 'Stored securely in your client legal vault.',
      };
  }
}
