-- Add special apology task for downtime compensation
-- This task gives all users 10,000 points and will expire in 2 days

INSERT INTO public.tasks (
  title, 
  description, 
  reward, 
  task_type, 
  icon, 
  action_url,
  active,
  is_daily_repeatable,
  created_at,
  updated_at
) VALUES (
  'Downtime Compensation',
  'We apologize for the recent downtime. Claim your 10,000 bonus points as our way of saying thank you for your patience!',
  10000,
  'special',
  '🎁',
  NULL,
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;

-- Create a function to automatically deactivate the apology task after 2 days
CREATE OR REPLACE FUNCTION deactivate_apology_task()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.tasks
  SET active = false, updated_at = NOW()
  WHERE title = 'Downtime Compensation'
    AND active = true
    AND created_at < NOW() - INTERVAL '2 days';
END;
$$;

-- Schedule note: You'll need to manually run this function after 2 days:
-- SELECT deactivate_apology_task();
-- Or set up a cron job in Supabase to run it automatically

COMMIT;
