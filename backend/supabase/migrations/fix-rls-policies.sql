-- ============================================
-- FIX RLS POLICIES - RESTRICT TO AUTHENTICATED USERS
-- ============================================
-- Run this migration in Supabase SQL Editor to restrict public access
-- This replaces the "Anyone can view" policies with authenticated-only policies

-- Drop existing public policies
DO $$ 
BEGIN
  -- Metal Rates
  DROP POLICY IF EXISTS "Anyone can view metal rates" ON public.metal_rates;
  
  -- Companies
  DROP POLICY IF EXISTS "Anyone can view companies" ON public.companies;
  
  -- Loan Types
  DROP POLICY IF EXISTS "Anyone can view loan types" ON public.loan_types;
  
  -- Jewellery Types
  DROP POLICY IF EXISTS "Anyone can view jewellery types" ON public.jewellery_types;
  
  -- Schemes
  DROP POLICY IF EXISTS "Anyone can view schemes" ON public.schemes;
  
  -- Bank Master
  DROP POLICY IF EXISTS "Anyone can view banks" ON public.bank_master;
  
  -- Customers
  DROP POLICY IF EXISTS "Anyone can view customers" ON public.customers;
  
  -- Pledges
  DROP POLICY IF EXISTS "Anyone can view pledges" ON public.pledges;
  
  -- Pledge Items
  DROP POLICY IF EXISTS "Anyone can view pledge items" ON public.pledge_items;
END $$;

-- Create authenticated-only policies for SELECT
DO $$ 
BEGIN
  -- Metal Rates - Authenticated users can view
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can view metal rates') THEN
    CREATE POLICY "Authenticated users can view metal rates" 
    ON public.metal_rates FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Metal Rates - Authenticated users can insert/update (for admins)
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage metal rates') THEN
    CREATE POLICY "Authenticated users can manage metal rates" 
    ON public.metal_rates FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Companies - Authenticated users can view
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can view companies') THEN
    CREATE POLICY "Authenticated users can view companies" 
    ON public.companies FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Companies - Authenticated users can manage
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage companies') THEN
    CREATE POLICY "Authenticated users can manage companies" 
    ON public.companies FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Loan Types - Authenticated users can view
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can view loan types') THEN
    CREATE POLICY "Authenticated users can view loan types" 
    ON public.loan_types FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Loan Types - Authenticated users can manage
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage loan types') THEN
    CREATE POLICY "Authenticated users can manage loan types" 
    ON public.loan_types FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Jewellery Types - Authenticated users can view
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can view jewellery types') THEN
    CREATE POLICY "Authenticated users can view jewellery types" 
    ON public.jewellery_types FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Jewellery Types - Authenticated users can manage
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage jewellery types') THEN
    CREATE POLICY "Authenticated users can manage jewellery types" 
    ON public.jewellery_types FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Schemes - Authenticated users can view
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can view schemes') THEN
    CREATE POLICY "Authenticated users can view schemes" 
    ON public.schemes FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Schemes - Authenticated users can manage
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage schemes') THEN
    CREATE POLICY "Authenticated users can manage schemes" 
    ON public.schemes FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Bank Master - Authenticated users can view
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can view banks') THEN
    CREATE POLICY "Authenticated users can view banks" 
    ON public.bank_master FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Bank Master - Authenticated users can manage
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage banks') THEN
    CREATE POLICY "Authenticated users can manage banks" 
    ON public.bank_master FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Customers - Authenticated users can view
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can view customers') THEN
    CREATE POLICY "Authenticated users can view customers" 
    ON public.customers FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Customers - Authenticated users can manage
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage customers') THEN
    CREATE POLICY "Authenticated users can manage customers" 
    ON public.customers FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Pledges - Authenticated users can view
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can view pledges') THEN
    CREATE POLICY "Authenticated users can view pledges" 
    ON public.pledges FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Pledges - Authenticated users can manage
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage pledges') THEN
    CREATE POLICY "Authenticated users can manage pledges" 
    ON public.pledges FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Pledge Items - Authenticated users can view
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can view pledge items') THEN
    CREATE POLICY "Authenticated users can view pledge items" 
    ON public.pledge_items FOR SELECT 
    TO authenticated 
    USING (true);
  END IF;
  
  -- Pledge Items - Authenticated users can manage
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage pledge items') THEN
    CREATE POLICY "Authenticated users can manage pledge items" 
    ON public.pledge_items FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Add policies for other transaction tables
DO $$ 
BEGIN
  -- Part Payments
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage part payments') THEN
    CREATE POLICY "Authenticated users can manage part payments" 
    ON public.part_payments FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Pledge Returns
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage pledge returns') THEN
    CREATE POLICY "Authenticated users can manage pledge returns" 
    ON public.pledge_returns FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Pledge Sales
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage pledge sales') THEN
    CREATE POLICY "Authenticated users can manage pledge sales" 
    ON public.pledge_sales FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Bank Pledges
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage bank pledges') THEN
    CREATE POLICY "Authenticated users can manage bank pledges" 
    ON public.bank_pledges FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
  
  -- Cash Transactions
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Authenticated users can manage cash transactions') THEN
    CREATE POLICY "Authenticated users can manage cash transactions" 
    ON public.cash_transactions FOR ALL 
    TO authenticated 
    USING (true)
    WITH CHECK (true);
  END IF;
END $$;

-- Note: This makes all tables require authentication
-- Public users (not logged in) will not be able to access any data
-- Only authenticated users (logged in via Supabase Auth) can access the data

