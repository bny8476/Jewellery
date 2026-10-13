-- ==============================================================================
-- SECURITY UPDATE: RLS POLICIES
-- STRICT ACCESS CONTROL FOR ADMIN AND PUBLIC MASTER DATA
-- ==============================================================================

-- 1. Enable RLS on all tables (Safety Check)
DO $$ 
DECLARE 
    t text; 
BEGIN 
    FOR t IN 
        SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' 
    LOOP 
        EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t); 
    END LOOP; 
END $$;

-- 2. Drop EXISTING Permissive Policies (Clean Slate)
-- We remove "Anyone can view..." policies to replace them with strict ones.
DROP POLICY IF EXISTS "Anyone can view metal rates" ON public.metal_rates;
DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
DROP POLICY IF EXISTS "Anyone can view loan types" ON public.loan_types;
DROP POLICY IF EXISTS "Anyone can view jewellery types" ON public.jewellery_types;
DROP POLICY IF EXISTS "Anyone can view schemes" ON public.schemes;
DROP POLICY IF EXISTS "Anyone can view banks" ON public.bank_master;
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can view pledges" ON public.pledges;
DROP POLICY IF EXISTS "Anyone can view pledge items" ON public.pledge_items;

-- 3. DEFINE NEW POLICIES

-- VARIABLE: Admin Email
-- We use the specific admin email to grant full access. 
-- Adjust this string if the admin email changes.

-- POLICY GROUP 1: PUBLIC READ-ONLY (Master Data)
-- Allow anyone to see rates, company info, and types.
CREATE POLICY "Public Read: Metal Rates" ON public.metal_rates FOR SELECT TO public USING (true);
CREATE POLICY "Public Read: Companies" ON public.companies FOR SELECT TO public USING (true);
CREATE POLICY "Public Read: Loan Types" ON public.loan_types FOR SELECT TO public USING (true);
CREATE POLICY "Public Read: Jewellery Types" ON public.jewellery_types FOR SELECT TO public USING (true);
CREATE POLICY "Public Read: Schemes" ON public.schemes FOR SELECT TO public USING (true);

-- POLICY GROUP 2: ADMIN FULL ACCESS (All Tables)
-- Grant ALL privileges to the specific admin user.

-- Helper function to check if user is admin or authorized staff
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS boolean AS $$
BEGIN
  RETURN public.is_staff_or_admin();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- Apply Admin Policies
CREATE POLICY "Admin Full Access: Metal Rates" ON public.metal_rates FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Companies" ON public.companies FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Loan Types" ON public.loan_types FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Jewellery Types" ON public.jewellery_types FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Schemes" ON public.schemes FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Bank Master" ON public.bank_master FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: App Users" ON public.app_users FOR ALL USING (is_admin());

-- SENSITIVE DATA: Only Admin can access
CREATE POLICY "Admin Full Access: Customers" ON public.customers FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Customer Docs" ON public.customer_documents FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Pledges" ON public.pledges FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Pledge Items" ON public.pledge_items FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Additional Pledges" ON public.additional_pledges FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Part Payments" ON public.part_payments FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Pledge Returns" ON public.pledge_returns FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Pledge Sales" ON public.pledge_sales FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Cancelled Txns" ON public.cancelled_transactions FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Bank Pledges" ON public.bank_pledges FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Bank Receives" ON public.bank_pledge_receives FOR ALL USING (is_admin());
CREATE POLICY "Admin Full Access: Cash Txns" ON public.cash_transactions FOR ALL USING (is_admin());

-- 4. Verify Policy (Optional - for debugging)
-- SELECT * FROM pg_policies;
