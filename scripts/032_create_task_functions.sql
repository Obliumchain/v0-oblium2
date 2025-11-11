-- Create function to check if a user can complete a daily task
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
  -- Get today's date in EST timezone
  today_date := (NOW() AT TIME ZONE 'America/New_York')::DATE;
  
  -- Get the last completion date for this task
  SELECT completed_date INTO last_completion_date
  FROM task_completions
  WHERE user_id = p_user_id
    AND task_id = p_task_id
  ORDER BY completed_at DESC
  LIMIT 1;
  
  -- If no completion found, user can complete
  IF last_completion_date IS NULL THEN
    RETURN TRUE;
  END IF;
  
  -- If last completion was before today, user can complete
  IF last_completion_date < today_date THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise, user already completed today
  RETURN FALSE;
END;
$$;

-- Create function to increment user points
CREATE OR REPLACE FUNCTION increment_points(
  user_id UUID,
  points_to_add INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET 
    points = COALESCE(points, 0) + points_to_add,
    updated_at = NOW()
  WHERE id = user_id;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION can_complete_daily_task(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_points(UUID, INTEGER) TO authenticated;
