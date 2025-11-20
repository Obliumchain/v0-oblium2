-- Add 3 new X/Twitter engagement tasks for like, comment, and repost

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
  'Engage: Latest Community Update',
  'Like, comment, and repost this community update',
  1000,
  '✨',
  'social',
  'https://x.com/theobliumchain/status/1991583669514088795?s=46',
  true,
  false
),
(
  'Engage: Important Announcement',
  'Like, comment, and repost this important announcement',
  1000,
  '📢',
  'social',
  'https://x.com/theobliumchain/status/1991396202966061237?s=46',
  true,
  false
),
(
  'Engage: Project Milestone',
  'Like, comment, and repost this milestone post',
  1000,
  '🎯',
  'social',
  'https://x.com/theobliumchain/status/1991303888570306590?s=46',
  true,
  false
);
