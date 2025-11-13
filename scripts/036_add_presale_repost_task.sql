-- Add presale repost task for 2000 points
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
  'Repost Presale Announcement',
  'Help spread the word! Repost our presale announcement on X and earn 2000 points!',
  2000,
  'twitter_engagement',
  '🔥',
  'https://x.com/theobliumchain/status/1988959319681802474?s=46',
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
