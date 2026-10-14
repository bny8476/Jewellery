-- ============================================
-- ADMIN UTILITY: Send Monthly Interest Notifications
-- Run this manually or set up as a cron job
-- ============================================

-- This function creates notifications for all active pledges
-- It calculates interest and sends notifications to customers

DO $$
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
END $$;

-- ============================================
-- EXAMPLE: Send a single test notification
-- ============================================

-- Replace 'customer-id-here' with actual customer ID
-- Replace 'pledge-id-here' with actual pledge ID (optional)

/*
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
  'customer-id-here'::uuid,
  'general',
  'Test Notification',
  'This is a test notification to verify the system is working correctly.',
  NULL,
  NULL,
  NULL,
  false
);
*/

-- ============================================
-- QUERY: View all notifications for a customer
-- ============================================

-- Replace 'customer-id-here' with actual customer ID
/*
SELECT 
  n.id,
  n.notification_type,
  n.title,
  n.message,
  n.interest_amount,
  n.total_amount,
  n.is_read,
  n.created_at,
  p.pledge_number
FROM public.notifications n
LEFT JOIN public.pledges p ON n.pledge_id = p.id
WHERE n.customer_id = 'customer-id-here'::uuid
ORDER BY n.created_at DESC;
*/

-- ============================================
-- QUERY: Get notification statistics
-- ============================================

SELECT 
  notification_type,
  COUNT(*) as total_notifications,
  SUM(CASE WHEN is_read THEN 1 ELSE 0 END) as read_count,
  SUM(CASE WHEN NOT is_read THEN 1 ELSE 0 END) as unread_count,
  SUM(CASE WHEN sent_via_email THEN 1 ELSE 0 END) as emailed_count
FROM public.notifications
GROUP BY notification_type
ORDER BY total_notifications DESC;
