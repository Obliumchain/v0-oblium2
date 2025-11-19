-- Add Twitter/X engagement tasks
-- Follow @theobliumchain and engage with specific posts

-- Follow task
INSERT INTO public.tasks (
  title, 
  description, 
  reward, 
  icon, 
  task_type, 
  action_url, 
  active, 
  is_daily_repeatable
) VALUES (
  'Follow @theobliumchain',
  'Follow our official Twitter/X account to stay updated with the latest news',
  1000,
  '🐦',
  'social',
  'https://task.obliumtoken.com/twitter-follow-official',
  true,
  false
);

-- Engagement tasks for specific posts
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
  'Engage: Community Update',
  'Like, comment, and repost our latest community update',
  1000,
  '💬',
  'social',
  'https://task.obliumtoken.com/twitter-engage?postId=1991248619966476573',
  true,
  false
),
(
  'Engage: Partnership Announcement',
  'Like, comment, and repost our partnership announcement',
  1000,
  '🤝',
  'social',
  'https://task.obliumtoken.com/twitter-engage?postId=1991109196444504497',
  true,
  false
),
(
  'Engage: Development Update',
  'Like, comment, and repost our development progress update',
  1000,
  '⚙️',
  'social',
  'https://task.obliumtoken.com/twitter-engage?postId=1990890626045358250',
  true,
  false
),
(
  'Engage: Token Launch News',
  'Like, comment, and repost our token launch announcement',
  1000,
  '🚀',
  'social',
  'https://task.obliumtoken.com/twitter-engage?postId=1987256268696760322',
  true,
  false
),
(
  'Engage: Presale Information',
  'Like, comment, and repost our presale information post',
  1000,
  '💎',
  'social',
  'https://task.obliumtoken.com/twitter-engage?postId=1990753518781640733',
  true,
  false
);
