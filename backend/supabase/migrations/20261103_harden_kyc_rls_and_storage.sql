-- YAZHINI FINE JEWELS — Production Readiness Security Hardening
-- Migration: 20261103_harden_kyc_rls_and_storage.sql
-- Addresses Audit Findings: 4.2 (KYC Row Level Security & Document Access), 4.3 (RBAC), and 4.5

-- 1. Explicitly enable Row Level Security on all KYC tables
ALTER TABLE IF EXISTS public.customer_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_kyc_audit ENABLE ROW LEVEL SECURITY;

-- 2. Clean existing KYC table policies
DROP POLICY IF EXISTS "Customer KYC Access" ON public.customer_kyc;
DROP POLICY IF EXISTS "Customer KYC Insert" ON public.customer_kyc;
DROP POLICY IF EXISTS "customer_kyc_select_policy" ON public.customer_kyc;
DROP POLICY IF EXISTS "customer_kyc_insert_policy" ON public.customer_kyc;
DROP POLICY IF EXISTS "customer_kyc_update_policy" ON public.customer_kyc;
DROP POLICY IF EXISTS "customer_kyc_delete_policy" ON public.customer_kyc;

-- 3. Strict Customer KYC Granular Ownership Policies
-- SELECT: Customers can ONLY see their own records; Authorized staff can see all
CREATE POLICY "customer_kyc_select_policy" ON public.customer_kyc
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() 
    OR customer_id = auth.uid() 
    OR public.is_staff_or_admin()
  );

-- INSERT: Authenticated customers can insert their own KYC record
CREATE POLICY "customer_kyc_insert_policy" ON public.customer_kyc
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid() 
    OR customer_id = auth.uid() 
    OR public.is_staff_or_admin()
  );

-- UPDATE: Customers can update ONLY in non-finalized states; Staff can verify/review
CREATE POLICY "customer_kyc_update_policy" ON public.customer_kyc
  FOR UPDATE TO authenticated
  USING (
    (user_id = auth.uid() AND status IN ('NOT_SUBMITTED', 'ACTION_REQUIRED', 'REJECTED'))
    OR public.is_staff_or_admin()
  )
  WITH CHECK (
    (user_id = auth.uid() AND status IN ('NOT_SUBMITTED', 'ACTION_REQUIRED', 'PENDING_VERIFICATION'))
    OR public.is_staff_or_admin()
  );

-- DELETE: Strictly disallowed for patrons; Staff only
CREATE POLICY "customer_kyc_delete_policy" ON public.customer_kyc
  FOR DELETE TO authenticated
  USING (public.is_staff_or_admin());

-- 4. Customer KYC Audit Trail Policies
DROP POLICY IF EXISTS "customer_kyc_audit_select_policy" ON public.customer_kyc_audit;
DROP POLICY IF EXISTS "customer_kyc_audit_insert_policy" ON public.customer_kyc_audit;

CREATE POLICY "customer_kyc_audit_select_policy" ON public.customer_kyc_audit
  FOR SELECT TO authenticated
  USING (
    kyc_id IN (
      SELECT id FROM public.customer_kyc 
      WHERE user_id = auth.uid() OR customer_id = auth.uid()
    )
    OR public.is_staff_or_admin()
  );

CREATE POLICY "customer_kyc_audit_insert_policy" ON public.customer_kyc_audit
  FOR INSERT TO authenticated
  WITH CHECK (public.is_staff_or_admin());

-- 5. Private Storage Bucket Setup for Identity Documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'kyc-documents',
  'kyc-documents',
  false,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760;

-- Storage RLS: Ensure only authenticated owners can upload to their prefix, and only owners + staff can read
DROP POLICY IF EXISTS "KYC Document Owner Upload" ON storage.objects;
CREATE POLICY "KYC Document Owner Upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (
      name LIKE auth.uid() || '/%' 
      OR name LIKE 'kyc/' || auth.uid() || '/%' 
      OR public.is_staff_or_admin()
    )
  );

DROP POLICY IF EXISTS "KYC Document Authorized Read" ON storage.objects;
CREATE POLICY "KYC Document Authorized Read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (
      name LIKE auth.uid() || '/%' 
      OR name LIKE 'kyc/' || auth.uid() || '/%' 
      OR public.is_staff_or_admin()
    )
  );
