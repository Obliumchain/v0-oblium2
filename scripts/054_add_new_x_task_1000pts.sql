-- Add X/Twitter task for new post with 1000 points reward

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
  'Engage with OBLM Post',
  'Like, comment, and repost to stay updated with the latest from Oblium Chain and earn 1000 points!',
  1000,
  '🎯',
  'social',
  'https://x.com/theobliumchain/status/1991837071665955070?s=46',
  true,
  false
);

-- Verify the task was added
SELECT 
  id,
  title,
  reward,
  task_type,
  active
FROM public.tasks
WHERE title = 'Engage with OBLM Post'
LIMIT 1;
