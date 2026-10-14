-- ==============================================================================
-- MIGRATION: 20261010_secure_rls_and_storage.sql
-- PURPOSE: Restores Row Level Security, configures private KYC document storage,
--          and establishes strict Role-Based Access Control (RBAC).
-- ==============================================================================

-- 1. REVOKE EXCESSIVE PRIVILEGES FROM PUBLIC / ANON ROLES
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Grant minimal necessary read-only access on public catalogs
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT ON public.metal_rates TO anon, authenticated;
GRANT SELECT ON public.jewellery_types TO anon, authenticated;
GRANT SELECT ON public.schemes TO anon, authenticated;
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT SELECT ON public.loan_types TO anon, authenticated;
GRANT SELECT ON public.jewelry_items TO anon, authenticated;

-- Allow authenticated users to interact with appropriate endpoints
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 2. RE-ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
ALTER TABLE IF EXISTS public.metal_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.loan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jewellery_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.additional_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.part_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pledge_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pledge_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cancelled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.bank_pledge_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.jewelry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.pawn_requests ENABLE ROW LEVEL SECURITY;

-- 3. DROP INSECURE POLICIES
DO $$
BEGIN
  -- Drop overly permissive public policies
  DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
  DROP POLICY IF EXISTS "Anyone can view pledges" ON public.pledges;
  DROP POLICY IF EXISTS "Anyone can view pledge items" ON public.pledge_items;
  DROP POLICY IF EXISTS "Anyone can view banks" ON public.bank_master;
  DROP POLICY IF EXISTS "Anyone can view metal rates" ON public.metal_rates;
  DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
  DROP POLICY IF EXISTS "Anyone can view loan types" ON public.loan_types;
  DROP POLICY IF EXISTS "Anyone can view jewellery types" ON public.jewellery_types;
  DROP POLICY IF EXISTS "Anyone can view schemes" ON public.schemes;

  -- Storage policy cleanups
  DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
  DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
  DROP POLICY IF EXISTS "Public Update Access" ON storage.objects;
  DROP POLICY IF EXISTS "Public Delete Access" ON storage.objects;
END $$;

-- 4. HELPER FUNCTION: Check if the authenticated user has staff or admin role
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'manager', 'staff')
  ) OR (
    auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. PUBLIC & STOREFRONT CATALOG POLICIES
-- Anyone can view products and live metal rates
CREATE POLICY "Public can view metal rates" ON public.metal_rates FOR SELECT USING (true);
CREATE POLICY "Staff can manage metal rates" ON public.metal_rates FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "Public can view active companies" ON public.companies FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage companies" ON public.companies FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "Public can view schemes" ON public.schemes FOR SELECT USING (is_active = true);
CREATE POLICY "Staff can manage schemes" ON public.schemes FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

CREATE POLICY "Public can view loan types" ON public.loan_types FOR SELECT USING (is_active = true);
CREATE POLICY "Public can view jewellery types" ON public.jewellery_types FOR SELECT USING (is_active = true);

-- Jewelry items catalog
CREATE POLICY "Public can view jewelry items" ON public.jewelry_items FOR SELECT USING (true);
CREATE POLICY "Staff can manage jewelry items" ON public.jewelry_items FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

-- 6. PAWNSHOP ERP CONFIDENTIAL POLICIES (STAFF & ADMIN ONLY)
CREATE POLICY "Staff can manage bank master" ON public.bank_master FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage customers" ON public.customers FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage customer documents" ON public.customer_documents FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage pledges" ON public.pledges FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage pledge items" ON public.pledge_items FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage additional pledges" ON public.additional_pledges FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage part payments" ON public.part_payments FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage pledge returns" ON public.pledge_returns FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage pledge sales" ON public.pledge_sales FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage cancelled transactions" ON public.cancelled_transactions FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage bank pledges" ON public.bank_pledges FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage bank pledge receives" ON public.bank_pledge_receives FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());
CREATE POLICY "Staff can manage cash transactions" ON public.cash_transactions FOR ALL TO authenticated USING (public.is_staff_or_admin()) WITH CHECK (public.is_staff_or_admin());

-- 7. CUSTOMER PORTAL & ORDER POLICIES (STRICT USER ISOLATION)
-- Customers can view only their own orders
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff_or_admin());
CREATE POLICY "Users can insert own orders" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.is_staff_or_admin());

CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND (orders.user_id = auth.uid() OR public.is_staff_or_admin()))
);
CREATE POLICY "Users can insert own order items" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

-- Online pawn requests
CREATE POLICY "Users can view own pawn requests" ON public.pawn_requests FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_staff_or_admin());
CREATE POLICY "Users can create own pawn requests" ON public.pawn_requests FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can update pawn requests" ON public.pawn_requests FOR UPDATE TO authenticated USING (public.is_staff_or_admin());

-- 8. SECURE STORAGE BUCKET CONFIGURATION (KYC DOCUMENTS)
-- Ensure 'documents' bucket is PRIVATE
UPDATE storage.buckets SET public = false WHERE id = 'documents';

-- Authenticated staff can view and upload documents
CREATE POLICY "Staff can read KYC documents" ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'documents' AND public.is_staff_or_admin()
);
CREATE POLICY "Staff can upload KYC documents" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'documents' AND public.is_staff_or_admin()
);
CREATE POLICY "Staff can delete KYC documents" ON storage.objects FOR DELETE TO authenticated USING (
  bucket_id = 'documents' AND public.is_staff_or_admin()
);
