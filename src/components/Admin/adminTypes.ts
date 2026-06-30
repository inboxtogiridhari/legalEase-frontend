export type AdminRole = 'client' | 'lawyer';
export type VerifyMode = 'view' | 'verify';

export interface UserFormFiles {
  profile_photo: File | null;
  identity_proof: File | null;
  signature: File | null;
  bar_certificate: File | null;
}

export interface UserFormData {
  role: AdminRole;
  full_name: string;
  email: string;
  password: string;
  phone_number: string;
  phone_verified: boolean;
  address: string;
  government_id_type: '' | 'aadhaar' | 'pan' | 'passport' | 'driving_license' | 'voter_id';
  government_id_number: string;
  government_id_status: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
  profile_photo_url: string;
  identity_proof_url: string;
  bar_council_id: string;
  license_state: string;
  years_experience: string;
  firm_name: string;
  office_address: string;
  signature_url: string;
  bar_certificate_url: string;
  verification_status: 'unsubmitted' | 'pending' | 'verified' | 'rejected';
}

export interface AdminDoc {
  id: string;
  document_type: string;
  status: string;
  attachments: Array<{ url: string; name: string }>;
  created_at: string;
}
