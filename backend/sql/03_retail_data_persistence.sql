-- ============================================================================
-- 03_RETAIL_DATA_PERSISTENCE.SQL
-- RCB JEWELRY'S & PAWN SHOP
-- Production schema for POS sales, inventory tags, procurement, diamonds,
-- store settings, sequence counters, and immutable audit logs.
-- ============================================================================

-- 1. Ensure columns exist on jewelry_items
ALTER TABLE IF EXISTS public.jewelry_items 
  ADD COLUMN IF NOT EXISTS weight numeric(10,3) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS purity text DEFAULT '22K',
  ADD COLUMN IF NOT EXISTS metal_type text DEFAULT 'Gold',
  ADD COLUMN IF NOT EXISTS stock_quantity integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS wastage_percent numeric(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS huid text;

-- 2. Sequence counters table for gap-free consecutive numbering (CGST Rule 46)
CREATE TABLE IF NOT EXISTS public.app_sequences (
  sequence_name text PRIMARY KEY,
  current_value bigint NOT NULL DEFAULT 0,
  prefix text NOT NULL DEFAULT '',
  pad_length integer NOT NULL DEFAULT 4,
  updated_at timestamptz DEFAULT now()
);

-- Seed default sequences
INSERT INTO public.app_sequences (sequence_name, current_value, prefix, pad_length)
VALUES 
  ('pos_invoice', 1000, 'INV', 6),
  ('purchase_order', 100, 'PO', 4),
  ('customer_code', 1000, 'CUST', 4)
ON CONFLICT (sequence_name) DO NOTHING;

-- Function for atomic sequence retrieval and increment
CREATE OR REPLACE FUNCTION public.get_next_sequence_val(p_seq_name text, p_prefix text DEFAULT NULL, p_pad integer DEFAULT NULL)
RETURNS text AS $$
DECLARE
  v_seq RECORD;
  v_next bigint;
  v_prefix text;
  v_pad integer;
  v_year text;
BEGIN
  v_year := to_char(CURRENT_DATE, 'YYYY');

  SELECT * INTO v_seq FROM public.app_sequences WHERE sequence_name = p_seq_name FOR UPDATE;
  
  IF NOT FOUND THEN
    v_prefix := COALESCE(p_prefix, 'SEQ');
    v_pad := COALESCE(p_pad, 4);
    v_next := 1;
    INSERT INTO public.app_sequences (sequence_name, current_value, prefix, pad_length, updated_at)
    VALUES (p_seq_name, v_next, v_prefix, v_pad, now());
  ELSE
    v_next := v_seq.current_value + 1;
    v_prefix := COALESCE(p_prefix, v_seq.prefix);
    v_pad := COALESCE(p_pad, v_seq.pad_length);
    UPDATE public.app_sequences 
    SET current_value = v_next, updated_at = now() 
    WHERE sequence_name = p_seq_name;
  END IF;

  RETURN v_prefix || '-' || v_year || '-' || lpad(v_next::text, v_pad, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Point of Sale (POS) Sales & Invoices
CREATE TABLE IF NOT EXISTS public.pos_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  customer_name text NOT NULL DEFAULT 'Counter Client',
  customer_phone text NOT NULL DEFAULT '',
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  making_charges_total numeric(12,2) NOT NULL DEFAULT 0,
  hallmarking_fee numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  final_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  payment_reference text,
  status text NOT NULL DEFAULT 'completed',
  created_at timestamptz DEFAULT now(),
  created_by text DEFAULT 'staff'
);

-- POS Sale Line Items
CREATE TABLE IF NOT EXISTS public.pos_sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES public.pos_sales(id) ON DELETE CASCADE,
  item_id text,
  name text NOT NULL,
  category text,
  metal_type text,
  purity text,
  weight numeric(10,3) DEFAULT 0,
  making_charge numeric(10,2) DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  price numeric(12,2) NOT NULL DEFAULT 0,
  huid text,
  created_at timestamptz DEFAULT now()
);

-- 4. Procurement & Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id text PRIMARY KEY,
  supplier_name text NOT NULL,
  contact_person text,
  phone text,
  email text,
  gstin text,
  address text,
  category text DEFAULT 'Bullion Refiner',
  outstanding_balance numeric(12,2) NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.purchases (
  id text PRIMARY KEY,
  purchase_number text UNIQUE NOT NULL,
  supplier_id text REFERENCES public.suppliers(id) ON DELETE SET NULL,
  supplier_name text NOT NULL,
  invoice_ref text,
  metal_type text NOT NULL DEFAULT 'Gold',
  purity text NOT NULL DEFAULT '24K (999)',
  gross_weight numeric(10,3) NOT NULL DEFAULT 0,
  net_weight numeric(10,3) NOT NULL DEFAULT 0,
  rate_per_gram numeric(10,2) NOT NULL DEFAULT 0,
  total_amount numeric(12,2) NOT NULL DEFAULT 0,
  paid_amount numeric(12,2) NOT NULL DEFAULT 0,
  payment_status text NOT NULL DEFAULT 'pending',
  purchase_date timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 5. Certified Solitaires & Gemstones Register
CREATE TABLE IF NOT EXISTS public.certified_diamonds (
  id text PRIMARY KEY,
  sku text UNIQUE NOT NULL,
  origin text NOT NULL DEFAULT 'natural',
  shape text NOT NULL DEFAULT 'Round Brilliant',
  carat numeric(6,2) NOT NULL DEFAULT 1.0,
  color text NOT NULL DEFAULT 'F',
  clarity text NOT NULL DEFAULT 'VS1',
  cut text NOT NULL DEFAULT 'Excellent',
  cert_lab text NOT NULL DEFAULT 'GIA',
  cert_number text NOT NULL,
  purchase_cost numeric(12,2) NOT NULL DEFAULT 0,
  rapaport_benchmark_inr numeric(12,2) NOT NULL DEFAULT 0,
  selling_price numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz DEFAULT now()
);

-- 6. Store Settings & Legal Identity Configuration
CREATE TABLE IF NOT EXISTS public.store_settings (
  id text PRIMARY KEY DEFAULT 'primary',
  settings_key text UNIQUE NOT NULL,
  value jsonb NOT NULL,
  updated_at timestamptz DEFAULT now(),
  updated_by text DEFAULT 'system'
);

-- 7. Immutable System & Security Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id text PRIMARY KEY,
  timestamp timestamptz NOT NULL DEFAULT now(),
  actor_email text NOT NULL,
  actor_role text NOT NULL,
  action text NOT NULL,
  resource text NOT NULL,
  details text,
  severity text NOT NULL DEFAULT 'info'
);

-- 8. Enable Row-Level Security on all new tables
ALTER TABLE public.app_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certified_diamonds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 9. Add RLS Policies using public.is_staff_or_admin()
DROP POLICY IF EXISTS "Staff can manage pos_sales" ON public.pos_sales;
CREATE POLICY "Staff can manage pos_sales" ON public.pos_sales
FOR ALL TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff can manage pos_sale_items" ON public.pos_sale_items;
CREATE POLICY "Staff can manage pos_sale_items" ON public.pos_sale_items
FOR ALL TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff can manage suppliers" ON public.suppliers;
CREATE POLICY "Staff can manage suppliers" ON public.suppliers
FOR ALL TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff can manage purchases" ON public.purchases;
CREATE POLICY "Staff can manage purchases" ON public.purchases
FOR ALL TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff can manage certified_diamonds" ON public.certified_diamonds;
CREATE POLICY "Staff can manage certified_diamonds" ON public.certified_diamonds
FOR ALL TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff can manage store_settings" ON public.store_settings;
CREATE POLICY "Staff can manage store_settings" ON public.store_settings
FOR ALL TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff can view and record audit_logs" ON public.audit_logs;
CREATE POLICY "Staff can view and record audit_logs" ON public.audit_logs
FOR ALL TO authenticated USING (public.is_staff_or_admin());

DROP POLICY IF EXISTS "Staff can use app_sequences" ON public.app_sequences;
CREATE POLICY "Staff can use app_sequences" ON public.app_sequences
FOR ALL TO authenticated USING (public.is_staff_or_admin());
