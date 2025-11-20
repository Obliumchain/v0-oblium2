-- Add another X/Twitter engagement task

INSERT INTO public.tasks (
  title, 
  description, 
  reward, 
  icon, 
  task_type, 
  action_url, 
  active, 
  is_daily_repeatable
) VALUES 
(
  'Engage: Latest Post',
  'Like, comment, and repost our latest update',
  1000,
  '🔥',
  'social',
  'https://x.com/theobliumchain/status/1991616475241886156?s=46',
  true,
  false
);
