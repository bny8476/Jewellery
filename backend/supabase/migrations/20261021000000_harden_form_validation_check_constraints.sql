-- ==============================================================================
-- MIGRATION: 20261021000000_harden_form_validation_check_constraints.sql
-- PURPOSE: Harden database integrity with PostgreSQL CHECK and UNIQUE constraints
--   mirroring frontend and backend business rules and Indian statutory limits:
--   1. Income Tax Sec 269ST cash ceiling (< ₹2,00,000)
--   2. Indian phone (10-digit) and PAN regex constraints on customers
--   3. Purchase weights (0 < net <= gross) and payment bounds (0 <= paid <= total)
--   4. Bank pledge interest rate bounds (0 - 100%) and receipt amounts
--   5. Diamond certification uniqueness per laboratory and carat bounds
-- ==============================================================================

-- 1. CUSTOMERS TABLE INTEGRITY
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'customers') THEN
    -- Ensure phone is a valid 10-digit Indian mobile number
    ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS chk_customers_phone;
    ALTER TABLE public.customers ADD CONSTRAINT chk_customers_phone 
      CHECK (phone ~ '^[6-9][0-9]{9}$');

    -- Ensure PAN adheres to official 10-char format if supplied
    ALTER TABLE public.customers DROP CONSTRAINT IF EXISTS chk_customers_pan;
    ALTER TABLE public.customers ADD CONSTRAINT chk_customers_pan 
      CHECK (pan_number IS NULL OR pan_number = '' OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$');
  END IF;
END $$;

-- 2. PURCHASES TABLE INTEGRITY (Weight and Amount Checks)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchases') THEN
    ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS chk_purchases_weights;
    ALTER TABLE public.purchases ADD CONSTRAINT chk_purchases_weights 
      CHECK (gross_weight > 0 AND net_weight > 0 AND net_weight <= gross_weight);

    ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS chk_purchases_amounts;
    ALTER TABLE public.purchases ADD CONSTRAINT chk_purchases_amounts 
      CHECK (rate_per_gram > 0 AND paid_amount >= 0 AND paid_amount <= total_amount);
  END IF;
END $$;

-- 3. POINT OF SALE (POS_SALES) INTEGRITY (Income Tax Sec 269ST)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'pos_sales') THEN
    ALTER TABLE public.pos_sales DROP CONSTRAINT IF EXISTS chk_sales_cash_269st;
    ALTER TABLE public.pos_sales ADD CONSTRAINT chk_sales_cash_269st 
      CHECK (lower(payment_method) != 'cash' OR final_amount < 200000);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales') THEN
    ALTER TABLE public.sales DROP CONSTRAINT IF EXISTS chk_sales_cash_269st;
    ALTER TABLE public.sales ADD CONSTRAINT chk_sales_cash_269st 
      CHECK (lower(payment_method) != 'cash' OR final_amount < 200000);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') THEN
    ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS chk_orders_cash_269st;
    -- Note: orders uses total_amount; check cash payment under 200,000 if payment method is recorded
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'payment_method') THEN
      ALTER TABLE public.orders ADD CONSTRAINT chk_orders_cash_269st 
        CHECK (lower(payment_method) != 'cash' OR total_amount < 200000);
    END IF;
  END IF;
END $$;

-- 4. BANK PLEDGES & RECEIVES INTEGRITY
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bank_pledges') THEN
    ALTER TABLE public.bank_pledges DROP CONSTRAINT IF EXISTS chk_bank_pledges_rate;
    ALTER TABLE public.bank_pledges ADD CONSTRAINT chk_bank_pledges_rate 
      CHECK (bank_interest_rate >= 0 AND bank_interest_rate <= 100);

    ALTER TABLE public.bank_pledges DROP CONSTRAINT IF EXISTS chk_bank_pledges_amounts;
    ALTER TABLE public.bank_pledges ADD CONSTRAINT chk_bank_pledges_amounts 
      CHECK (bank_loan_amount > 0 AND (net_weight IS NULL OR gross_weight IS NULL OR net_weight <= gross_weight));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'bank_pledge_receives') THEN
    ALTER TABLE public.bank_pledge_receives DROP CONSTRAINT IF EXISTS chk_bank_receive_amount;
    ALTER TABLE public.bank_pledge_receives ADD CONSTRAINT chk_bank_receive_amount 
      CHECK (amount_paid > 0 AND interest_paid >= 0);
  END IF;
END $$;

-- 5. CERTIFIED DIAMONDS & GEMSTONES REGISTER
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'certified_diamonds') THEN
    ALTER TABLE public.certified_diamonds DROP CONSTRAINT IF EXISTS uq_certified_diamonds_lab_cert;
    ALTER TABLE public.certified_diamonds ADD CONSTRAINT uq_certified_diamonds_lab_cert 
      UNIQUE (cert_lab, cert_number);

    ALTER TABLE public.certified_diamonds DROP CONSTRAINT IF EXISTS chk_certified_diamonds_carat;
    ALTER TABLE public.certified_diamonds ADD CONSTRAINT chk_certified_diamonds_carat 
      CHECK (carat >= 0.01 AND carat <= 50.0);
  END IF;
END $$;
