-- Create or replace the can_complete_daily_task function with PST timezone
-- This function checks if a user can complete a daily task today (PST)

CREATE OR REPLACE FUNCTION can_complete_daily_task(
  p_user_id UUID,
  p_task_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date DATE;
  last_completion_date DATE;
BEGIN
  -- Get today's date in PST timezone (America/Los_Angeles)
  -- Tasks reset at 12:00 AM PST every day
  today_date := (NOW() AT TIME ZONE 'America/Los_Angeles')::DATE;
  
  -- Get the last completion date for this task
  SELECT completed_date INTO last_completion_date
  FROM task_completions
  WHERE user_id = p_user_id
    AND task_id = p_task_id
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- If no completion found, user can complete the task
  IF last_completion_date IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If last completion was before today (PST), user can complete again
  IF last_completion_date < today_date THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise, user already completed today
  RETURN FALSE;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION can_complete_daily_task(UUID, UUID) TO authenticated;

-- Add a comment describing the function
COMMENT ON FUNCTION can_complete_daily_task(UUID, UUID) IS 
'Checks if a user can complete a daily task. Returns true if the task has not been completed today (PST timezone).';
