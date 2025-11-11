-- Add Twitter engagement task for like, repost, and share
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
  'Like & Repost on X',
  'Like and repost our tweet, then share with 5 friends to earn points!',
  1000,
  'twitter_engagement',
  '🐦',
  'https://x.com/theobliumchain/status/1987890962887053575?s=46',
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
