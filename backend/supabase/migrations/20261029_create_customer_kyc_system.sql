-- YAZHINI FINE JEWELS - Customer KYC Verification System
-- Migration: 20261029_create_customer_kyc_system.sql

CREATE TABLE IF NOT EXISTS public.customer_kyc (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kyc_reference text UNIQUE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
    user_id uuid,
    full_name text NOT NULL,
    date_of_birth date,
    pan_number_masked text NOT NULL,
    pan_number_hash text,
    aadhaar_number_masked text NOT NULL,
    aadhaar_number_hash text,
    id_proof_type text DEFAULT 'pan_aadhaar',
    document_url text,
    document_name text,
    consent_obtained boolean DEFAULT true,
    consent_timestamp timestamptz DEFAULT now(),
    status text NOT NULL DEFAULT 'PENDING_VERIFICATION' 
        CHECK (status IN ('NOT_SUBMITTED', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED')),
    rejection_reason text,
    action_required_notes text,
    reviewer_id text,
    reviewer_email text,
    reviewed_at timestamptz,
    verified_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.customer_kyc_audit (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kyc_id uuid REFERENCES public.customer_kyc(id) ON DELETE CASCADE,
    previous_status text,
    new_status text NOT NULL,
    action_by text NOT NULL,
    action_role text,
    notes text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_kyc_customer_id ON public.customer_kyc(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_kyc_user_id ON public.customer_kyc(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_kyc_status ON public.customer_kyc(status);
CREATE INDEX IF NOT EXISTS idx_customer_kyc_ref ON public.customer_kyc(kyc_reference);
