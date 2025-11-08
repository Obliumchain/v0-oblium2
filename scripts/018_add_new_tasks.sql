-- Insert new tasks with updated links and requirements
INSERT INTO public.tasks (title, description, reward, task_type, icon, action_url, active) VALUES
  ('Follow on X', 'Follow @theobliumchain on X (Twitter)', 100, 'social', '𝕏', 'https://x.com/theobliumchain?s=21', true),
  ('Join Telegram', 'Join the Oblium Telegram community', 150, 'social', '📱', 'https://t.me/obliumchain', true),
  ('Join Discord', 'Join our Discord server and get verified', 150, 'social', '💬', 'https://discord.gg/v9UQuPC8nd', true),
  ('Like 3 Posts on X', 'Like 3 posts from @theobliumchain on X', 120, 'social', '❤️', 'https://x.com/theobliumchain?s=21', true),
  ('Repost on X', 'Repost our pinned tweet on X', 200, 'social', '🔁', 'https://x.com/theobliumchain/status/1987231385635942811?s=46', true),
  ('Share with 5 Friends', 'Share your referral link with 5 friends', 250, 'referral', '🔗', NULL, true)
ON CONFLICT DO NOTHING;
