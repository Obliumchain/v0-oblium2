-- Drop and recreate the referral rewards function with proper error handling
DROP FUNCTION IF EXISTS process_referral_reward(TEXT, UUID);

CREATE OR REPLACE FUNCTION process_referral_reward(
  p_referrer_code TEXT,
  p_new_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_exists BOOLEAN;
  v_new_user_profile_exists BOOLEAN;
BEGIN
  -- Log start of processing
  RAISE LOG 'Starting referral processing - Code: %, New User: %', p_referrer_code, p_new_user_id;
  
  -- Check if new user profile exists first
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = p_new_user_id
  ) INTO v_new_user_profile_exists;
  
  IF NOT v_new_user_profile_exists THEN
    RAISE LOG 'New user profile does not exist yet for: %', p_new_user_id;
    RETURN FALSE;
  END IF;
  
  -- Check if referral code exists and get referrer ID
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referrer_code;
  
  IF v_referrer_id IS NULL THEN
    RAISE LOG 'Referrer not found for code: %', p_referrer_code;
    RETURN FALSE;
  END IF;
  
  RAISE LOG 'Found referrer: % for code: %', v_referrer_id, p_referrer_code;
  
  -- Prevent self-referral
  IF v_referrer_id = p_new_user_id THEN
    RAISE LOG 'Self-referral blocked for user: %', p_new_user_id;
    RETURN FALSE;
  END IF;
  
  -- Check if referral relationship already exists
  SELECT EXISTS(
    SELECT 1 FROM referrals 
    WHERE referred_user_id = p_new_user_id
  ) INTO v_referral_exists;
  
  IF v_referral_exists THEN
    RAISE LOG 'User % already used a referral code', p_new_user_id;
    RETURN FALSE;
  END IF;
  
  -- Insert referral relationship
  INSERT INTO referrals (referrer_id, referred_user_id, created_at)
  VALUES (v_referrer_id, p_new_user_id, NOW());
  
  RAISE LOG 'Referral relationship created: Referrer % -> New User %', v_referrer_id, p_new_user_id;
  
  -- Award 500 points to both users
  UPDATE profiles
  SET points = COALESCE(points, 0) + 500,
      updated_at = NOW()
  WHERE id = v_referrer_id;
  
  RAISE LOG 'Awarded 500 points to referrer: %', v_referrer_id;
  
  UPDATE profiles
  SET points = COALESCE(points, 0) + 500,
      updated_at = NOW()
  WHERE id = p_new_user_id;
  
  RAISE LOG 'Awarded 500 points to new user: %', p_new_user_id;
  
  RAISE LOG 'Referral processing completed successfully';
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in referral processing: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_referral_reward(TEXT, UUID) TO authenticated;

-- Add index on referrals table for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
