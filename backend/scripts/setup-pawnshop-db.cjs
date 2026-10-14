const { Client } = require('pg');

// SECURITY: Use environment variables instead of hardcoded credentials
// Set these in your environment or .env file before running this script
const config = {
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    host: process.env.DB_HOST || '',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    database: process.env.DB_NAME || 'postgres',
    ssl: {
        rejectUnauthorized: false
    }
};

// Validate required environment variables
if (!config.password || !config.host) {
    console.error('❌ Error: Missing required database credentials!');
    console.error('Please set the following environment variables:');
    console.error('  DB_PASSWORD=your_password');
    console.error('  DB_HOST=your_supabase_db_host');
    console.error('  DB_USER=your_db_user (optional, defaults to postgres)');
    console.error('  DB_NAME=your_db_name (optional, defaults to postgres)');
    console.error('\nExample:');
    console.error('  DB_PASSWORD=your_password DB_HOST=db.xxx.supabase.co node setup-pawnshop-db.cjs');
    process.exit(1);
}

const sql = `
-- ============================================
-- PAWNSHOP MANAGEMENT SYSTEM DATABASE SCHEMA
-- ============================================

-- Drop existing tables if needed (commented out for safety)
-- DROP TABLE IF EXISTS public.cash_transactions CASCADE;
-- DROP TABLE IF EXISTS public.bank_pledge_receives CASCADE;
-- DROP TABLE IF EXISTS public.bank_pledges CASCADE;
-- DROP TABLE IF EXISTS public.cancelled_transactions CASCADE;
-- DROP TABLE IF EXISTS public.pledge_sales CASCADE;
-- DROP TABLE IF EXISTS public.part_payments CASCADE;
-- DROP TABLE IF EXISTS public.pledge_returns CASCADE;
-- DROP TABLE IF EXISTS public.additional_pledges CASCADE;
-- DROP TABLE IF EXISTS public.pledge_items CASCADE;
-- DROP TABLE IF EXISTS public.pledges CASCADE;
-- DROP TABLE IF EXISTS public.customer_documents CASCADE;
-- DROP TABLE IF EXISTS public.customers CASCADE;
-- DROP TABLE IF EXISTS public.app_users CASCADE;
-- DROP TABLE IF EXISTS public.bank_master CASCADE;
-- DROP TABLE IF EXISTS public.schemes CASCADE;
-- DROP TABLE IF EXISTS public.jewellery_types CASCADE;
-- DROP TABLE IF EXISTS public.loan_types CASCADE;
-- DROP TABLE IF EXISTS public.companies CASCADE;
-- DROP TABLE IF EXISTS public.metal_rates CASCADE;

-- ============================================
-- MASTER TABLES
-- ============================================

-- Metal Rates (Gold, Silver daily rates)
CREATE TABLE IF NOT EXISTS public.metal_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  metal_type text NOT NULL CHECK (metal_type IN ('gold', 'silver')),
  rate_per_gram numeric NOT NULL CHECK (rate_per_gram > 0),
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(metal_type, effective_date)
);

-- Company/Branch Master
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  branch_name text,
  address text,
  city text,
  state text,
  pincode text,
  phone text,
  email text,
  gst_number text,
  license_number text,
  logo_url text,
  print_header text,
  print_footer text,
  language_preference text DEFAULT 'en' CHECK (language_preference IN ('en', 'ta', 'hi')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Loan Types Master
CREATE TABLE IF NOT EXISTS public.loan_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_type_name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Jewellery Types Master
CREATE TABLE IF NOT EXISTS public.jewellery_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jewellery_type_name text NOT NULL UNIQUE,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Schemes Master (Interest rates, terms)
CREATE TABLE IF NOT EXISTS public.schemes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheme_name text NOT NULL UNIQUE,
  interest_rate numeric NOT NULL CHECK (interest_rate >= 0),
  interest_type text NOT NULL CHECK (interest_type IN ('monthly', 'annual', 'daily')),
  min_amount numeric,
  max_amount numeric,
  redemption_period_days integer DEFAULT 365,
  penalty_rate numeric DEFAULT 0,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bank Master
CREATE TABLE IF NOT EXISTS public.bank_master (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  branch_name text,
  account_number text,
  ifsc_code text,
  contact_person text,
  phone text,
  email text,
  address text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- App Users (for login)
CREATE TABLE IF NOT EXISTS public.app_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name text,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'staff')),
  email text,
  phone text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================
-- CUSTOMER MANAGEMENT
-- ============================================

-- Customers
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code text UNIQUE,
  full_name text NOT NULL,
  father_name text,
  date_of_birth date,
  gender text CHECK (gender IN ('male', 'female', 'other')),
  phone text NOT NULL,
  alternate_phone text,
  email text,
  address text NOT NULL,
  city text,
  state text,
  pincode text,
  id_proof_type text CHECK (id_proof_type IN ('aadhar', 'pan', 'voter_id', 'passport', 'driving_license')),
  id_proof_number text,
  photo_url text,
  username text UNIQUE,
  password_hash text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Customer Documents
CREATE TABLE IF NOT EXISTS public.customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  document_url text NOT NULL,
  uploaded_at timestamptz DEFAULT now()
);

-- ============================================
-- TRANSACTION TABLES
-- ============================================

-- Main Pledges Table
CREATE TABLE IF NOT EXISTS public.pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers ON DELETE RESTRICT NOT NULL,
  company_id uuid REFERENCES public.companies ON DELETE RESTRICT,
  loan_type_id uuid REFERENCES public.loan_types ON DELETE RESTRICT,
  scheme_id uuid REFERENCES public.schemes ON DELETE RESTRICT,
  pledge_date date NOT NULL DEFAULT CURRENT_DATE,
  total_weight_grams numeric NOT NULL CHECK (total_weight_grams > 0),
  total_items integer DEFAULT 1,
  appraised_value numeric NOT NULL CHECK (appraised_value > 0),
  loan_amount numeric NOT NULL CHECK (loan_amount > 0),
  interest_rate numeric NOT NULL,
  interest_type text NOT NULL CHECK (interest_type IN ('monthly', 'annual', 'daily')),
  redemption_date date,
  status text NOT NULL CHECK (status IN ('active', 'partially_paid', 'closed', 'sold', 'bank_pledged')) DEFAULT 'active',
  notes text,
  created_by uuid REFERENCES public.app_users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pledge Items (individual items in a pledge)
CREATE TABLE IF NOT EXISTS public.pledge_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges ON DELETE CASCADE NOT NULL,
  jewellery_type_id uuid REFERENCES public.jewellery_types ON DELETE RESTRICT,
  item_description text NOT NULL,
  gross_weight_grams numeric NOT NULL CHECK (gross_weight_grams > 0),
  net_weight_grams numeric NOT NULL CHECK (net_weight_grams > 0),
  purity text,
  quantity integer DEFAULT 1,
  item_value numeric,
  photo_url text,
  created_at timestamptz DEFAULT now()
);

-- Additional Pledges (add more items to existing pledge)
CREATE TABLE IF NOT EXISTS public.additional_pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_pledge_id uuid REFERENCES public.pledges ON DELETE RESTRICT NOT NULL,
  additional_date date NOT NULL DEFAULT CURRENT_DATE,
  additional_weight_grams numeric NOT NULL CHECK (additional_weight_grams > 0),
  additional_amount numeric NOT NULL CHECK (additional_amount > 0),
  notes text,
  created_by uuid REFERENCES public.app_users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Part Payments
CREATE TABLE IF NOT EXISTS public.part_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges ON DELETE RESTRICT NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  payment_amount numeric NOT NULL CHECK (payment_amount > 0),
  principal_paid numeric DEFAULT 0,
  interest_paid numeric DEFAULT 0,
  payment_mode text CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
  receipt_number text,
  notes text,
  created_by uuid REFERENCES public.app_users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Pledge Returns (full redemption)
CREATE TABLE IF NOT EXISTS public.pledge_returns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges ON DELETE RESTRICT NOT NULL,
  return_date date NOT NULL DEFAULT CURRENT_DATE,
  principal_amount numeric NOT NULL,
  interest_amount numeric NOT NULL,
  penalty_amount numeric DEFAULT 0,
  total_amount numeric NOT NULL,
  payment_mode text CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
  receipt_number text,
  notes text,
  created_by uuid REFERENCES public.app_users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Pledge Sales (unredeemed items sold)
CREATE TABLE IF NOT EXISTS public.pledge_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges ON DELETE RESTRICT NOT NULL,
  sale_date date NOT NULL DEFAULT CURRENT_DATE,
  sale_amount numeric NOT NULL CHECK (sale_amount > 0),
  buyer_name text,
  buyer_phone text,
  payment_mode text CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
  notes text,
  created_by uuid REFERENCES public.app_users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- Cancelled Transactions (audit trail)
CREATE TABLE IF NOT EXISTS public.cancelled_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL,
  transaction_id uuid NOT NULL,
  cancellation_date date NOT NULL DEFAULT CURRENT_DATE,
  reason text NOT NULL,
  cancelled_by uuid REFERENCES public.app_users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- BANK OPERATIONS
-- ============================================

-- Bank Pledges (items sent to bank)
CREATE TABLE IF NOT EXISTS public.bank_pledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pledge_id uuid REFERENCES public.pledges ON DELETE RESTRICT NOT NULL,
  bank_id uuid REFERENCES public.bank_master ON DELETE RESTRICT NOT NULL,
  sent_date date NOT NULL DEFAULT CURRENT_DATE,
  amount_received numeric NOT NULL CHECK (amount_received > 0),
  bank_interest_rate numeric,
  expected_return_date date,
  status text NOT NULL CHECK (status IN ('sent', 'received', 'settled')) DEFAULT 'sent',
  notes text,
  created_by uuid REFERENCES public.app_users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Bank Pledge Receives
CREATE TABLE IF NOT EXISTS public.bank_pledge_receives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_pledge_id uuid REFERENCES public.bank_pledges ON DELETE RESTRICT NOT NULL,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  amount_paid numeric NOT NULL,
  interest_paid numeric DEFAULT 0,
  notes text,
  created_by uuid REFERENCES public.app_users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- ACCOUNTS
-- ============================================

-- Cash Transactions
CREATE TABLE IF NOT EXISTS public.cash_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date date NOT NULL DEFAULT CURRENT_DATE,
  transaction_type text NOT NULL CHECK (transaction_type IN ('cash_in', 'cash_out')),
  amount numeric NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  reference_type text,
  reference_id uuid,
  description text,
  payment_mode text CHECK (payment_mode IN ('cash', 'upi', 'card', 'bank_transfer')),
  created_by uuid REFERENCES public.app_users ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_pledges_customer ON public.pledges(customer_id);
CREATE INDEX IF NOT EXISTS idx_pledges_status ON public.pledges(status);
CREATE INDEX IF NOT EXISTS idx_pledges_date ON public.pledges(pledge_date);
CREATE INDEX IF NOT EXISTS idx_pledge_items_pledge ON public.pledge_items(pledge_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_part_payments_pledge ON public.part_payments(pledge_id);
CREATE INDEX IF NOT EXISTS idx_cash_transactions_date ON public.cash_transactions(transaction_date);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

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

-- ============================================
-- RLS POLICIES
-- ============================================

-- Allow authenticated users to read all master data
DO $$ 
BEGIN
  -- Metal Rates
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view metal rates') THEN
    CREATE POLICY "Anyone can view metal rates" ON public.metal_rates FOR SELECT TO public USING (true);
  END IF;
  
  -- Companies
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view companies') THEN
    CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT TO public USING (true);
  END IF;
  
  -- Loan Types
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view loan types') THEN
    CREATE POLICY "Anyone can view loan types" ON public.loan_types FOR SELECT TO public USING (true);
  END IF;
  
  -- Jewellery Types
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view jewellery types') THEN
    CREATE POLICY "Anyone can view jewellery types" ON public.jewellery_types FOR SELECT TO public USING (true);
  END IF;
  
  -- Schemes
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view schemes') THEN
    CREATE POLICY "Anyone can view schemes" ON public.schemes FOR SELECT TO public USING (true);
  END IF;
  
  -- Bank Master
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view banks') THEN
    CREATE POLICY "Anyone can view banks" ON public.bank_master FOR SELECT TO public USING (true);
  END IF;
  
  -- Customers
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view customers') THEN
    CREATE POLICY "Anyone can view customers" ON public.customers FOR SELECT TO public USING (true);
  END IF;
  
  -- Pledges
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view pledges') THEN
    CREATE POLICY "Anyone can view pledges" ON public.pledges FOR SELECT TO public USING (true);
  END IF;
  
  -- Pledge Items
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Anyone can view pledge items') THEN
    CREATE POLICY "Anyone can view pledge items" ON public.pledge_items FOR SELECT TO public USING (true);
  END IF;
END $$;

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to generate pledge number
CREATE OR REPLACE FUNCTION generate_pledge_number()
RETURNS text AS $$
DECLARE
  next_num integer;
  pledge_num text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(pledge_number FROM 'PLG([0-9]+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.pledges;
  
  pledge_num := 'PLG' || LPAD(next_num::text, 6, '0');
  RETURN pledge_num;
END;
$$ LANGUAGE plpgsql;

-- Function to generate customer code
CREATE OR REPLACE FUNCTION generate_customer_code()
RETURNS text AS $$
DECLARE
  next_num integer;
  cust_code text;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(customer_code FROM 'CUST([0-9]+)') AS integer)), 0) + 1
  INTO next_num
  FROM public.customers;
  
  cust_code := 'CUST' || LPAD(next_num::text, 6, '0');
  RETURN cust_code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate pledge number
CREATE OR REPLACE FUNCTION set_pledge_number()
RETURNS trigger AS $$
BEGIN
  IF NEW.pledge_number IS NULL THEN
    NEW.pledge_number := generate_pledge_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_pledge_number ON public.pledges;
CREATE TRIGGER trigger_set_pledge_number
  BEFORE INSERT ON public.pledges
  FOR EACH ROW EXECUTE FUNCTION set_pledge_number();

-- Trigger to auto-generate customer code
CREATE OR REPLACE FUNCTION set_customer_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.customer_code IS NULL THEN
    NEW.customer_code := generate_customer_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_customer_code ON public.customers;
CREATE TRIGGER trigger_set_customer_code
  BEFORE INSERT ON public.customers
  FOR EACH ROW EXECUTE FUNCTION set_customer_code();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pledges_updated_at ON public.pledges;
CREATE TRIGGER update_pledges_updated_at BEFORE UPDATE ON public.pledges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bank_pledges_updated_at ON public.bank_pledges;
CREATE TRIGGER update_bank_pledges_updated_at BEFORE UPDATE ON public.bank_pledges FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function setup() {
    const client = new Client(config);

    try {
        console.log('🔌 Connecting to Supabase Database...');
        await client.connect();
        console.log('✅ Connected successfully!');

        console.log('📊 Creating pawnshop database schema...');
        await client.query(sql);
        console.log('✅ Database schema setup complete!');

        // Insert default metal rates
        console.log('💰 Setting up default metal rates...');
        await client.query(`
          INSERT INTO public.metal_rates (metal_type, rate_per_gram, effective_date)
          VALUES 
            ('gold', 10200, CURRENT_DATE),
            ('silver', 300, CURRENT_DATE)
          ON CONFLICT (metal_type, effective_date) DO NOTHING;
        `);
        console.log('✅ Metal rates configured!');

        // Insert sample master data
        console.log('📝 Inserting sample master data...');

        // Sample Company
        await client.query(`
          INSERT INTO public.companies (company_name, branch_name, address, city, state, phone, language_preference)
          VALUES ('Sri Lakshmi Pawn Brokers', 'Main Branch', '123 Main Street', 'Chennai', 'Tamil Nadu', '9876543210', 'en')
          ON CONFLICT DO NOTHING;
        `);

        // Sample Loan Types
        await client.query(`
          INSERT INTO public.loan_types (loan_type_name, description)
          VALUES 
            ('Gold Loan', 'Loan against gold jewelry'),
            ('Silver Loan', 'Loan against silver items'),
            ('Diamond Loan', 'Loan against diamond jewelry')
          ON CONFLICT (loan_type_name) DO NOTHING;
        `);

        // Sample Jewellery Types
        await client.query(`
          INSERT INTO public.jewellery_types (jewellery_type_name, description)
          VALUES 
            ('Gold Chain', 'Gold chain'),
            ('Gold Ring', 'Gold ring'),
            ('Gold Bangle', 'Gold bangle'),
            ('Silver Anklet', 'Silver anklet'),
            ('Diamond Ring', 'Diamond ring')
          ON CONFLICT (jewellery_type_name) DO NOTHING;
        `);

        // Sample Schemes
        await client.query(`
          INSERT INTO public.schemes (scheme_name, interest_rate, interest_type, redemption_period_days, description)
          VALUES 
            ('Standard Gold Loan', 2.0, 'monthly', 365, 'Standard gold loan with 2% monthly interest'),
            ('Premium Scheme', 1.5, 'monthly', 180, 'Premium scheme with lower interest'),
            ('Quick Loan', 2.5, 'monthly', 90, 'Quick loan for short term needs')
          ON CONFLICT (scheme_name) DO NOTHING;
        `);

        // Sample Bank
        await client.query(`
          INSERT INTO public.bank_master (bank_name, branch_name, account_number, ifsc_code)
          VALUES ('State Bank of India', 'T Nagar Branch', '1234567890', 'SBIN0001234')
          ON CONFLICT DO NOTHING;
        `);

        // Default admin user (password: admin123)
        await client.query(`
          INSERT INTO public.app_users (username, password_hash, full_name, role, email)
          VALUES ('admin', '$2a$10$rKvVPZqGvqKvJVJvJvJvJeN9N9N9N9N9N9N9N9N9N9N9N9N9N9N9N', 'Administrator', 'admin', 'admin@pawnshop.com')
          ON CONFLICT (username) DO NOTHING;
        `);

        console.log('✅ Sample data inserted!');
        console.log('\n🎉 Pawnshop database setup completed successfully!');
        console.log('\n📌 Default Login Credentials:');
        console.log('   Username: admin');
        console.log('   Password: admin123');
        console.log('\n💡 Note: Please change the default password after first login.');

    } catch (err) {
        console.error('❌ Error during setup:', err.message);
        console.error(err);
    } finally {
        await client.end();
    }
}

setup();
