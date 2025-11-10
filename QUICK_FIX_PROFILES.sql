-- Quick fix for profiles table RLS and missing data
-- Run this in Supabase SQL Editor

-- Step 1: Ensure RLS policies allow reading profiles
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_select_leaderboard ON profiles;

CREATE POLICY profiles_select_all ON profiles
  FOR SELECT
  USING (true);

-- Step 2: Ensure users can update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Step 3: Verify points column exists (if not, add it)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'points'
  ) THEN
    ALTER TABLE profiles ADD COLUMN points BIGINT DEFAULT 0;
  END IF;
END $$;

-- Step 4: Verify referral_code column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'referral_code'
  ) THEN
    ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
END $$;

-- Done!
SELECT 'Profile table fixed!' as status;
