-- Add X/Twitter task for repost and comment with 1000 points reward

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
  'Repost & Comment on OBLM Post',
  'Repost and comment on this post to support Oblium Chain and earn 1000 points!',
  1000,
  '🔄',
  'social',
  'https://x.com/theobliumchain/status/1996207271404245355?s=46',
  true,
  false
);

-- Verify the task was added
SELECT 
  id,
  title,
  reward,
  task_type,
  active,
  action_url
FROM public.tasks
WHERE action_url = 'https://x.com/theobliumchain/status/1996207271404245355?s=46'
LIMIT 1;
