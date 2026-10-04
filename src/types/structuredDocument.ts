export interface AdvocateDetails {
  name: string;
  designation: string;
  enrollmentNumber: string;
  firmName: string;
  address: string;
  phone: string;
  email: string;
  signatureUrl: string;
}

export interface ClientDetails {
  name: string;
  parentName: string;
  address: string;
  phone: string;
  email: string;
}

export interface RecipientDetails {
  name: string;
  parentName: string;
  designation: string;
  organization: string;
  address: string;
  phone: string;
  email: string;
}

export interface FactParagraph {
  id: string;
  label: string;
  text: string;
}

export interface DemandItem {
  id: string;
  label: string;
  text: string;
}

export interface LegalProvision {
  id: string;
  text: string;
}

export interface AnnexureItem {
  id: string;
  label: string;
  url: string;
  name: string;
}

export interface DocumentSignature {
  hasWitness: boolean;
  witness1: string;
  witness2: string;
  clientSignatureLabel: string;
  advocateSignatureLabel: string;
  withoutPrejudice: boolean;
}

export interface DocumentMeta {
  version: number;
  status: string;
  createdAt: string;
  updatedAt: string;
  reviewedAt: string;
  reviewedBy: string;
  reviewedByName: string;
  sections: string[];
  requiresLawyerReview: boolean;
  generatedFrom: string;
  hasAnnexures: boolean;
}

export interface StructuredLegalNoticeDocument {
  documentType: string;
  noticeType: string;
  jurisdiction: string;
  state: string;
  city: string;
  noticeDate: string;
  advocate: AdvocateDetails;
  client: ClientDetails;
  recipient: RecipientDetails;
  subject: string;
  facts: FactParagraph[];
  demands: DemandItem[];
  compliancePeriod: string;
  consequences: string;
  closing: string;
  signature: DocumentSignature;
  annexures: AnnexureItem[];
  legalProvisions: LegalProvision[];
  metadata: DocumentMeta;
}

export interface StructuredRentalAgreementDocument {
  documentType: string;
  noticeType: string;
  noticeDate: string;
  client: ClientDetails;
  recipient: RecipientDetails;
  facts: FactParagraph[];
  signature: DocumentSignature;
  annexures: AnnexureItem[];
  metadata: DocumentMeta;
}

export interface StructuredAffidavitDocument {
  documentType: string;
  noticeType: string;
  city: string;
  noticeDate: string;
  client: ClientDetails;
  facts: FactParagraph[];
  closing: string;
  signature: DocumentSignature;
  annexures: AnnexureItem[];
  metadata: DocumentMeta;
}

export type StructuredDocument = StructuredLegalNoticeDocument | StructuredRentalAgreementDocument | StructuredAffidavitDocument;
