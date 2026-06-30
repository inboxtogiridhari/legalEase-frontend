/*
  # LegalEase Database Schema

  ## Overview
  This migration creates the complete database schema for the LegalEase Legal-Tech application.
  
  ## New Tables
  
  ### 1. profiles
  - `id` (uuid, primary key) - References auth.users
  - `email` (text) - User's email address
  - `full_name` (text) - User's full name
  - `role` (text) - User role: 'client' or 'lawyer'
  - `created_at` (timestamptz) - Account creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### 2. documents
  - `id` (uuid, primary key) - Document unique identifier
  - `client_id` (uuid) - References profiles(id)
  - `document_type` (text) - Type: 'legal_notice', 'rent_agreement', 'affidavit'
  - `status` (text) - Status: 'draft', 'pending_review', 'reviewed', 'completed'
  - `form_data` (jsonb) - Original form data submitted by client
  - `ai_draft` (text) - AI-generated draft content
  - `lawyer_draft` (text) - Lawyer-edited draft content
  - `lawyer_notes` (text) - Lawyer's review notes
  - `reviewed_by` (uuid) - References profiles(id) for lawyer
  - `reviewed_at` (timestamptz) - Review completion timestamp
  - `created_at` (timestamptz) - Document creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ## Security
  - Enable RLS on all tables
  - Clients can view/create their own documents
  - Lawyers can view all pending documents and update them
  - Users can only read their own profile
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('client', 'lawyer')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('legal_notice', 'rent_agreement', 'affidavit')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'reviewed', 'completed')),
  form_data jsonb NOT NULL DEFAULT '{}',
  ai_draft text DEFAULT '',
  lawyer_draft text DEFAULT '',
  lawyer_notes text DEFAULT '',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Documents Policies
CREATE POLICY "Clients can view own documents"
  ON documents FOR SELECT
  TO authenticated
  USING (
    client_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

CREATE POLICY "Clients can create own documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Clients can update own draft documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    client_id = auth.uid() AND status = 'draft'
  )
  WITH CHECK (
    client_id = auth.uid() AND status = 'draft'
  );

CREATE POLICY "Lawyers can update any document"
  ON documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'lawyer'
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_client_id ON documents(client_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
