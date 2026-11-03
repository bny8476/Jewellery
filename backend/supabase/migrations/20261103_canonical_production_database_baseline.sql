-- ============================================================================
-- YAZHINI FINE JEWELS & PAWN BROKERS — CANONICAL PRODUCTION DATABASE BASELINE
-- File: 20261103_canonical_production_database_baseline.sql
-- Classification: Production Database Architecture Baseline (Phase 2 Consolidation)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. SECURITY & AUTHORIZATION HELPER FUNCTIONS
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'role') IN (
      'super_admin', 'admin', 'manager', 'sales_staff', 'inventory_staff',
      'pawn_officer', 'accountant', 'auditor', 'staff', 'cashier'
    )
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN (
      'super_admin', 'admin', 'manager', 'sales_staff', 'inventory_staff',
      'pawn_officer', 'accountant', 'auditor', 'staff', 'cashier'
    )
    OR EXISTS (
      SELECT 1 FROM public.app_users 
      WHERE email = (auth.jwt() ->> 'email') 
      AND role IN (
        'super_admin', 'admin', 'manager', 'sales_staff', 'inventory_staff',
        'pawn_officer', 'accountant', 'auditor', 'staff', 'cashier'
      )
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND role IN (
        'super_admin', 'admin', 'manager', 'sales_staff', 'inventory_staff',
        'pawn_officer', 'accountant', 'auditor', 'staff', 'cashier'
      )
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  v_role := auth.jwt() -> 'app_metadata' ->> 'role';
  IF v_role IS NOT NULL THEN
    RETURN lower(trim(v_role));
  END IF;

  SELECT role INTO v_role FROM public.profiles WHERE id = auth.uid();
  IF v_role IS NOT NULL THEN
    RETURN lower(trim(v_role));
  END IF;

  SELECT role INTO v_role FROM public.app_users WHERE email = (auth.jwt() ->> 'email') AND is_active = true LIMIT 1;
  IF v_role IS NOT NULL THEN
    RETURN lower(trim(v_role));
  END IF;

  RETURN 'customer';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ----------------------------------------------------------------------------
-- 3. IDENTITY & ACCESS DOMAIN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'customer'
    CHECK (role IN ('customer', 'super_admin', 'admin', 'manager', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor', 'staff', 'cashier')),
  address text,
  city text,
  pincode text,
  loyalty_tier text DEFAULT 'Classic'
    CHECK (loyalty_tier IN ('Classic', 'Silver', 'Gold', 'Platinum', 'Royal Patron')),
  loyalty_points integer DEFAULT 0 CHECK (loyalty_points >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL DEFAULT 'staff'
    CHECK (role IN ('super_admin', 'admin', 'manager', 'sales_staff', 'inventory_staff', 'pawn_officer', 'accountant', 'auditor', 'staff', 'cashier')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  full_name text NOT NULL,
  street text NOT NULL,
  city text NOT NULL,
  state text DEFAULT 'Tamil Nadu',
  pincode text NOT NULL CHECK (pincode ~ '^[1-9][0-9]{5}$'),
  phone text NOT NULL CHECK (phone ~ '^[6-9][0-9]{9}$'),
  label text DEFAULT 'Home' CHECK (label IN ('Home', 'Work', 'Bespoke Studio', 'Other')),
  is_default boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 4. RETAIL & CATALOGUE DOMAIN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jewelry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text UNIQUE,
  name text NOT NULL,
  description text,
  price numeric NOT NULL CHECK (price >= 0),
  category text NOT NULL,
  metal_type text NOT NULL DEFAULT 'gold' CHECK (metal_type IN ('gold', 'silver', 'platinum', 'diamond', 'gemstone')),
  purity text DEFAULT '22K',
  weight numeric NOT NULL DEFAULT 0 CHECK (weight >= 0),
  wastage_percent numeric DEFAULT 0 CHECK (wastage_percent >= 0),
  stock integer NOT NULL DEFAULT 10 CHECK (stock >= 0),
  in_stock boolean NOT NULL DEFAULT true,
  gender text DEFAULT 'unisex',
  occasion text DEFAULT 'Daily',
  collection text,
  hsn_code text DEFAULT '7113',
  image_url text,
  images jsonb DEFAULT '[]'::jsonb,
  is_featured boolean DEFAULT false,
  is_bestseller boolean DEFAULT false,
  is_new boolean DEFAULT false,
  status text DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 5. SALES, ORDERS & INVOICING DOMAIN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY,
  order_id text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  pan_number text CHECK (pan_number IS NULL OR pan_number = '' OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  shipping_address jsonb NOT NULL DEFAULT '{}'::jsonb,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  subtotal numeric NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax numeric NOT NULL DEFAULT 0 CHECK (tax >= 0),
  discount numeric NOT NULL DEFAULT 0 CHECK (discount >= 0),
  gift_card_deduction numeric NOT NULL DEFAULT 0 CHECK (gift_card_deduction >= 0),
  total_amount numeric NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  currency text NOT NULL DEFAULT 'INR',
  payment_method text DEFAULT 'razorpay',
  payment_status text NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'authorized', 'paid', 'failed', 'refunded', 'partially_refunded')),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'hallmarking_in_progress', 'armored_transit', 'out_for_delivery', 'delivered', 'completed', 'cancelled', 'failed')),
  razorpay_order_id text,
  razorpay_payment_id text,
  tracking_number text,
  courier_partner text,
  gifting_details jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.processed_payments (
  payment_id text PRIMARY KEY,
  order_id text REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'INR',
  provider text NOT NULL DEFAULT 'razorpay',
  raw_payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  order_id text REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_name text NOT NULL,
  customer_pan text,
  hsn_code text DEFAULT '7113',
  subtotal numeric NOT NULL CHECK (subtotal >= 0),
  cgst numeric NOT NULL DEFAULT 0 CHECK (cgst >= 0),
  sgst numeric NOT NULL DEFAULT 0 CHECK (sgst >= 0),
  igst numeric NOT NULL DEFAULT 0 CHECK (igst >= 0),
  total_tax numeric NOT NULL CHECK (total_tax >= 0),
  grand_total numeric NOT NULL CHECK (grand_total >= 0),
  pdf_url text,
  created_at timestamptz DEFAULT now()
);

-- Atomic Order Settlement Procedure with Stock Consistency & Double-Crediting Guard
CREATE OR REPLACE FUNCTION public.fulfill_order_payment(
  p_order_id text,
  p_razorpay_order_id text,
  p_payment_id text,
  p_payment_method text DEFAULT 'razorpay'
)
RETURNS jsonb AS $$
DECLARE
  v_order record;
  v_item jsonb;
  v_item_id uuid;
  v_qty integer;
BEGIN
  -- 1. Guard against duplicate settlement
  IF EXISTS (SELECT 1 FROM public.processed_payments WHERE payment_id = p_payment_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'message', 'Payment already processed and recorded'
    );
  END IF;

  -- 2. Lock and load target order
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order % not found', p_order_id;
  END IF;

  -- 3. Atomic stock deduction with overselling protection
  IF v_order.items IS NOT NULL AND jsonb_array_length(v_order.items) > 0 THEN
    FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items)
    LOOP
      IF (v_item ? 'id') THEN
        BEGIN
          v_item_id := (v_item ->> 'id')::uuid;
          v_qty := COALESCE((v_item ->> 'quantity')::integer, 1);
          
          UPDATE public.jewelry_items
          SET stock = GREATEST(0, stock - v_qty),
              in_stock = (stock - v_qty > 0),
              updated_at = now()
          WHERE id = v_item_id AND stock >= v_qty;
        EXCEPTION WHEN OTHERS THEN
          -- Item might be bespoke or not a direct UUID in jewelry_items
        END;
      END IF;
    END LOOP;
  END IF;

  -- 4. Record idempotent payment transaction
  INSERT INTO public.processed_payments (payment_id, order_id, amount, currency, provider)
  VALUES (p_payment_id, p_order_id, v_order.total_amount, v_order.currency, p_payment_method);

  -- 5. Update order status to paid
  UPDATE public.orders
  SET payment_status = 'paid',
      status = 'processing',
      razorpay_payment_id = p_payment_id,
      razorpay_order_id = COALESCE(p_razorpay_order_id, razorpay_order_id),
      updated_at = now()
  WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', p_order_id,
    'payment_id', p_payment_id,
    'amount', v_order.total_amount
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ----------------------------------------------------------------------------
-- 6. PAWNSHOP & LENDING DOMAIN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  email text,
  address text,
  city text,
  pincode text,
  pan_number text CHECK (pan_number IS NULL OR pan_number = '' OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$'),
  pan_number_masked text,
  aadhaar_number_masked text,
  kyc_status text NOT NULL DEFAULT 'UNVERIFIED'
    CHECK (kyc_status IN ('UNVERIFIED', 'NOT_SUBMITTED', 'PENDING', 'PENDING_VERIFICATION', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'ACTION_REQUIRED', 'EXPIRED')),
  kyc_verified_at timestamptz,
  kyc_verified_by text,
  category text DEFAULT 'retail' CHECK (category IN ('retail', 'wholesale', 'vip', 'pawn_only')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE RESTRICT NOT NULL,
  pledge_date date NOT NULL DEFAULT CURRENT_DATE,
  loan_amount numeric NOT NULL CHECK (loan_amount > 0),
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  interest_type text NOT NULL DEFAULT 'monthly' CHECK (interest_type IN ('daily', 'monthly', 'annual')),
  period_months integer NOT NULL DEFAULT 12 CHECK (period_months > 0),
  gross_weight numeric NOT NULL CHECK (gross_weight > 0),
  net_weight numeric NOT NULL CHECK (net_weight > 0 AND net_weight <= gross_weight),
  purity text DEFAULT '22K',
  market_value numeric CHECK (market_value >= loan_amount),
  ltv_percent numeric CHECK (ltv_percent > 0 AND ltv_percent <= 100),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'partially_paid', 'closed', 'renewed', 'defaulted', 'auctioned', 'sold')),
  closed_date date,
  vault_location text DEFAULT 'Main Showroom Safe #1',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges(id) ON DELETE CASCADE NOT NULL,
  item_type text NOT NULL,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  gross_weight numeric NOT NULL CHECK (gross_weight > 0),
  net_weight numeric NOT NULL CHECK (net_weight > 0),
  purity text DEFAULT '22K',
  item_condition text DEFAULT 'good',
  estimated_value numeric NOT NULL CHECK (estimated_value >= 0),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.part_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges(id) ON DELETE CASCADE NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_amount numeric NOT NULL CHECK (payment_amount > 0),
  principal_paid numeric NOT NULL DEFAULT 0 CHECK (principal_paid >= 0),
  interest_paid numeric NOT NULL DEFAULT 0 CHECK (interest_paid >= 0),
  balance_principal numeric NOT NULL CHECK (balance_principal >= 0),
  receipt_number text UNIQUE NOT NULL,
  payment_mode text NOT NULL DEFAULT 'online_gateway' CHECK (payment_mode IN ('cash', 'upi', 'bank_transfer', 'online_gateway', 'card')),
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pledge_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges(id) ON DELETE CASCADE NOT NULL,
  renewal_date date NOT NULL DEFAULT CURRENT_DATE,
  old_interest_paid numeric NOT NULL DEFAULT 0 CHECK (old_interest_paid >= 0),
  extension_months integer NOT NULL DEFAULT 6 CHECK (extension_months > 0),
  new_due_date date NOT NULL,
  authorized_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pawn_accounting_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_type text NOT NULL CHECK (entry_type IN ('disbursement', 'repayment_principal', 'repayment_interest', 'renewal_fee', 'auction_recovery')),
  pledge_id uuid REFERENCES public.pledges(id) ON DELETE SET NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  receipt_number text,
  reference_id text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 7. DIGITAL GOLD (AURA GOLD) DOMAIN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.digital_gold_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  gold_balance_grams numeric(12, 4) NOT NULL DEFAULT 0.0000 CHECK (gold_balance_grams >= 0),
  silver_balance_grams numeric(12, 4) NOT NULL DEFAULT 0.0000 CHECK (silver_balance_grams >= 0),
  vault_provider text DEFAULT 'Brinks Security Custody',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_gold_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid REFERENCES public.digital_gold_accounts(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('BUY', 'SELL', 'REDEEM', 'SIP_AUTO_INVEST')),
  metal_type text NOT NULL DEFAULT 'gold' CHECK (metal_type IN ('gold', 'silver')),
  weight_grams numeric(12, 4) NOT NULL CHECK (weight_grams > 0),
  benchmark_rate_per_gram numeric NOT NULL CHECK (benchmark_rate_per_gram > 0),
  gross_amount numeric NOT NULL CHECK (gross_amount > 0),
  gst_amount numeric NOT NULL DEFAULT 0 CHECK (gst_amount >= 0),
  total_payable numeric NOT NULL CHECK (total_payable > 0),
  payment_reference text,
  gateway_order_id text,
  status text NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_gold_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  metal_type text NOT NULL DEFAULT 'gold',
  action text NOT NULL CHECK (action IN ('buy', 'sell')),
  rate_per_gram numeric NOT NULL CHECK (rate_per_gram > 0),
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.digital_gold_sip_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_name text NOT NULL,
  frequency text NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
  installment_amount numeric NOT NULL CHECK (installment_amount >= 100),
  metal_type text NOT NULL DEFAULT 'gold' CHECK (metal_type IN ('gold', 'silver')),
  day_of_month integer DEFAULT 1 CHECK (day_of_month BETWEEN 1 AND 28),
  accumulated_grams numeric(12, 4) DEFAULT 0 CHECK (accumulated_grams >= 0),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 8. CUSTOMER KYC & COMPLIANCE DOMAIN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.customer_kyc (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_id text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  legal_name text NOT NULL,
  date_of_birth date,
  pan_masked text NOT NULL,
  pan_hash text,
  aadhaar_masked text NOT NULL,
  aadhaar_hash text,
  document_type text NOT NULL DEFAULT 'Aadhaar Card',
  document_url text,
  consent_given boolean NOT NULL DEFAULT true,
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

CREATE TABLE IF NOT EXISTS public.customer_kyc_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kyc_id uuid REFERENCES public.customer_kyc(id) ON DELETE CASCADE NOT NULL,
  customer_id uuid,
  from_status text,
  to_status text NOT NULL,
  changed_by_user_id text NOT NULL,
  changed_by_name text NOT NULL,
  change_reason text,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 9. MARKETING, GIFT CARDS & LOYALTY DOMAIN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  pin_hash text NOT NULL,
  initial_balance numeric NOT NULL CHECK (initial_balance > 0),
  current_balance numeric NOT NULL CHECK (current_balance >= 0),
  purchaser_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_name text,
  recipient_email text,
  expiry_date date NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REDEEMED', 'EXPIRED', 'BLOCKED')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id uuid REFERENCES public.gift_cards(id) ON DELETE CASCADE NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('PURCHASE', 'REDEMPTION', 'REFUND')),
  amount numeric NOT NULL CHECK (amount > 0),
  balance_after numeric NOT NULL CHECK (balance_after >= 0),
  order_reference text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.promotional_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  banner_url text,
  discount_percent numeric DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100),
  promo_code text,
  start_date timestamptz NOT NULL,
  end_date timestamptz NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 10. SYSTEM OPERATIONS & METAL RATES BENCHMARK DOMAIN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.metal_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_type text NOT NULL CHECK (metal_type IN ('gold_24k', 'gold_22k', 'gold_18k', 'silver', 'platinum')),
  rate_per_gram numeric NOT NULL CHECK (rate_per_gram > 0),
  change_24h numeric DEFAULT 0,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.daily_metal_rates_snapshot (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date UNIQUE NOT NULL DEFAULT CURRENT_DATE,
  gold_24k numeric NOT NULL CHECK (gold_24k > 0),
  gold_22k numeric NOT NULL CHECK (gold_22k > 0),
  gold_18k numeric NOT NULL CHECK (gold_18k > 0),
  silver numeric NOT NULL CHECK (silver > 0),
  source text DEFAULT 'National Bullion Benchmark (IBJA)',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id text NOT NULL,
  recipient_role text NOT NULL DEFAULT 'customer' CHECK (recipient_role IN ('customer', 'staff', 'admin')),
  event_type text NOT NULL,
  category text NOT NULL CHECK (category IN ('order', 'pawn', 'vault', 'security', 'system', 'concierge')),
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'critical')),
  title text NOT NULL,
  message text NOT NULL,
  related_entity_type text,
  related_entity_id text,
  destination_route text,
  is_read boolean NOT NULL DEFAULT false,
  idempotency_key text UNIQUE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL,
  actor_email text,
  actor_role text NOT NULL DEFAULT 'anonymous',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  previous_state jsonb,
  new_state jsonb,
  status text NOT NULL DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE', 'WARNING')),
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) ENABLEMENT ON ALL CANONICAL TABLES
-- ----------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewelry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.processed_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_renewals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pawn_accounting_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_sip_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_kyc ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_kyc_audit ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotional_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.metal_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_metal_rates_snapshot ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Public / Anonymous Grants (Strict Read-Only)
GRANT SELECT ON public.metal_rates TO anon, authenticated;
GRANT SELECT ON public.daily_metal_rates_snapshot TO anon, authenticated;
GRANT SELECT ON public.jewelry_items TO anon, authenticated;
GRANT SELECT ON public.promotional_campaigns TO anon, authenticated;

-- Customers RLS: Only authenticated users can see their own data; Staff can see all
CREATE POLICY "profiles_owner_access" ON public.profiles FOR ALL TO authenticated USING (id = auth.uid() OR public.is_staff_or_admin());
CREATE POLICY "addresses_owner_access" ON public.user_addresses FOR ALL TO authenticated USING (user_id = auth.uid() OR public.is_staff_or_admin());
CREATE POLICY "orders_owner_access" ON public.orders FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff_or_admin());
CREATE POLICY "digital_gold_acc_owner" ON public.digital_gold_accounts FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff_or_admin());
CREATE POLICY "digital_gold_tx_owner" ON public.digital_gold_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_staff_or_admin());
CREATE POLICY "notifications_owner_access" ON public.notifications FOR ALL TO authenticated USING (recipient_id = auth.uid()::text OR public.is_staff_or_admin());
CREATE POLICY "audit_logs_staff_only" ON public.audit_logs FOR SELECT TO authenticated USING (public.is_staff_or_admin());

-- ----------------------------------------------------------------------------
-- 12. STORAGE BUCKET CONFIGURATION & POLICIES
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('kyc-documents', 'kyc-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('invoices', 'invoices', false, 10485760, ARRAY['application/pdf']),
  ('jewelry-images', 'jewelry-images', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit;

