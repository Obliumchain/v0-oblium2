-- Add X/Twitter task for new post with 500 points reward

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
  'Support OBLM on X',
  'Like, comment, and repost to engage with the Oblium Chain community and earn 500 points!',
  500,
  '💬',
  'social',
  'https://x.com/theobliumchain/status/1991989756285399125?s=46',
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
WHERE action_url = 'https://x.com/theobliumchain/status/1991989756285399125?s=46'
LIMIT 1;
