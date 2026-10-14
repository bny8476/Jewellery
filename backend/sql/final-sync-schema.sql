-- 1. App Users (Staff) Table missing columns
ALTER TABLE public.app_users
ADD COLUMN IF NOT EXISTS designation text,
ADD COLUMN IF NOT EXISTS qualification text,
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS gender text CHECK (gender IN ('male', 'female', 'other')),
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS id_proof_type text,
ADD COLUMN IF NOT EXISTS id_proof_number text,
ADD COLUMN IF NOT EXISTS bank_name text,
ADD COLUMN IF NOT EXISTS account_number text,
ADD COLUMN IF NOT EXISTS ifsc_code text,
ADD COLUMN IF NOT EXISTS photo_url text,
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false;

-- 2. Customers Table missing columns
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS is_blocked boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS block_reason text;

-- 3. Pledge Items missing columns
ALTER TABLE public.pledge_items
ADD COLUMN IF NOT EXISTS purity_test_value text;

-- 4. Orders and Order Items Tables (For Ecommerce)
CREATE TABLE IF NOT EXISTS public.orders (
  id text PRIMARY KEY, -- Using text for ORD-XXXX format
  user_id uuid REFERENCES public.profiles ON DELETE CASCADE,
  total_amount numeric NOT NULL CHECK (total_amount >= 0),
  status text NOT NULL CHECK (status IN ('processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'processing',
  shipping_address jsonb NOT NULL,
  payment_intent_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id text REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  product_name text NOT NULL,
  price numeric NOT NULL,
  weight numeric,
  unit text,
  image_url text,
  quantity integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

-- Grant privileges for new tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- Disable RLS on new tables to prevent 403s in dev mode
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- 5. Insert Sample Data

-- Sample App User (Staff/Manager)
INSERT INTO public.app_users (username, password_hash, full_name, role, email, phone, designation)
VALUES ('manager1', '$2a$10$rKvVPZqGvqKvJVJvJvJvJeN9N9N9N9N9N9N9N9N9N9N9N9N9N9N9N', 'John Manager', 'manager', 'manager@pawnshop.com', '9876543211', 'Branch Manager')
ON CONFLICT (username) DO NOTHING;

-- Sample Customer
INSERT INTO public.customers (customer_code, full_name, phone, address, city, state, is_active)
VALUES ('CUST000001', 'Rahul Sharma', '9000000001', '45 Park Street', 'Chennai', 'Tamil Nadu', true)
ON CONFLICT (customer_code) DO NOTHING;

-- Anonymous PL/pgSQL block to dynamically look up IDs and insert a sample pledge
DO $$
DECLARE 
  v_cust_id uuid;
  v_company_id uuid;
  v_loan_type_id uuid;
  v_scheme_id uuid;
  v_jewellery_type_id uuid;
  v_pledge_id uuid;
BEGIN
  -- Grab first available IDs from lookup tables
  SELECT id INTO v_cust_id FROM public.customers LIMIT 1;
  SELECT id INTO v_company_id FROM public.companies LIMIT 1;
  SELECT id INTO v_loan_type_id FROM public.loan_types LIMIT 1;
  SELECT id INTO v_scheme_id FROM public.schemes LIMIT 1;
  SELECT id INTO v_jewellery_type_id FROM public.jewellery_types LIMIT 1;
  
  -- Insert Pledge if we successfully found a customer
  IF v_cust_id IS NOT NULL THEN
      INSERT INTO public.pledges (pledge_number, customer_id, company_id, loan_type_id, scheme_id, total_weight_grams, total_items, appraised_value, loan_amount, interest_rate, interest_type, document_charges)
      VALUES ('PLG000001', v_cust_id, v_company_id, v_loan_type_id, v_scheme_id, 45.5, 1, 350000, 250000, 2.0, 'monthly', 500)
      ON CONFLICT (pledge_number) DO NOTHING
      RETURNING id INTO v_pledge_id;
      
      -- Insert a Pledge Item tied to the pledge we just made
      IF v_pledge_id IS NOT NULL THEN
        INSERT INTO public.pledge_items (pledge_id, jewellery_type_id, item_description, gross_weight_grams, net_weight_grams, purity, quantity, item_value)
        VALUES (v_pledge_id, v_jewellery_type_id, 'Gold Chain with Pendant', 45.5, 43.2, '22K', 1, 350000);
      END IF;
  END IF;
END $$;
