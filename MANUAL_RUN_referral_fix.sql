-- Run this script directly in Supabase SQL Editor
-- Copy the entire content below and paste it into SQL Editor

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS handle_referral(uuid, text);

-- Create the referral rewards function
CREATE OR REPLACE FUNCTION handle_referral(
  new_user_id uuid,
  referral_code_input text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_profile RECORD;
  new_user_profile RECORD;
  existing_referral RECORD;
  result json;
BEGIN
  -- Check if new user profile exists
  SELECT * INTO new_user_profile
  FROM profiles
  WHERE id = new_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'New user profile not found'
    );
  END IF;

  -- Find the referrer by referral code
  SELECT * INTO referrer_profile
  FROM profiles
  WHERE referral_code = referral_code_input;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Invalid referral code'
    );
  END IF;

  -- Prevent self-referral
  IF referrer_profile.id = new_user_id THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Cannot refer yourself'
    );
  END IF;

  -- Check if referral already exists
  SELECT * INTO existing_referral
  FROM referrals
  WHERE referred_user_id = new_user_id;

  IF FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User has already been referred'
    );
  END IF;

  -- Create referral relationship
  INSERT INTO referrals (referrer_id, referred_user_id)
  VALUES (referrer_profile.id, new_user_id);

  -- Award 500 points to referrer
  UPDATE profiles
  SET points = points + 500
  WHERE id = referrer_profile.id;

  -- Award 500 points to new user
  UPDATE profiles
  SET points = points + 500
  WHERE id = new_user_id;

  result := json_build_object(
    'success', true,
    'message', 'You both earned 500 points!',
    'referrer_id', referrer_profile.id,
    'referred_user_id', new_user_id
  );

  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION handle_referral(uuid, text) TO authenticated;
