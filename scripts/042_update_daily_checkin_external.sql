-- Update daily check-in to redirect to external task app
UPDATE public.tasks
SET 
  action_url = 'https://task.obliumtoken.com',
  description = 'Complete your daily check-in on the task app to earn 500 bonus points! Resets daily at 12:00 AM PST'
WHERE task_type = 'daily' 
  AND title = 'Daily Check-In';
