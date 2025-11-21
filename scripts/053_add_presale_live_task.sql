-- Add X/Twitter task announcing presale is live with 3000 points reward

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
  'Presale Live Announcement!',
  'Like, comment, and repost our presale launch announcement to earn a special 3000 point reward!',
  3000,
  '🚀',
  'social',
  'https://x.com/theobliumchain/status/1991827402885079506?s=46',
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
WHERE title = 'Presale Live Announcement!'
LIMIT 1;
