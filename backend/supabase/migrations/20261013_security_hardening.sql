-- ==============================================================================
-- MIGRATION: 20261013_security_hardening.sql
-- PURPOSE: Remediates confirmed security vulnerabilities:
--   1. Privilege escalation defense on public.profiles (SEC-02)
--   2. Broken Object-Level Authorization fix on public.notifications (SEC-04)
--   3. Search path hardening on SECURITY DEFINER functions (SEC-06)
--   4. Administrative RPC access restrictions (SEC-08)
-- ==============================================================================

-- 1. HARDEN HELPER FUNCTION WITH FIXED SEARCH PATH
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('admin', 'manager', 'staff')
  ) OR (
    current_setting('app.admin_email', true) IS NOT NULL 
    AND current_setting('app.admin_email', true) <> ''
    AND auth.jwt() ->> 'email' = current_setting('app.admin_email', true)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 2. PREVENT PRIVILEGE ESCALATION ON PROFILES TABLE (SEC-02)
CREATE OR REPLACE FUNCTION public.protect_profile_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Prevent non-administrators from modifying user roles
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    IF NOT (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
          AND role IN ('admin', 'manager')
      ) OR auth.role() = 'service_role'
    ) THEN
      RAISE EXCEPTION 'Privilege escalation rejected: only administrators can modify user roles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_role ON public.profiles;
CREATE TRIGGER trg_protect_profile_role
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_role();

-- Harden new user handler so role defaults to 'user' and cannot be spoofed in metadata
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'user')
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(public.profiles.full_name, EXCLUDED.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- 3. REMEDIATE NOTIFICATIONS BROKEN OBJECT-LEVEL AUTHORIZATION (SEC-04)
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Customers can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Staff can insert notifications" ON public.notifications;

-- Customers can view only their own notifications; staff/admin can view all
CREATE POLICY "Customers can view own notifications" 
ON public.notifications 
FOR SELECT 
TO authenticated
USING (
  customer_id = auth.uid() 
  OR public.is_staff_or_admin()
);

-- Customers can update only their own notifications (e.g. is_read)
CREATE POLICY "Customers can update own notifications" 
ON public.notifications 
FOR UPDATE 
TO authenticated
USING (
  customer_id = auth.uid() 
  OR public.is_staff_or_admin()
)
WITH CHECK (
  customer_id = auth.uid() 
  OR public.is_staff_or_admin()
);

-- Authorized staff or service role can insert notifications
CREATE POLICY "Authorized staff can insert notifications"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (public.is_staff_or_admin());

-- 4. RESTRICT ADMINISTRATIVE INTEREST RPC EXECUTION (SEC-08)
CREATE OR REPLACE FUNCTION public.send_monthly_interest_notifications()
RETURNS void AS $$
DECLARE
  pledge_record RECORD;
  calc_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Strict administrative role verification
  IF NOT (public.is_staff_or_admin() OR auth.role() = 'service_role') THEN
    RAISE EXCEPTION 'Administrative privilege required to execute interest batch calculation.';
  END IF;

  -- Loop through all active pledges
  FOR pledge_record IN 
    SELECT 
      p.id as pledge_id,
      p.pledge_number,
      p.customer_id,
      c.full_name,
      c.email
    FROM public.pledges p
    JOIN public.customers c ON p.customer_id = c.id
    WHERE p.status IN ('active', 'partially_paid')
  LOOP
    SELECT * INTO calc_record
    FROM calculate_pledge_interest(pledge_record.pledge_id);

    INSERT INTO public.notifications (
      customer_id,
      notification_type,
      title,
      message,
      pledge_id,
      interest_amount,
      total_amount,
      sent_via_email
    ) VALUES (
      pledge_record.customer_id,
      'monthly_interest',
      'Monthly Interest Statement - ' || calc_record.pledge_number,
      'Your pledge ' || calc_record.pledge_number || ' has accumulated ₹' || 
      ROUND(calc_record.total_interest, 2) || ' in interest over ' || 
      calc_record.months_elapsed || ' months. Total amount due: ₹' || 
      ROUND(calc_record.total_amount, 2),
      pledge_record.pledge_id,
      calc_record.total_interest,
      calc_record.total_amount,
      CASE WHEN pledge_record.email IS NOT NULL THEN true ELSE false END
    );

    notification_count := notification_count + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

REVOKE ALL ON FUNCTION public.send_monthly_interest_notifications() FROM public;
REVOKE ALL ON FUNCTION public.send_monthly_interest_notifications() FROM anon;
GRANT EXECUTE ON FUNCTION public.send_monthly_interest_notifications() TO authenticated, service_role;
