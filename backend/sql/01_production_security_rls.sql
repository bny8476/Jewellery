-- ============================================================================
-- PRODUCTION SECURITY & ROW-LEVEL SECURITY (RLS) MIGRATION
-- RCB JEWELRY'S & PAWN SHOP + AURA GOLD
-- ============================================================================

-- 1. Revoke public/anonymous blanket grants previously introduced in fix-permissions.sql
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
GRANT SELECT ON public.metal_rates TO anon;
GRANT SELECT ON public.schemes TO anon;
GRANT SELECT ON public.loan_types TO anon;
GRANT SELECT ON public.jewellery_types TO anon;
GRANT SELECT ON public.companies TO anon;
GRANT SELECT ON public.jewelry_items TO anon;

-- 2. Ensure RLS is active on every single domain table
ALTER TABLE public.metal_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewellery_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_master ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancelled_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_pledge_receives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewelry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pawn_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


-- 3. Drop legacy insecure public policies
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can view pledges" ON public.pledges;
DROP POLICY IF EXISTS "Anyone can view pledge items" ON public.pledge_items;
DROP POLICY IF EXISTS "Anyone can view cash transactions" ON public.cash_transactions;

-- 4. Helper function to check if current user is an authorized staff/admin
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'role') IN ('super_admin', 'admin', 'manager', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor', 'staff', 'cashier')
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('super_admin', 'admin', 'manager', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor', 'staff', 'cashier')
    OR EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND role IN ('super_admin', 'admin', 'manager', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor', 'staff', 'cashier')
      AND is_active = true
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Strict Customer Data Isolation Policies
DROP POLICY IF EXISTS "Staff can manage all customers" ON public.customers;
CREATE POLICY "Staff can manage all customers" ON public.customers
FOR ALL TO authenticated
USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers can view own profile" ON public.customers;
CREATE POLICY "Customers can view own profile" ON public.customers
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Customers can update own profile" ON public.customers;
CREATE POLICY "Customers can update own profile" ON public.customers
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- 6. Strict Pawn Loan Policies
DROP POLICY IF EXISTS "Staff can manage all pledges" ON public.pledges;
CREATE POLICY "Staff can manage all pledges" ON public.pledges
FOR ALL TO authenticated
USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers can view own pledges" ON public.pledges;
CREATE POLICY "Customers can view own pledges" ON public.pledges
FOR SELECT TO authenticated
USING (
  customer_id IN (
    SELECT id FROM public.customers WHERE user_id = auth.uid()
  )
);

-- 7. Pledge Items
DROP POLICY IF EXISTS "Staff can manage pledge items" ON public.pledge_items;
CREATE POLICY "Staff can manage pledge items" ON public.pledge_items
FOR ALL TO authenticated
USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers can view own pledge items" ON public.pledge_items;
CREATE POLICY "Customers can view own pledge items" ON public.pledge_items
FOR SELECT TO authenticated
USING (
  pledge_id IN (
    SELECT id FROM public.pledges WHERE customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  )
);

-- 8. Financial Transactions (Part Payments, Returns, Cash Ledger)
DROP POLICY IF EXISTS "Staff can manage repayments" ON public.part_payments;
CREATE POLICY "Staff can manage repayments" ON public.part_payments
FOR ALL TO authenticated
USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers can insert repayments for own pledges" ON public.part_payments;
CREATE POLICY "Customers can insert repayments for own pledges" ON public.part_payments
FOR INSERT TO authenticated
WITH CHECK (
  pledge_id IN (
    SELECT id FROM public.pledges WHERE customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid() OR id = auth.uid()
    )
  )
  OR public.is_staff_or_admin()
);

DROP POLICY IF EXISTS "Customers can view own repayments" ON public.part_payments;
CREATE POLICY "Customers can view own repayments" ON public.part_payments
FOR SELECT TO authenticated
USING (
  pledge_id IN (
    SELECT id FROM public.pledges WHERE customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  )
);


DROP POLICY IF EXISTS "Staff can manage returns" ON public.pledge_returns;
CREATE POLICY "Staff can manage returns" ON public.pledge_returns
FOR ALL TO authenticated
USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Customers can view own returns" ON public.pledge_returns;
CREATE POLICY "Customers can view own returns" ON public.pledge_returns
FOR SELECT TO authenticated
USING (
  pledge_id IN (
    SELECT id FROM public.pledges WHERE customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  )
);

DROP POLICY IF EXISTS "Only staff can access cash ledger" ON public.cash_transactions;
CREATE POLICY "Only staff can access cash ledger" ON public.cash_transactions
FOR ALL TO authenticated
USING (public.is_staff_or_admin());

-- 9. Add Loan-to-Value (LTV) and Financial Sanity Constraints
ALTER TABLE public.pledges 
  DROP CONSTRAINT IF EXISTS chk_loan_ltv;
ALTER TABLE public.pledges 
  ADD CONSTRAINT chk_loan_ltv 
  CHECK (loan_amount <= appraised_value);

ALTER TABLE public.part_payments 
  DROP CONSTRAINT IF EXISTS chk_positive_part_payment;
ALTER TABLE public.part_payments 
  ADD CONSTRAINT chk_positive_part_payment 
  CHECK (payment_amount > 0);

ALTER TABLE public.pledge_returns 
  DROP CONSTRAINT IF EXISTS chk_positive_return_total;
ALTER TABLE public.pledge_returns 
  ADD CONSTRAINT chk_positive_return_total 
  CHECK (total_amount > 0);

ALTER TABLE public.jewelry_items ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 10. E-Commerce & Customer Self-Service Policies
DROP POLICY IF EXISTS "Public can view in-stock jewelry items" ON public.jewelry_items;
CREATE POLICY "Public can view in-stock jewelry items" ON public.jewelry_items
FOR SELECT TO anon, authenticated
USING (in_stock = true OR is_active = true);


DROP POLICY IF EXISTS "Staff can manage all jewelry items" ON public.jewelry_items;
CREATE POLICY "Staff can manage all jewelry items" ON public.jewelry_items
FOR ALL TO authenticated
USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can manage all orders" ON public.orders;
CREATE POLICY "Staff can manage all orders" ON public.orders
FOR ALL TO authenticated
USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Users can manage own pawn requests" ON public.pawn_requests;
CREATE POLICY "Users can manage own pawn requests" ON public.pawn_requests
FOR ALL TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Staff can manage all pawn requests" ON public.pawn_requests;
CREATE POLICY "Staff can manage all pawn requests" ON public.pawn_requests
FOR ALL TO authenticated
USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT TO authenticated
USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
CREATE POLICY "Staff can view all profiles" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_staff_or_admin());

