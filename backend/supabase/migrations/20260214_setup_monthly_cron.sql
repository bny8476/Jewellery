-- ============================================
-- AUTOMATED MONTHLY NOTIFICATIONS CRON JOB
-- Runs automatically on the 1st of every month at 9:00 AM
-- ============================================

-- Step 1: Enable pg_cron extension (run this first)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Create a stored procedure for sending notifications
CREATE OR REPLACE FUNCTION send_monthly_interest_notifications()
RETURNS void AS $$
DECLARE
  pledge_record RECORD;
  calc_record RECORD;
  notification_count INTEGER := 0;
BEGIN
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
    -- Calculate interest for this pledge
    SELECT * INTO calc_record
    FROM calculate_pledge_interest(pledge_record.pledge_id);

    -- Insert notification
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

  RAISE NOTICE 'Created % notifications for active pledges', notification_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Schedule the cron job to run on the 1st of every month at 9:00 AM
SELECT cron.schedule(
  'monthly-interest-notifications',  -- Job name
  '0 9 1 * *',                        -- Cron expression: At 9:00 AM on day 1 of every month
  'SELECT send_monthly_interest_notifications();'
);

-- ============================================
-- CRON JOB MANAGEMENT COMMANDS
-- ============================================

-- View all scheduled cron jobs
-- SELECT * FROM cron.job;

-- View cron job execution history
-- SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 10;

-- Unschedule the cron job (if needed)
-- SELECT cron.unschedule('monthly-interest-notifications');

-- Manually trigger the function to test
-- SELECT send_monthly_interest_notifications();

-- ============================================
-- CRON EXPRESSION EXPLAINED
-- ============================================
-- Format: minute hour day month day_of_week
-- '0 9 1 * *' means:
--   0  = At minute 0
--   9  = At hour 9 (9:00 AM)
--   1  = On day 1 of the month
--   *  = Every month
--   *  = Any day of the week

-- Other useful schedules:
-- '0 9 * * *'    = Every day at 9:00 AM
-- '0 9 * * 1'    = Every Monday at 9:00 AM
-- '0 9 1,15 * *' = 1st and 15th of every month at 9:00 AM
-- '0 */6 * * *'  = Every 6 hours
