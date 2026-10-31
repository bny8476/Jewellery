-- ==============================================================================
-- YAZHINI FINE JEWELS - KYC Schema Migration
-- Migration: 20261031_add_kyc_status_to_customers.sql
-- Description: Adds missing kyc_status, user_id and verification audit fields to
--              public.customers, backfills safe defaults ('UNVERIFIED'), syncs
--              existing records from customer_kyc, and adds validation constraints.
-- ==============================================================================

-- 1. Ensure public.customers has kyc_status and related KYC audit fields
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS kyc_status text DEFAULT 'UNVERIFIED',
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'retail',
  ADD COLUMN IF NOT EXISTS pan_number text,
  ADD COLUMN IF NOT EXISTS aadhaar_number text,
  ADD COLUMN IF NOT EXISTS pan_number_masked text,
  ADD COLUMN IF NOT EXISTS aadhaar_number_masked text,
  ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_verified_by text,
  ADD COLUMN IF NOT EXISTS kyc_rejection_reason text;

-- 2. Backfill existing customer records with safe default 'UNVERIFIED'
UPDATE public.customers
SET kyc_status = 'UNVERIFIED'
WHERE kyc_status IS NULL;

-- 3. Synchronize KYC status from customer_kyc table for existing customers
-- Map granular statuses to standard workflow:
-- 'VERIFIED' -> 'VERIFIED'
-- 'REJECTED' -> 'REJECTED'
-- 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'ACTION_REQUIRED' -> 'PENDING'
-- 'NOT_SUBMITTED' -> 'UNVERIFIED'
UPDATE public.customers c
SET 
  kyc_status = CASE 
    WHEN UPPER(k.status) = 'VERIFIED' THEN 'VERIFIED'
    WHEN UPPER(k.status) = 'REJECTED' THEN 'REJECTED'
    WHEN UPPER(k.status) IN ('PENDING_VERIFICATION', 'UNDER_REVIEW', 'ACTION_REQUIRED', 'PENDING') THEN 'PENDING'
    ELSE 'UNVERIFIED'
  END,
  kyc_verified_at = k.verified_at,
  kyc_verified_by = COALESCE(k.reviewer_name, k.reviewer_email, k.reviewer_id),
  kyc_rejection_reason = k.rejection_reason,
  pan_number_masked = COALESCE(c.pan_number_masked, k.pan_masked, k.pan_number_masked),
  aadhaar_number_masked = COALESCE(c.aadhaar_number_masked, k.aadhaar_masked, k.aadhaar_number_masked)
FROM (
  SELECT DISTINCT ON (customer_id) 
    customer_id, status, verified_at, reviewer_name, reviewer_email, reviewer_id, 
    rejection_reason, pan_masked, pan_number_masked, aadhaar_masked, aadhaar_number_masked
  FROM public.customer_kyc
  WHERE customer_id IS NOT NULL
  ORDER BY customer_id, updated_at DESC, created_at DESC
) k
WHERE c.id = k.customer_id;

-- 4. Apply NOT NULL constraint and default value for kyc_status
ALTER TABLE public.customers 
  ALTER COLUMN kyc_status SET DEFAULT 'UNVERIFIED',
  ALTER COLUMN kyc_status SET NOT NULL;

-- 5. Add or replace check constraint for kyc_status on public.customers
ALTER TABLE public.customers 
  DROP CONSTRAINT IF EXISTS customers_kyc_status_check;

ALTER TABLE public.customers 
  ADD CONSTRAINT customers_kyc_status_check 
  CHECK (UPPER(kyc_status) IN (
    'UNVERIFIED', 
    'NOT_SUBMITTED', 
    'PENDING', 
    'PENDING_VERIFICATION', 
    'UNDER_REVIEW', 
    'VERIFIED', 
    'REJECTED', 
    'ACTION_REQUIRED', 
    'EXPIRED'
  ));

-- 6. Update customer_kyc status check constraint to support complete canonical workflow
ALTER TABLE public.customer_kyc 
  DROP CONSTRAINT IF EXISTS customer_kyc_status_check;

ALTER TABLE public.customer_kyc 
  ADD CONSTRAINT customer_kyc_status_check 
  CHECK (UPPER(status) IN (
    'UNVERIFIED', 
    'NOT_SUBMITTED', 
    'PENDING', 
    'PENDING_VERIFICATION', 
    'UNDER_REVIEW', 
    'VERIFIED', 
    'REJECTED', 
    'ACTION_REQUIRED', 
    'EXPIRED'
  ));

-- 7. Create indexes for fast lookup and filtering
CREATE INDEX IF NOT EXISTS idx_customers_kyc_status ON public.customers(kyc_status);
CREATE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- 8. Add comment on columns
COMMENT ON COLUMN public.customers.kyc_status IS 'Current customer identity verification status: UNVERIFIED, PENDING, VERIFIED, REJECTED';
COMMENT ON COLUMN public.customers.user_id IS 'Associated Supabase auth / app user UUID';
