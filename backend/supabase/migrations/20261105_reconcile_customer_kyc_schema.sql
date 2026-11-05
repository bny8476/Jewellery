-- ============================================================================
-- YAZHINI FINE JEWELS — Canonical Customer KYC Schema Reconciliation
-- Migration: 20261105_reconcile_customer_kyc_schema.sql
-- ============================================================================

-- 1. Ensure public.customers table exists
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Ensure public.customer_kyc table exists
CREATE TABLE IF NOT EXISTS public.customer_kyc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id text UNIQUE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  legal_name text,
  date_of_birth date,
  pan_masked text,
  pan_hash text,
  aadhaar_masked text,
  aadhaar_hash text,
  document_type text DEFAULT 'Aadhaar Card',
  document_url text,
  consent_given boolean DEFAULT true,
  status text NOT NULL DEFAULT 'PENDING_VERIFICATION'
    CHECK (status IN ('NOT_SUBMITTED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED')),
  rejection_reason text,
  action_required_notes text,
  reviewer_id text,
  reviewer_name text,
  verified_at timestamptz,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Idempotently add any missing columns to handle schema variations
DO $$
BEGIN
  -- reference_id / kyc_reference
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'reference_id') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN reference_id text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'kyc_reference') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN kyc_reference text;
  END IF;

  -- legal_name / full_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'legal_name') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN legal_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'full_name') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN full_name text;
  END IF;

  -- pan_masked / pan_number_masked
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'pan_masked') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN pan_masked text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'pan_number_masked') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN pan_number_masked text;
  END IF;

  -- aadhaar_masked / aadhaar_number_masked
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'aadhaar_masked') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN aadhaar_masked text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'aadhaar_number_masked') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN aadhaar_number_masked text;
  END IF;

  -- document_type / id_proof_type
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'document_type') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN document_type text DEFAULT 'Aadhaar Card';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'id_proof_type') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN id_proof_type text DEFAULT 'pan_aadhaar';
  END IF;

  -- reviewer_name / reviewer_email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'reviewer_name') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN reviewer_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'reviewer_email') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN reviewer_email text;
  END IF;

  -- submitted_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'customer_kyc' AND column_name = 'submitted_at') THEN
    ALTER TABLE public.customer_kyc ADD COLUMN submitted_at timestamptz DEFAULT now();
  END IF;
END $$;

-- 4. Synchronize data between dual-column names
UPDATE public.customer_kyc SET reference_id = kyc_reference WHERE reference_id IS NULL AND kyc_reference IS NOT NULL;
UPDATE public.customer_kyc SET kyc_reference = reference_id WHERE kyc_reference IS NULL AND reference_id IS NOT NULL;
UPDATE public.customer_kyc SET legal_name = full_name WHERE legal_name IS NULL AND full_name IS NOT NULL;
UPDATE public.customer_kyc SET full_name = legal_name WHERE full_name IS NULL AND legal_name IS NOT NULL;
UPDATE public.customer_kyc SET pan_masked = pan_number_masked WHERE pan_masked IS NULL AND pan_number_masked IS NOT NULL;
UPDATE public.customer_kyc SET aadhaar_masked = aadhaar_number_masked WHERE aadhaar_masked IS NULL AND aadhaar_number_masked IS NOT NULL;
UPDATE public.customer_kyc SET document_type = id_proof_type WHERE document_type IS NULL AND id_proof_type IS NOT NULL;
UPDATE public.customer_kyc SET reviewer_name = reviewer_email WHERE reviewer_name IS NULL AND reviewer_email IS NOT NULL;
UPDATE public.customer_kyc SET submitted_at = created_at WHERE submitted_at IS NULL AND created_at IS NOT NULL;

-- 5. Ensure customer_kyc_audit table exists
CREATE TABLE IF NOT EXISTS public.customer_kyc_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_id uuid REFERENCES public.customer_kyc(id) ON DELETE CASCADE,
  customer_id uuid,
  from_status text,
  to_status text NOT NULL,
  changed_by_user_id text,
  changed_by_name text,
  change_reason text,
  created_at timestamptz DEFAULT now()
);

-- 6. Indexes for high performance
CREATE INDEX IF NOT EXISTS idx_customer_kyc_customer_id ON public.customer_kyc(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_kyc_status ON public.customer_kyc(status);
CREATE INDEX IF NOT EXISTS idx_customer_kyc_ref ON public.customer_kyc(reference_id);

-- 7. Row Level Security (RLS) Configuration
ALTER TABLE public.customer_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_kyc_audit ENABLE ROW LEVEL SECURITY;

-- Grant permissions to standard Supabase roles
GRANT ALL ON public.customer_kyc TO service_role;
GRANT ALL ON public.customer_kyc_audit TO service_role;
GRANT SELECT, INSERT, UPDATE ON public.customer_kyc TO authenticated;
GRANT SELECT, INSERT ON public.customer_kyc_audit TO authenticated;

-- Policies for customer_kyc
DROP POLICY IF EXISTS "customer_kyc_service_role_all" ON public.customer_kyc;
CREATE POLICY "customer_kyc_service_role_all" ON public.customer_kyc
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "customer_kyc_authenticated_access" ON public.customer_kyc;
CREATE POLICY "customer_kyc_authenticated_access" ON public.customer_kyc
  FOR SELECT TO authenticated
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager', 'pawn_officer', 'auditor')
    ) OR
    EXISTS (
      SELECT 1 FROM public.app_users u 
      WHERE u.id = auth.uid() AND u.role IN ('super_admin', 'admin', 'manager', 'pawn_officer', 'auditor')
    )
  );

-- Policies for customer_kyc_audit
DROP POLICY IF EXISTS "customer_kyc_audit_service_role_all" ON public.customer_kyc_audit;
CREATE POLICY "customer_kyc_audit_service_role_all" ON public.customer_kyc_audit
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "customer_kyc_audit_authenticated_select" ON public.customer_kyc_audit;
CREATE POLICY "customer_kyc_audit_authenticated_select" ON public.customer_kyc_audit
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p 
      WHERE p.id = auth.uid() AND p.role IN ('super_admin', 'admin', 'manager', 'pawn_officer', 'auditor')
    ) OR
    EXISTS (
      SELECT 1 FROM public.customer_kyc k 
      WHERE k.id = customer_kyc_audit.kyc_id AND k.user_id = auth.uid()
    )
  );

