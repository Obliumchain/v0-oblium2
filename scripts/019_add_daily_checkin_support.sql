-- Add support for repeatable daily tasks
-- Add a column to track if task is repeatable daily
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS is_daily_repeatable BOOLEAN DEFAULT false;

-- Add a column to track last completion date for daily tasks
ALTER TABLE public.task_completions ADD COLUMN IF NOT EXISTS completed_date DATE DEFAULT CURRENT_DATE;

-- Create index for faster daily task lookups
CREATE INDEX IF NOT EXISTS idx_task_completions_daily 
ON public.task_completions(user_id, task_id, completed_date);

-- Create function to check if daily task can be completed today
CREATE OR REPLACE FUNCTION can_complete_daily_task(
  p_user_id UUID,
  p_task_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  v_completed_today BOOLEAN;
  v_today_est DATE;
BEGIN
  -- Get today's date in EST timezone
  v_today_est := (NOW() AT TIME ZONE 'America/New_York')::DATE;
  
  -- Check if task was completed today
  SELECT EXISTS (
    SELECT 1 
    FROM public.task_completions 
    WHERE user_id = p_user_id 
      AND task_id = p_task_id 
      AND completed_date = v_today_est
  ) INTO v_completed_today;
  
  RETURN NOT v_completed_today;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION can_complete_daily_task(UUID, UUID) TO authenticated;
