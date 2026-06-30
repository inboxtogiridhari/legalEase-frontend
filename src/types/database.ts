export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          role: 'client' | 'lawyer';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          role: 'client' | 'lawyer';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          role?: 'client' | 'lawyer';
          created_at?: string;
          updated_at?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          client_id: string;
          document_type: 'legal_notice' | 'rent_agreement' | 'affidavit';
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
          form_data: Json;
          ai_draft: string;
          lawyer_draft: string;
          lawyer_notes: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          document_type: 'legal_notice' | 'rent_agreement' | 'affidavit';
          status?:
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
          form_data: Json;
          ai_draft?: string;
          lawyer_draft?: string;
          lawyer_notes?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          document_type?: 'legal_notice' | 'rent_agreement' | 'affidavit';
          status?:
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
          form_data?: Json;
          ai_draft?: string;
          lawyer_draft?: string;
          lawyer_notes?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
