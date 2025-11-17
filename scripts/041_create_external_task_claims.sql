-- Create table to track daily claims from external task app
CREATE TABLE IF NOT EXISTS public.external_task_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  task_identifier TEXT NOT NULL, -- identifier from external task app
  points_awarded INTEGER NOT NULL,
  claim_date DATE NOT NULL, -- date in California timezone
  claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  task_data JSONB, -- additional task metadata
  UNIQUE(user_id, task_identifier, claim_date) -- one claim per task per day
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_external_task_claims_user_date 
  ON public.external_task_claims(user_id, claim_date);

CREATE INDEX IF NOT EXISTS idx_external_task_claims_task_date 
  ON public.external_task_claims(task_identifier, claim_date);

-- RLS Policies
ALTER TABLE public.external_task_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS external_task_claims_select_own ON public.external_task_claims;
CREATE POLICY external_task_claims_select_own ON public.external_task_claims
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS external_task_claims_insert_own ON public.external_task_claims;
CREATE POLICY external_task_claims_insert_own ON public.external_task_claims
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to process external task claim with California timezone
CREATE OR REPLACE FUNCTION process_external_task_claim(
  p_user_id UUID,
  p_task_identifier TEXT,
  p_points INTEGER,
  p_task_data JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  points_awarded INTEGER,
  total_points BIGINT,
  claim_id UUID
) AS $$
DECLARE
  v_california_date DATE;
  v_existing_claim UUID;
  v_claim_id UUID;
  v_new_points BIGINT;
BEGIN
  -- Get current date in California timezone (America/Los_Angeles)
  v_california_date := (NOW() AT TIME ZONE 'America/Los_Angeles')::DATE;
  
  -- Check if user already claimed this task today
  SELECT id INTO v_existing_claim
  FROM public.external_task_claims
  WHERE user_id = p_user_id 
    AND task_identifier = p_task_identifier
    AND claim_date = v_california_date;
  
  IF v_existing_claim IS NOT NULL THEN
    -- Already claimed today
    RETURN QUERY SELECT 
      false,
      'Task already claimed today. Come back tomorrow!'::TEXT,
      0,
      (SELECT points FROM public.profiles WHERE id = p_user_id),
      v_existing_claim;
    RETURN;
  END IF;
  
  -- Validate points (must be positive and reasonable)
  IF p_points <= 0 OR p_points > 100000 THEN
    RETURN QUERY SELECT 
      false,
      'Invalid points amount'::TEXT,
      0,
      (SELECT points FROM public.profiles WHERE id = p_user_id),
      NULL::UUID;
    RETURN;
  END IF;
  
  -- Record the claim
  INSERT INTO public.external_task_claims (
    user_id,
    task_identifier,
    points_awarded,
    claim_date,
    task_data
  ) VALUES (
    p_user_id,
    p_task_identifier,
    p_points,
    v_california_date,
    p_task_data
  )
  RETURNING id INTO v_claim_id;
  
  -- Award points to user
  UPDATE public.profiles
  SET points = points + p_points,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING points INTO v_new_points;
  
  -- Return success
  RETURN QUERY SELECT 
    true,
    'Points awarded successfully!'::TEXT,
    p_points,
    v_new_points,
    v_claim_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION process_external_task_claim TO authenticated;

-- Add comments
COMMENT ON TABLE public.external_task_claims IS 'Tracks daily task claims from external task.obliumtoken.com app';
COMMENT ON FUNCTION process_external_task_claim IS 'Processes external task claims with California timezone daily limits';
