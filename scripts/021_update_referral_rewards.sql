-- Update referral rewards: both referrer and referee get 500 points
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
BEGIN
  RAISE LOG 'Processing referral for code: % and user: %', p_referrer_code, p_new_user_id;
  
  -- Check if referral code exists and get referrer ID
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referrer_code;
  
  IF v_referrer_id IS NULL THEN
    RAISE LOG 'Referrer not found for code: %', p_referrer_code;
    RETURN FALSE;
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = p_new_user_id THEN
    RAISE LOG 'Self-referral attempted for user: %', p_new_user_id;
    RETURN FALSE;
  END IF;
  
  -- Check if referral relationship already exists
  SELECT EXISTS(
    SELECT 1 FROM referrals 
    WHERE referred_user_id = p_new_user_id
  ) INTO v_referral_exists;
  
  IF v_referral_exists THEN
    RAISE LOG 'User % already has a referral', p_new_user_id;
    RETURN FALSE;
  END IF;
  
  -- Insert referral relationship
  INSERT INTO referrals (referrer_id, referred_user_id)
  VALUES (v_referrer_id, p_new_user_id);
  
  RAISE LOG 'Referral relationship created between % and %', v_referrer_id, p_new_user_id;
  
  -- Award 500 points to referrer (person who shared the code)
  UPDATE profiles
  SET points = points + 500
  WHERE id = v_referrer_id;
  
  -- Award 500 points to new user (person who used the code)
  UPDATE profiles
  SET points = points + 500
  WHERE id = p_new_user_id;
  
  RAISE LOG 'Referral rewards awarded: 500 to referrer %, 500 to new user %', v_referrer_id, p_new_user_id;
  
  RETURN TRUE;
END;
$$;
