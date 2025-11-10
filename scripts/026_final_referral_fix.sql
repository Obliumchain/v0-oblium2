-- Complete referral system fix
-- Awards 500 points to both referrer and new user

-- Drop existing function
DROP FUNCTION IF EXISTS process_referral_reward(TEXT, UUID);

-- Create the referral reward function
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
  -- Check if new user profile exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = p_new_user_id
  ) INTO v_new_user_profile_exists;
  
  IF NOT v_new_user_profile_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Get referrer ID from referral code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referrer_code;
  
  -- Return false if referral code doesn't exist
  IF v_referrer_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = p_new_user_id THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user already used a referral code
  SELECT EXISTS(
    SELECT 1 FROM referrals 
    WHERE referred_user_id = p_new_user_id
  ) INTO v_referral_exists;
  
  IF v_referral_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Insert referral relationship
  INSERT INTO referrals (referrer_id, referred_user_id, created_at)
  VALUES (v_referrer_id, p_new_user_id, NOW());
  
  -- Award 500 points to referrer
  UPDATE profiles
  SET points = COALESCE(points, 0) + 500,
      updated_at = NOW()
  WHERE id = v_referrer_id;
  
  -- Award 500 points to new user
  UPDATE profiles
  SET points = COALESCE(points, 0) + 500,
      updated_at = NOW()
  WHERE id = p_new_user_id;
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION process_referral_reward(TEXT, UUID) TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);
