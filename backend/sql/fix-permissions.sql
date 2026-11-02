-- 1. Grant usage on the public schema to Supabase roles
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- 2. Grant all privileges on all tables and sequences to the anon and authenticated roles
-- GRANT ALL revoked for security hardening (see 20261102_unified_orders_and_security_lockdown.sql)
-- GRANT ALL revoked for security hardening
-- GRANT ALL revoked for security hardening

-- 3. For development purposes, disable Row Level Security (RLS) on all tables 
-- to prevent 403 Forbidden errors when the app tries to insert or update data.
ALTER TABLE public.metal_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.loan_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.jewellery_types DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_master DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_pledges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.part_payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_returns DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pledge_sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancelled_transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_pledges DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_pledge_receives DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cash_transactions DISABLE ROW LEVEL SECURITY;
