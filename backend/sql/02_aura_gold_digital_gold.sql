-- ==============================================================================
-- AURA GOLD: DIGITAL GOLD MODULE SCHEMA & IMMUTABLE LEDGER
-- RCB JEWELRY'S & PAWN SHOP + AURA GOLD
-- ==============================================================================

-- 1. Digital Gold Customer Accounts
CREATE TABLE IF NOT EXISTS public.digital_gold_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  account_number text UNIQUE NOT NULL,
  gold_balance_grams numeric(14, 4) NOT NULL DEFAULT 0.0000 CHECK (gold_balance_grams >= 0),
  reserved_grams numeric(14, 4) NOT NULL DEFAULT 0.0000 CHECK (reserved_grams >= 0),
  silver_balance_grams numeric(14, 4) NOT NULL DEFAULT 0.0000 CHECK (silver_balance_grams >= 0),
  kyc_status text NOT NULL DEFAULT 'VERIFIED',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'FROZEN')),
  provider text NOT NULL DEFAULT 'SANDBOX_BRINKS_VAULT',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Digital Gold Locked Quotes (5-minute quote guarantee)
CREATE TABLE IF NOT EXISTS public.digital_gold_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_reference text UNIQUE NOT NULL,
  customer_id uuid,
  type text NOT NULL CHECK (type IN ('BUY', 'SELL')),
  metal_type text NOT NULL DEFAULT 'GOLD_24K_9999',
  provider text NOT NULL DEFAULT 'AUGMONT_SAFEGOLD_SANDBOX',
  rate_per_gram numeric(12, 2) NOT NULL CHECK (rate_per_gram > 0),
  grams numeric(14, 4) NOT NULL CHECK (grams > 0),
  metal_value numeric(12, 2) NOT NULL CHECK (metal_value > 0),
  gst_rate_percent numeric(5, 2) NOT NULL DEFAULT 3.00,
  gst_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  convenience_fee numeric(12, 2) NOT NULL DEFAULT 0.00,
  total_amount numeric(12, 2) NOT NULL CHECK (total_amount > 0),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'CONSUMED', 'EXPIRED', 'CANCELLED')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Digital Gold Transactions
CREATE TABLE IF NOT EXISTS public.digital_gold_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_reference text UNIQUE NOT NULL,
  customer_id uuid NOT NULL,
  account_id uuid REFERENCES public.digital_gold_accounts(id),
  quote_id uuid REFERENCES public.digital_gold_quotes(id),
  type text NOT NULL CHECK (type IN ('BUY', 'SELL', 'REDEEM', 'SIP_BUY', 'TRANSFER')),
  metal_type text NOT NULL DEFAULT 'GOLD_24K_9999',
  grams numeric(14, 4) NOT NULL CHECK (grams > 0),
  rate_per_gram numeric(12, 2) NOT NULL CHECK (rate_per_gram > 0),
  metal_value numeric(12, 2) NOT NULL,
  gst_amount numeric(12, 2) NOT NULL DEFAULT 0.00,
  total_amount numeric(12, 2) NOT NULL,
  payment_gateway text DEFAULT 'RAZORPAY',
  payment_order_id text,
  payment_id text,
  payment_status text NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED')),
  provider text NOT NULL DEFAULT 'AUGMONT_SAFEGOLD_SANDBOX',
  provider_tx_ref text,
  provider_status text NOT NULL DEFAULT 'PENDING' CHECK (provider_status IN ('PENDING', 'ALLOCATED', 'SETTLED', 'FAILED')),
  status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REVERSED')),
  failure_reason text,
  idempotency_key text UNIQUE,
  bank_details jsonb,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Immutable Digital Gold Ledger Entries (Double-entry audit trail)
CREATE TABLE IF NOT EXISTS public.digital_gold_ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES public.digital_gold_accounts(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.digital_gold_transactions(id),
  entry_type text NOT NULL CHECK (entry_type IN ('CREDIT_PURCHASE', 'DEBIT_SELL', 'DEBIT_REDEEM', 'REVERSAL', 'ADJUSTMENT')),
  metal_type text NOT NULL DEFAULT 'GOLD_24K_9999',
  direction text NOT NULL CHECK (direction IN ('CREDIT', 'DEBIT')),
  grams numeric(14, 4) NOT NULL CHECK (grams > 0),
  balance_before numeric(14, 4) NOT NULL,
  balance_after numeric(14, 4) NOT NULL,
  rate_per_gram numeric(12, 2) NOT NULL,
  description text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. Physical Gold Redemptions (Minted 24K 999.9 Purity Coins / Bars)
CREATE TABLE IF NOT EXISTS public.digital_gold_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  redemption_reference text UNIQUE NOT NULL,
  customer_id uuid NOT NULL,
  transaction_id uuid REFERENCES public.digital_gold_transactions(id),
  product_name text NOT NULL,
  grams numeric(14, 4) NOT NULL CHECK (grams > 0),
  purity text NOT NULL DEFAULT '24K 999.9',
  minting_charges numeric(12, 2) NOT NULL DEFAULT 0.00,
  shipping_charges numeric(12, 2) NOT NULL DEFAULT 0.00,
  total_charges numeric(12, 2) NOT NULL DEFAULT 0.00,
  delivery_name text NOT NULL,
  delivery_phone text NOT NULL,
  delivery_address text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  status text NOT NULL DEFAULT 'REQUESTED' CHECK (status IN ('REQUESTED', 'MINTING', 'DISPATCHED', 'DELIVERED', 'CANCELLED')),
  carrier_name text,
  tracking_number text,
  dispatched_at timestamptz,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. Custody Reconciliation Runs (Vault holding verification)
CREATE TABLE IF NOT EXISTS public.digital_gold_reconciliation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_reference text UNIQUE NOT NULL,
  provider text NOT NULL,
  total_internal_txns integer NOT NULL DEFAULT 0,
  total_provider_txns integer NOT NULL DEFAULT 0,
  matched_count integer NOT NULL DEFAULT 0,
  discrepancy_count integer NOT NULL DEFAULT 0,
  discrepancy_details jsonb DEFAULT '[]'::jsonb,
  total_vault_grams numeric(14, 4) NOT NULL DEFAULT 0.0000,
  total_customer_grams numeric(14, 4) NOT NULL DEFAULT 0.0000,
  difference_grams numeric(14, 4) NOT NULL DEFAULT 0.0000,
  status text NOT NULL DEFAULT 'PASSED' CHECK (status IN ('PASSED', 'DISCREPANCY_FLAGGED', 'INVESTIGATING', 'RESOLVED')),
  run_by text NOT NULL DEFAULT 'SYSTEM_AUDITOR',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. Audit Logs
CREATE TABLE IF NOT EXISTS public.digital_gold_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id text NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes for lightning fast lookups & ledger integrity
CREATE INDEX IF NOT EXISTS idx_dg_accounts_customer ON public.digital_gold_accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_dg_quotes_ref ON public.digital_gold_quotes(quote_reference);
CREATE INDEX IF NOT EXISTS idx_dg_txns_customer ON public.digital_gold_transactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_dg_txns_ref ON public.digital_gold_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_dg_txns_payment_order ON public.digital_gold_transactions(payment_order_id);
CREATE INDEX IF NOT EXISTS idx_dg_ledger_account ON public.digital_gold_ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_dg_redemptions_customer ON public.digital_gold_redemptions(customer_id);

-- Row Level Security (RLS)
ALTER TABLE public.digital_gold_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_reconciliation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_gold_audit_logs ENABLE ROW LEVEL SECURITY;

-- Drop prior policies if exist
DO $$
BEGIN
  DROP POLICY IF EXISTS "Customers can view own digital gold account" ON public.digital_gold_accounts;
  DROP POLICY IF EXISTS "Staff can view all digital gold accounts" ON public.digital_gold_accounts;
  DROP POLICY IF EXISTS "Customers can view own digital gold quotes" ON public.digital_gold_quotes;
  DROP POLICY IF EXISTS "Customers can view own digital gold transactions" ON public.digital_gold_transactions;
  DROP POLICY IF EXISTS "Staff can view all digital gold transactions" ON public.digital_gold_transactions;
  DROP POLICY IF EXISTS "Customers can view own digital gold ledger" ON public.digital_gold_ledger_entries;
  DROP POLICY IF EXISTS "Staff can view all digital gold ledger" ON public.digital_gold_ledger_entries;
  DROP POLICY IF EXISTS "Customers can view own redemptions" ON public.digital_gold_redemptions;
  DROP POLICY IF EXISTS "Staff can view all redemptions" ON public.digital_gold_redemptions;
  DROP POLICY IF EXISTS "Staff can view reconciliation runs" ON public.digital_gold_reconciliation_runs;
  DROP POLICY IF EXISTS "Staff can view audit logs" ON public.digital_gold_audit_logs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Policies for public / authenticated
CREATE POLICY "Customers can view own digital gold account"
  ON public.digital_gold_accounts FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "Staff can view all digital gold accounts"
  ON public.digital_gold_accounts FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'accountant'));

CREATE POLICY "Customers can view own digital gold quotes"
  ON public.digital_gold_quotes FOR ALL
  TO anon, authenticated
  USING (true);

CREATE POLICY "Customers can view own digital gold transactions"
  ON public.digital_gold_transactions FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'accountant'));

CREATE POLICY "Staff can view all digital gold transactions"
  ON public.digital_gold_transactions FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'accountant'));

CREATE POLICY "Customers can view own digital gold ledger"
  ON public.digital_gold_ledger_entries FOR SELECT
  TO authenticated
  USING (
    account_id IN (
      SELECT id FROM public.digital_gold_accounts WHERE customer_id = auth.uid()
    ) OR auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'accountant', 'auditor')
  );

CREATE POLICY "Staff can view all digital gold ledger"
  ON public.digital_gold_ledger_entries FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'accountant', 'auditor'));

CREATE POLICY "Customers can view own redemptions"
  ON public.digital_gold_redemptions FOR SELECT
  TO authenticated
  USING (customer_id = auth.uid() OR auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager'));

CREATE POLICY "Staff can view all redemptions"
  ON public.digital_gold_redemptions FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'manager', 'pawn_officer'));

CREATE POLICY "Staff can view reconciliation runs"
  ON public.digital_gold_reconciliation_runs FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'auditor', 'accountant'));

CREATE POLICY "Staff can view audit logs"
  ON public.digital_gold_audit_logs FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'auditor'));
