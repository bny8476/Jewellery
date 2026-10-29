-- ==============================================================================
-- YAZHINI FINE JEWELS — Comprehensive Pawn Shop & Collateral Lending Upgrade
-- Migration: 06_pawn_shop_upgrade.sql
-- ==============================================================================

-- 1. Enhance Main Pledges Table
ALTER TABLE public.pledges
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS grace_period_days integer DEFAULT 7,
  ADD COLUMN IF NOT EXISTS disbursement_method text DEFAULT 'cash',
  ADD COLUMN IF NOT EXISTS disbursement_reference text,
  ADD COLUMN IF NOT EXISTS maker_staff_name text,
  ADD COLUMN IF NOT EXISTS checker_staff_name text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_status_at_creation text DEFAULT 'verified',
  ADD COLUMN IF NOT EXISTS renewal_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vault_locker_no text DEFAULT 'Vault A - Locker 01',
  ADD COLUMN IF NOT EXISTS accrued_interest numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_principal_paid numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_interest_paid numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_date date,
  ADD COLUMN IF NOT EXISTS collateral_released boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS collateral_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS collateral_released_by text,
  ADD COLUMN IF NOT EXISTS market_rate_at_pledge numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ltv_ratio_percentage numeric DEFAULT 75;

-- 2. Enhance Pledge Items Table
ALTER TABLE public.pledge_items
  ADD COLUMN IF NOT EXISTS item_category text DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS stone_weight_grams numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS huid_code text,
  ADD COLUMN IF NOT EXISTS hallmark_certified boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS condition_grade text DEFAULT 'good',
  ADD COLUMN IF NOT EXISTS vault_tag text,
  ADD COLUMN IF NOT EXISTS custody_status text DEFAULT 'in_vault',
  ADD COLUMN IF NOT EXISTS released_at timestamptz,
  ADD COLUMN IF NOT EXISTS released_by text,
  ADD COLUMN IF NOT EXISTS valuation_deductions numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS eligible_metal_weight numeric;

-- 3. Pledge Renewals Table (Loan Extension & Term Restructuring)
CREATE TABLE IF NOT EXISTS public.pledge_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges ON DELETE CASCADE NOT NULL,
  renewal_date date NOT NULL DEFAULT CURRENT_DATE,
  previous_due_date date NOT NULL,
  new_due_date date NOT NULL,
  interest_rate numeric NOT NULL,
  interest_cleared numeric DEFAULT 0,
  principal_repaid numeric DEFAULT 0,
  renewal_fee numeric DEFAULT 0,
  notes text,
  approved_by text,
  created_at timestamptz DEFAULT now()
);

-- 4. Double-Entry Accounting Ledger for Pawn Shop
CREATE TABLE IF NOT EXISTS public.pawn_accounting_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges ON DELETE CASCADE NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('disbursement', 'interest_collection', 'principal_repayment', 'renewal_fee', 'redemption', 'reversal')),
  debit_account text NOT NULL,
  credit_account text NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0),
  payment_mode text DEFAULT 'cash',
  reference_no text,
  narration text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- 5. Collateral Vault Custody & Transfer Audit Log
CREATE TABLE IF NOT EXISTS public.collateral_vault_custody_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges ON DELETE CASCADE NOT NULL,
  pledge_item_id uuid REFERENCES public.pledge_items ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('intake', 'transfer', 'audit_check', 'release', 'auction')),
  from_location text,
  to_location text,
  handled_by text NOT NULL,
  verified_by text,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 6. Indexes for Performance & Scalability
CREATE INDEX IF NOT EXISTS idx_pledges_status ON public.pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_customer_id ON public.pledges(customer_id);
CREATE INDEX IF NOT EXISTS idx_pledges_pledge_date ON public.pledges(pledge_date);
CREATE INDEX IF NOT EXISTS idx_pledges_due_date ON public.pledges(due_date);
CREATE INDEX IF NOT EXISTS idx_pledge_items_pledge_id ON public.pledge_items(pledge_id);
CREATE INDEX IF NOT EXISTS idx_pawn_accounting_pledge_id ON public.pawn_accounting_ledger(pledge_id);
CREATE INDEX IF NOT EXISTS idx_vault_custody_pledge_id ON public.collateral_vault_custody_log(pledge_id);
