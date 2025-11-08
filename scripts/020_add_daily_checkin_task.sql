-- Add daily check-in task
INSERT INTO public.tasks (
  title, 
  description, 
  reward, 
  task_type, 
  icon, 
  action_url, 
  active,
  is_daily_repeatable
) VALUES (
  'Daily Check-In',
  'Check in every day to earn bonus points! Resets daily at 1:00 AM EST',
  100,
  'daily',
  '✨',
  NULL,
  true,
  true
)
ON CONFLICT DO NOTHING;
