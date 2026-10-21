-- ==============================================================================
-- AURA GOLD SIP (SYSTEMATIC INVESTMENT PLAN) & REDEMPTION FULFILLMENT MIGRATION
-- ==============================================================================

-- 1. Digital Gold SIP Plans
CREATE TABLE IF NOT EXISTS public.digital_gold_sip_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  account_id uuid REFERENCES public.digital_gold_accounts(id),
  plan_reference text UNIQUE NOT NULL,
  metal_type text NOT NULL DEFAULT 'GOLD_24K_9999',
  frequency text NOT NULL CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  amount_inr numeric(12, 2) NOT NULL CHECK (amount_inr >= 10.00),
  day_of_month integer CHECK (day_of_month BETWEEN 1 AND 31),
  day_of_week integer CHECK (day_of_week BETWEEN 0 AND 6),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  next_execution_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_method text NOT NULL DEFAULT 'UPI_AUTOPAY',
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED', 'COMPLETED')),
  total_invested_inr numeric(14, 2) NOT NULL DEFAULT 0.00,
  total_grams_accumulated numeric(14, 4) NOT NULL DEFAULT 0.0000,
  successful_executions integer NOT NULL DEFAULT 0,
  failed_executions integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Digital Gold SIP Execution Records
CREATE TABLE IF NOT EXISTS public.digital_gold_sip_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES public.digital_gold_sip_plans(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.digital_gold_transactions(id),
  scheduled_date date NOT NULL,
  executed_at timestamptz NOT NULL DEFAULT now(),
  amount_inr numeric(12, 2) NOT NULL,
  grams numeric(14, 4) NOT NULL,
  rate_per_gram numeric(12, 2) NOT NULL,
  status text NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'SKIPPED')),
  error_message text
);

-- 3. Enhance Redemptions with Payment & Tracking Details if missing
ALTER TABLE public.digital_gold_redemptions 
  ADD COLUMN IF NOT EXISTS payment_order_id text,
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'SUCCESS',
  ADD COLUMN IF NOT EXISTS estimated_delivery_date date;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dg_sip_plans_customer ON public.digital_gold_sip_plans(customer_id);
CREATE INDEX IF NOT EXISTS idx_dg_sip_plans_status ON public.digital_gold_sip_plans(status);
CREATE INDEX IF NOT EXISTS idx_dg_sip_executions_plan ON public.digital_gold_sip_executions(plan_id);
