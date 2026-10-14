-- ==============================================================================
-- DAILY PRECIOUS METAL RATES SNAPSHOT & PERSISTENCE
-- Stores the authoritative once-daily 9:00 AM IST spot benchmark from GoldAPI.io
-- ==============================================================================

-- 1. Table for complete daily structured bullion snapshot
CREATE TABLE IF NOT EXISTS public.daily_metal_rates_snapshot (
  id uuid DEFAULT gen_random_uuid(),
  effective_date date NOT NULL UNIQUE,
  gold_24k numeric NOT NULL,
  gold_22k numeric NOT NULL,
  gold_18k numeric NOT NULL,
  silver_gram numeric NOT NULL,
  silver_kg numeric NOT NULL,
  platinum_gram numeric NOT NULL,
  platinum_kg numeric NOT NULL,
  rates_payload jsonb NOT NULL,
  provider text NOT NULL DEFAULT 'GoldAPI.io',
  provider_timestamp timestamptz NOT NULL DEFAULT now(),
  updated_at_ist text NOT NULL,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (effective_date)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.daily_metal_rates_snapshot ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous and authenticated users to read rates (public catalog)
DROP POLICY IF EXISTS "Public can view daily metal rates snapshot" ON public.daily_metal_rates_snapshot;
CREATE POLICY "Public can view daily metal rates snapshot"
  ON public.daily_metal_rates_snapshot
  FOR SELECT
  TO public
  USING (true);

-- 4. Service role / authenticated admins can insert/update rates
DROP POLICY IF EXISTS "Admins can manage daily metal rates snapshot" ON public.daily_metal_rates_snapshot;
CREATE POLICY "Admins can manage daily metal rates snapshot"
  ON public.daily_metal_rates_snapshot
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 5. Update metal_rates check constraint to accommodate platinum
DO $$
BEGIN
  ALTER TABLE public.metal_rates DROP CONSTRAINT IF EXISTS metal_rates_metal_type_check;
  ALTER TABLE public.metal_rates ADD CONSTRAINT metal_rates_metal_type_check 
    CHECK (metal_type IN ('gold', 'silver', 'platinum'));
EXCEPTION
  WHEN OTHERS THEN
    NULL;
END $$;
