-- ============================================
-- NOTIFICATIONS TABLE AND INTEREST CALCULATION
-- Monthly Interest Notification System
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.customers ON DELETE CASCADE NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN ('monthly_interest', 'payment_reminder', 'pledge_status', 'general')),
  title text NOT NULL,
  message text NOT NULL,
  pledge_id uuid REFERENCES public.pledges ON DELETE CASCADE,
  interest_amount numeric,
  total_amount numeric,
  is_read boolean DEFAULT false,
  sent_via_email boolean DEFAULT false,
  email_sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_customer ON public.notifications(customer_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(notification_type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
DO $$ 
BEGIN
  -- Customers can view their own notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Customers can view own notifications') THEN
    CREATE POLICY "Customers can view own notifications" 
    ON public.notifications 
    FOR SELECT 
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM public.customers WHERE id = customer_id
      )
    );
  END IF;

  -- Customers can update their own notifications (mark as read)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Customers can update own notifications') THEN
    CREATE POLICY "Customers can update own notifications" 
    ON public.notifications 
    FOR UPDATE 
    TO authenticated
    USING (
      customer_id IN (
        SELECT id FROM public.customers WHERE id = customer_id
      )
    );
  END IF;

  -- Service role can insert notifications
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'notifications' AND policyname = 'Service role can insert notifications') THEN
    CREATE POLICY "Service role can insert notifications" 
    ON public.notifications 
    FOR INSERT 
    TO service_role
    WITH CHECK (true);
  END IF;
END $$;

-- ============================================
-- INTEREST CALCULATION FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_pledge_interest(
  p_pledge_id uuid,
  p_calculation_date date DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  pledge_id uuid,
  pledge_number text,
  loan_amount numeric,
  interest_rate numeric,
  interest_type text,
  pledge_date date,
  months_elapsed integer,
  monthly_interest numeric,
  total_interest numeric,
  total_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.pledge_number,
    p.loan_amount,
    p.interest_rate,
    p.interest_type,
    p.pledge_date,
    (EXTRACT(YEAR FROM AGE(p_calculation_date, p.pledge_date))::integer * 12 + 
     EXTRACT(MONTH FROM AGE(p_calculation_date, p.pledge_date))::integer) AS months_elapsed,
    CASE 
      WHEN p.interest_type = 'monthly' THEN p.loan_amount * (p.interest_rate / 100)
      WHEN p.interest_type = 'annual' THEN p.loan_amount * (p.interest_rate / 100 / 12)
      WHEN p.interest_type = 'daily' THEN p.loan_amount * (p.interest_rate / 100 * 30)
      ELSE 0
    END AS monthly_interest,
    CASE 
      WHEN p.interest_type = 'monthly' THEN 
        p.loan_amount * (p.interest_rate / 100) * 
        (EXTRACT(YEAR FROM AGE(p_calculation_date, p.pledge_date))::integer * 12 + 
         EXTRACT(MONTH FROM AGE(p_calculation_date, p.pledge_date))::integer)
      WHEN p.interest_type = 'annual' THEN 
        p.loan_amount * (p.interest_rate / 100) * 
        (EXTRACT(YEAR FROM AGE(p_calculation_date, p.pledge_date))::numeric + 
         EXTRACT(MONTH FROM AGE(p_calculation_date, p.pledge_date))::numeric / 12)
      WHEN p.interest_type = 'daily' THEN
        p.loan_amount * (p.interest_rate / 100) * 
        EXTRACT(DAY FROM AGE(p_calculation_date, p.pledge_date))::numeric
      ELSE 0
    END AS total_interest,
    p.loan_amount + 
    CASE 
      WHEN p.interest_type = 'monthly' THEN 
        p.loan_amount * (p.interest_rate / 100) * 
        (EXTRACT(YEAR FROM AGE(p_calculation_date, p.pledge_date))::integer * 12 + 
         EXTRACT(MONTH FROM AGE(p_calculation_date, p.pledge_date))::integer)
      WHEN p.interest_type = 'annual' THEN 
        p.loan_amount * (p.interest_rate / 100) * 
        (EXTRACT(YEAR FROM AGE(p_calculation_date, p.pledge_date))::numeric + 
         EXTRACT(MONTH FROM AGE(p_calculation_date, p.pledge_date))::numeric / 12)
      WHEN p.interest_type = 'daily' THEN
        p.loan_amount * (p.interest_rate / 100) * 
        EXTRACT(DAY FROM AGE(p_calculation_date, p.pledge_date))::numeric
      ELSE 0
    END AS total_amount
  FROM public.pledges p
  WHERE p.id = p_pledge_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- HELPER FUNCTION: Get all active pledges with calculations
-- ============================================

CREATE OR REPLACE FUNCTION get_all_active_pledges_with_interest()
RETURNS TABLE (
  pledge_id uuid,
  pledge_number text,
  customer_id uuid,
  customer_name text,
  customer_email text,
  customer_phone text,
  loan_amount numeric,
  interest_rate numeric,
  interest_type text,
  pledge_date date,
  months_elapsed integer,
  monthly_interest numeric,
  total_interest numeric,
  total_amount numeric
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.pledge_number,
    c.id,
    c.full_name,
    c.email,
    c.phone,
    p.loan_amount,
    p.interest_rate,
    p.interest_type,
    p.pledge_date,
    (EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.pledge_date))::integer * 12 + 
     EXTRACT(MONTH FROM AGE(CURRENT_DATE, p.pledge_date))::integer) AS months_elapsed,
    CASE 
      WHEN p.interest_type = 'monthly' THEN p.loan_amount * (p.interest_rate / 100)
      WHEN p.interest_type = 'annual' THEN p.loan_amount * (p.interest_rate / 100 / 12)
      WHEN p.interest_type = 'daily' THEN p.loan_amount * (p.interest_rate / 100 * 30)
      ELSE 0
    END AS monthly_interest,
    CASE 
      WHEN p.interest_type = 'monthly' THEN 
        p.loan_amount * (p.interest_rate / 100) * 
        (EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.pledge_date))::integer * 12 + 
         EXTRACT(MONTH FROM AGE(CURRENT_DATE, p.pledge_date))::integer)
      WHEN p.interest_type = 'annual' THEN 
        p.loan_amount * (p.interest_rate / 100) * 
        (EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.pledge_date))::numeric + 
         EXTRACT(MONTH FROM AGE(CURRENT_DATE, p.pledge_date))::numeric / 12)
      WHEN p.interest_type = 'daily' THEN
        p.loan_amount * (p.interest_rate / 100) * 
        EXTRACT(DAY FROM AGE(CURRENT_DATE, p.pledge_date))::numeric
      ELSE 0
    END AS total_interest,
    p.loan_amount + 
    CASE 
      WHEN p.interest_type = 'monthly' THEN 
        p.loan_amount * (p.interest_rate / 100) * 
        (EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.pledge_date))::integer * 12 + 
         EXTRACT(MONTH FROM AGE(CURRENT_DATE, p.pledge_date))::integer)
      WHEN p.interest_type = 'annual' THEN 
        p.loan_amount * (p.interest_rate / 100) * 
        (EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.pledge_date))::numeric + 
         EXTRACT(MONTH FROM AGE(CURRENT_DATE, p.pledge_date))::numeric / 12)
      WHEN p.interest_type = 'daily' THEN
        p.loan_amount * (p.interest_rate / 100) * 
        EXTRACT(DAY FROM AGE(CURRENT_DATE, p.pledge_date))::numeric
      ELSE 0
    END AS total_amount
  FROM public.pledges p
  JOIN public.customers c ON p.customer_id = c.id
  WHERE p.status IN ('active', 'partially_paid');
END;
$$ LANGUAGE plpgsql;

-- Test the functions (optional, comment out in production)
-- SELECT * FROM calculate_pledge_interest('some-pledge-id');
-- SELECT * FROM get_all_active_pledges_with_interest();
