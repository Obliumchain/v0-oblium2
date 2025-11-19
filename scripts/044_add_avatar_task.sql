-- Add "Choose Profile Picture" task
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
  'Choose Profile Picture',
  'Select a profile picture to stand out from the crowd!',
  500,
  'User', -- Lucide icon name
  'special',
  'https://task.obliumtoken.com/choose-avatar',
  true,
  false -- One-time reward (or maybe repeatable? Let's stick to one-time for now)
);
