-- Delete all existing tasks and task completions
DELETE FROM task_completions;
DELETE FROM tasks;

-- Add new Connect Wallet task
INSERT INTO tasks (
  id,
  title,
  description,
  reward,
  icon,
  task_type,
  action_url,
  is_daily_repeatable,
  active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Connect Your Wallet',
  'Connect your Solana wallet to receive 10,000 points and 150 OBLM tokens instantly! One-time bonus for first connection.',
  10000,
  '🔗',
  'special',
  NULL, -- No external URL, handled by button
  false,
  true,
  NOW(),
  NOW()
);

-- Verify the task was added
SELECT 
  id,
  title,
  reward,
  task_type,
  active
FROM tasks
WHERE title = 'Connect Your Wallet';
