-- Updated reward from 10,000 to 1,000 points
-- Add the avatar selection task that rewards 1,000 points
INSERT INTO public.tasks (
  title,
  description,
  reward,
  task_type,
  icon,
  active
) VALUES (
  'Set Your Profile Avatar',
  'Upload and set a profile picture to personalize your account and earn a bonus!',
  1000,
  'special',
  '🖼️',
  true
) ON CONFLICT DO NOTHING;
