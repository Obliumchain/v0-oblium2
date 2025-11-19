-- Clear all existing tasks and task completions
DELETE FROM task_completions;
DELETE FROM tasks;

-- Create new external tasks that will be completed on task.obliumtoken.com
-- All tasks now redirect to the external task app

INSERT INTO tasks (id, title, description, reward, task_type, icon, action_url, active, is_daily_repeatable) VALUES
-- Daily Tasks
('11111111-1111-1111-1111-111111111111', 'Daily Check-In', 'Check in every day to earn bonus points! Resets daily at 12:00 AM PT', 500, 'daily', '⭐', 'https://task.obliumtoken.com/daily-checkin', true, true),

-- Social Tasks
('22222222-2222-2222-2222-222222222222', 'Follow on Twitter', 'Follow @ObliumToken on Twitter/X to stay updated', 1000, 'social', '🐦', 'https://task.obliumtoken.com/twitter-follow', true, false),
('33333333-3333-3333-3333-333333333333', 'Join Telegram', 'Join our Telegram community and connect with other users', 1000, 'social', '💬', 'https://task.obliumtoken.com/telegram-join', true, false),
('44444444-4444-4444-4444-444444444444', 'Like & Retweet', 'Like and retweet our pinned post on Twitter/X', 750, 'social', '❤️', 'https://task.obliumtoken.com/twitter-engage', true, false),

-- Referral Tasks
('55555555-5555-5555-5555-555555555555', 'Invite 3 Friends', 'Invite 3 friends using your referral link', 2000, 'referral', '👥', 'https://task.obliumtoken.com/referral-3', true, false),
('66666666-6666-6666-6666-666666666666', 'Invite 10 Friends', 'Invite 10 friends using your referral link', 5000, 'referral', '🎯', 'https://task.obliumtoken.com/referral-10', true, false),

-- Special Tasks
('77777777-7777-7777-7777-777777777777', 'Complete Profile', 'Add your name and avatar to your profile', 500, 'special', '👤', 'https://task.obliumtoken.com/complete-profile', true, false),
('88888888-8888-8888-8888-888888888888', 'Connect Wallet', 'Connect your Solana wallet to your account', 1000, 'special', '💰', 'https://task.obliumtoken.com/connect-wallet', true, false);

-- Update task completion tracking to work with external tasks
-- The external_task_claims table will track completions via webhook
