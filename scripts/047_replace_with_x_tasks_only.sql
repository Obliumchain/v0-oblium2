-- Clear all existing tasks and add only X/Twitter engagement tasks
-- Remove all old tasks
DELETE FROM public.tasks;
DELETE FROM public.task_completions;

-- Insert only X/Twitter tasks
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
-- Follow task
(
  'Follow @theobliumchain',
  'Follow our official X/Twitter account to stay updated',
  1000,
  '🐦',
  'social',
  'https://x.com/theobliumchain?s=21',
  true,
  false
),
-- Post engagement tasks
(
  'Engage: Latest Update Post',
  'Like, comment, and repost this important update',
  1000,
  '💬',
  'social',
  'https://x.com/theobliumchain/status/1991248619966476573?s=46',
  true,
  false
),
(
  'Engage: Community Post #2',
  'Like, comment, and repost to support the community',
  1000,
  '🤝',
  'social',
  'https://x.com/theobliumchain/status/1991109196444504497?s=46',
  true,
  false
),
(
  'Engage: Community Post #3',
  'Like, comment, and repost to spread the word',
  1000,
  '⚙️',
  'social',
  'https://x.com/theobliumchain/status/1990890626045358250?s=46',
  true,
  false
),
(
  'Engage: Community Post #4',
  'Like, comment, and repost to boost visibility',
  1000,
  '🚀',
  'social',
  'https://x.com/theobliumchain/status/1987256268696760322?s=46',
  true,
  false
),
(
  'Engage: Community Post #5',
  'Like, comment, and repost to grow our presence',
  1000,
  '💎',
  'social',
  'https://x.com/theobliumchain/status/1990753518781640733?s=46',
  true,
  false
);
