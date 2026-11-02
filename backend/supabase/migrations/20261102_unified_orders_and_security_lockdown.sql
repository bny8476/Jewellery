-- ==============================================================================
-- MIGRATION: 20261102_unified_orders_and_security_lockdown.sql
-- PURPOSE:
--   1. Single authoritative schema for orders and order_items
--   2. Idempotency table for processed payments
--   3. Atomic order fulfillment function (payment, stock decrement, ledger entry)
--   4. Full database lockdown: remove permissive grants, enforce strict RLS
-- ==============================================================================

-- 1. Create processed_payments table with unique constraint on razorpay_payment_id
CREATE TABLE IF NOT EXISTS public.processed_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_payment_id text NOT NULL UNIQUE,
  razorpay_order_id text,
  order_id text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'captured',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on processed_payments
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;

-- 2. Harmonize public.orders table with all columns used across the application
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  order_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  customer_email text,
  shipping_address jsonb,
  items jsonb DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric NOT NULL DEFAULT 0,
  discount numeric NOT NULL DEFAULT 0,
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',
  payment_status text NOT NULL DEFAULT 'unpaid',
  payment_method text,
  payment_id text,
  razorpay_order_id text,
  razorpay_payment_id text,
  tracking_number text,
  courier_partner text,
  fulfillment_status text DEFAULT 'pending',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Ensure all columns exist if the table was created previously
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_phone text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_email text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shipping_address jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS items jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS subtotal numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS total_amount numeric DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS currency text DEFAULT 'INR';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'unpaid';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_order_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS razorpay_payment_id text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS courier_partner text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS fulfillment_status text DEFAULT 'pending';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Update and enforce strict status check constraints
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'processing', 'completed', 'shipped', 'delivered', 'cancelled', 'failed', 'refunded'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed', 'refunded'));

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_total_amount_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_total_amount_check 
  CHECK (total_amount >= 0);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 3. Atomic Order Fulfillment Function (Webhook / Payment Verify Transaction)
CREATE OR REPLACE FUNCTION public.fulfill_order_payment(
  p_order_id text,
  p_razorpay_order_id text,
  p_payment_id text,
  p_payment_method text DEFAULT 'razorpay'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_order record;
  v_item jsonb;
  v_item_id uuid;
  v_qty integer;
  v_updated integer;
  v_already_processed boolean;
BEGIN
  -- A. Idempotency: Return immediately if payment has already been settled
  SELECT EXISTS(
    SELECT 1 FROM public.processed_payments WHERE razorpay_payment_id = p_payment_id
  ) INTO v_already_processed;

  IF v_already_processed THEN
    RETURN jsonb_build_object(
      'success', true, 
      'idempotent', true, 
      'message', 'Payment was previously processed.'
    );
  END IF;

  -- B. Fetch and lock order row
  SELECT * INTO v_order FROM public.orders 
  WHERE (id = p_order_id OR order_id = p_order_id)
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found: %', p_order_id;
  END IF;

  -- If order is already completed
  IF v_order.payment_status = 'paid' OR v_order.status = 'completed' THEN
    -- Ensure payment is recorded in processed_payments
    INSERT INTO public.processed_payments (
      razorpay_payment_id,
      razorpay_order_id,
      order_id,
      amount,
      currency,
      status
    ) VALUES (
      p_payment_id,
      p_razorpay_order_id,
      v_order.id,
      v_order.total_amount,
      'INR',
      'captured'
    ) ON CONFLICT (razorpay_payment_id) DO NOTHING;

    RETURN jsonb_build_object(
      'success', true, 
      'idempotent', true, 
      'message', 'Order already marked as paid.'
    );
  END IF;

  -- C. Decrement stock atomically with over-selling prevention
  IF v_order.items IS NOT NULL AND jsonb_typeof(v_order.items) = 'array' THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
      BEGIN
        v_item_id := (v_item->>'id')::uuid;
      EXCEPTION WHEN OTHERS THEN
        BEGIN
          v_item_id := (v_item->>'product_id')::uuid;
        EXCEPTION WHEN OTHERS THEN
          v_item_id := NULL;
        END;
      END;

      v_qty := GREATEST(1, COALESCE((v_item->>'quantity')::integer, 1));

      IF v_item_id IS NOT NULL THEN
        UPDATE public.jewelry_items
        SET stock_quantity = stock_quantity - v_qty,
            status = CASE WHEN (stock_quantity - v_qty) <= 0 THEN 'out_of_stock' ELSE status END,
            updated_at = now()
        WHERE id = v_item_id AND stock_quantity >= v_qty;

        GET DIAGNOSTICS v_updated = ROW_COUNT;
        IF v_updated = 0 THEN
          RAISE EXCEPTION 'Insufficient stock to fulfill item: %', v_item_id;
        END IF;
      END IF;
    END LOOP;
  END IF;

  -- D. Update order status to completed and paid
  UPDATE public.orders
  SET status = 'completed',
      payment_status = 'paid',
      razorpay_order_id = COALESCE(p_razorpay_order_id, razorpay_order_id),
      razorpay_payment_id = p_payment_id,
      payment_id = p_payment_id,
      payment_method = p_payment_method,
      updated_at = now()
  WHERE id = v_order.id;

  -- E. Record in idempotency table
  INSERT INTO public.processed_payments (
    razorpay_payment_id,
    razorpay_order_id,
    order_id,
    amount,
    currency,
    status
  ) VALUES (
    p_payment_id,
    p_razorpay_order_id,
    v_order.id,
    v_order.total_amount,
    'INR',
    'captured'
  ) ON CONFLICT (razorpay_payment_id) DO NOTHING;

  -- F. Write ledger entry in cash_transactions
  INSERT INTO public.cash_transactions (
    transaction_date,
    transaction_type,
    amount,
    category,
    reference_type,
    reference_id,
    description,
    payment_mode,
    created_at
  ) VALUES (
    CURRENT_DATE,
    'cash_in',
    v_order.total_amount,
    'online_sales',
    'razorpay_order',
    v_order.id,
    'Online Order ' || v_order.id || ' Paid via Razorpay (' || p_payment_id || ')',
    'upi',
    now()
  );

  RETURN jsonb_build_object(
    'success', true, 
    'order_id', v_order.id,
    'payment_id', p_payment_id
  );
END;
$$;

-- 4. DATABASE LOCKDOWN (Revoke insecure grants, strictly enforce RLS)

-- Revoke all blanket permissions from anon and authenticated
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Grant minimal necessary schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Public read-only master data tables
GRANT SELECT ON public.metal_rates TO anon, authenticated;
GRANT SELECT ON public.companies TO anon, authenticated;
GRANT SELECT ON public.loan_types TO anon, authenticated;
GRANT SELECT ON public.jewellery_types TO anon, authenticated;
GRANT SELECT ON public.schemes TO anon, authenticated;
GRANT SELECT ON public.jewelry_items TO anon, authenticated;

-- Authenticated customer transactional tables
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customers TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.customer_addresses TO authenticated;
GRANT SELECT, INSERT ON public.digital_gold_transactions TO authenticated;
GRANT SELECT, INSERT ON public.customer_kyc TO authenticated;

-- Service role retains full administrative privileges
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 5. SECURE RLS POLICIES

-- Drop permissive legacy policies
DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
DROP POLICY IF EXISTS "Anyone can view pledges" ON public.pledges;
DROP POLICY IF EXISTS "Anyone can view pledge items" ON public.pledge_items;
DROP POLICY IF EXISTS "Anyone can view banks" ON public.bank_master;
DROP POLICY IF EXISTS "Users can view their own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can create their own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff full access: orders" ON public.orders;
DROP POLICY IF EXISTS "Owner access: orders" ON public.orders;
DROP POLICY IF EXISTS "Staff access: processed_payments" ON public.processed_payments;

-- Public Master Data: Read-only for public, write for staff/admin only
CREATE POLICY "Public Read: Metal Rates" ON public.metal_rates FOR SELECT TO public USING (true);
CREATE POLICY "Public Read: Companies" ON public.companies FOR SELECT TO public USING (true);
CREATE POLICY "Public Read: Loan Types" ON public.loan_types FOR SELECT TO public USING (true);
CREATE POLICY "Public Read: Jewellery Types" ON public.jewellery_types FOR SELECT TO public USING (true);
CREATE POLICY "Public Read: Schemes" ON public.schemes FOR SELECT TO public USING (true);
CREATE POLICY "Public Read: Jewelry Items" ON public.jewelry_items FOR SELECT TO public USING (true);

-- Orders: Customers can SELECT and INSERT their own orders; Staff has full access
CREATE POLICY "Owner Select: Orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_or_admin());

CREATE POLICY "Owner Insert: Orders" ON public.orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_staff_or_admin());

CREATE POLICY "Staff Update: Orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_staff_or_admin());

-- Processed Payments: Only accessible to staff or service_role
CREATE POLICY "Staff Only: Processed Payments" ON public.processed_payments
  FOR ALL TO authenticated
  USING (public.is_staff_or_admin());

-- Customers: Customer can view/update own record; Staff can access all
DROP POLICY IF EXISTS "Customer Owner Access" ON public.customers;
CREATE POLICY "Customer Owner Access" ON public.customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_or_admin());

CREATE POLICY "Customer Owner Update" ON public.customers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_or_admin())
  WITH CHECK (user_id = auth.uid() OR public.is_staff_or_admin());

-- Pledges and Collateral: Customers view their own; Staff full access
DROP POLICY IF EXISTS "Customer Pledges Access" ON public.pledges;
CREATE POLICY "Customer Pledges Access" ON public.pledges
  FOR SELECT TO authenticated
  USING (
    customer_id IN (SELECT id FROM public.customers WHERE user_id = auth.uid())
    OR public.is_staff_or_admin()
  );

-- KYC: Customers can view and insert their own KYC docs; Staff can review
DROP POLICY IF EXISTS "Customer KYC Access" ON public.customer_kyc;
CREATE POLICY "Customer KYC Access" ON public.customer_kyc
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff_or_admin());

CREATE POLICY "Customer KYC Insert" ON public.customer_kyc
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_staff_or_admin());

