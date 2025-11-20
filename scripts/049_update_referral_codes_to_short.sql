-- Update all existing referral codes to 5-character hexadecimal format
-- and create function to generate short referral codes

-- Function to generate a unique 5-character hexadecimal referral code
CREATE OR REPLACE FUNCTION generate_short_referral_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 5-character hexadecimal code (uppercase)
    new_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 5));
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM profiles WHERE referral_code = new_code) INTO code_exists;
    
    -- If code is unique, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update all existing users with short referral codes
UPDATE profiles 
SET referral_code = generate_short_referral_code()
WHERE referral_code IS NULL OR LENGTH(referral_code) > 5;

-- Create trigger to auto-generate referral codes for new users
CREATE OR REPLACE FUNCTION set_referral_code_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set if not already provided
  IF NEW.referral_code IS NULL OR LENGTH(NEW.referral_code) > 5 THEN
    NEW.referral_code := generate_short_referral_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_referral_code ON profiles;

-- Create trigger for new profile inserts
CREATE TRIGGER trigger_set_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_referral_code_on_insert();
