-- Verify and fix referral system
-- Run this script to ensure referral system is properly set up

-- Step 1: Verify referrals table exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'referrals') THEN
    RAISE NOTICE 'Creating referrals table...';
    
    CREATE TABLE public.referrals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      referrer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      referred_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
      UNIQUE(referred_user_id)
    );
    
    -- Enable RLS
    ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
    
    -- Create policies
    CREATE POLICY "referrals_select_own" ON public.referrals
      FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_user_id);
    
    CREATE POLICY "referrals_insert_own" ON public.referrals
      FOR INSERT WITH CHECK (auth.uid() = referred_user_id);
  ELSE
    RAISE NOTICE 'Referrals table already exists.';
  END IF;
END $$;

-- Step 2: Create or replace the referral reward function
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
  -- Log function call
  RAISE NOTICE 'Processing referral for code: %, user: %', p_referrer_code, p_new_user_id;
  
  -- Check if new user profile exists
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = p_new_user_id
  ) INTO v_new_user_profile_exists;
  
  IF NOT v_new_user_profile_exists THEN
    RAISE NOTICE 'New user profile does not exist';
    RETURN FALSE;
  END IF;
  
  -- Get referrer ID from referral code
  SELECT id INTO v_referrer_id
  FROM profiles
  WHERE referral_code = p_referrer_code;
  
  -- Return false if referral code doesn't exist
  IF v_referrer_id IS NULL THEN
    RAISE NOTICE 'Referral code not found';
    RETURN FALSE;
  END IF;
  
  -- Prevent self-referral
  IF v_referrer_id = p_new_user_id THEN
    RAISE NOTICE 'Self-referral attempt blocked';
    RETURN FALSE;
  END IF;
  
  -- Check if user already used a referral code
  SELECT EXISTS(
    SELECT 1 FROM referrals 
    WHERE referred_user_id = p_new_user_id
  ) INTO v_referral_exists;
  
  IF v_referral_exists THEN
    RAISE NOTICE 'User already used a referral code';
    RETURN FALSE;
  END IF;
  
  -- Insert referral relationship
  INSERT INTO referrals (referrer_id, referred_user_id, created_at)
  VALUES (v_referrer_id, p_new_user_id, NOW());
  
  RAISE NOTICE 'Referral relationship created';
  
  -- Award 500 points to referrer
  UPDATE profiles
  SET points = COALESCE(points, 0) + 500,
      updated_at = NOW()
  WHERE id = v_referrer_id;
  
  RAISE NOTICE 'Awarded 500 points to referrer';
  
  -- Award 500 points to new user  
  UPDATE profiles
  SET points = COALESCE(points, 0) + 500,
      updated_at = NOW()
  WHERE id = p_new_user_id;
  
  RAISE NOTICE 'Awarded 500 points to new user';
  
  RETURN TRUE;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- Step 3: Grant permissions
GRANT EXECUTE ON FUNCTION process_referral_reward(TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION process_referral_reward(TEXT, UUID) TO anon;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_user_id ON referrals(referred_user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- Step 5: Display verification results
DO $$
DECLARE
  func_exists BOOLEAN;
  table_exists BOOLEAN;
  policies_count INT;
BEGIN
  -- Check function
  SELECT EXISTS(
    SELECT 1 FROM pg_proc 
    WHERE proname = 'process_referral_reward'
  ) INTO func_exists;
  
  -- Check table
  SELECT EXISTS(
    SELECT FROM pg_tables 
    WHERE schemaname = 'public' AND tablename = 'referrals'
  ) INTO table_exists;
  
  -- Count policies
  SELECT COUNT(*) INTO policies_count
  FROM pg_policies
  WHERE tablename = 'referrals';
  
  RAISE NOTICE '=== REFERRAL SYSTEM VERIFICATION ===';
  RAISE NOTICE 'Referrals table exists: %', table_exists;
  RAISE NOTICE 'Process function exists: %', func_exists;
  RAISE NOTICE 'RLS policies count: %', policies_count;
  RAISE NOTICE '=================================';
END $$;
