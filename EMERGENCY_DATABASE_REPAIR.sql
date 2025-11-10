-- ===================================
-- EMERGENCY DATABASE REPAIR SCRIPT
-- Run this in Supabase SQL Editor if users can't see their points
-- ===================================

-- 1. Verify profiles table structure
DO $$
BEGIN
    -- Add missing columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'points') THEN
        ALTER TABLE profiles ADD COLUMN points BIGINT DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'nickname') THEN
        ALTER TABLE profiles ADD COLUMN nickname TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'wallet_address') THEN
        ALTER TABLE profiles ADD COLUMN wallet_address TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'mining_started_at') THEN
        ALTER TABLE profiles ADD COLUMN mining_started_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'last_claim_at') THEN
        ALTER TABLE profiles ADD COLUMN last_claim_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'task_completion_bonus_awarded') THEN
        ALTER TABLE profiles ADD COLUMN task_completion_bonus_awarded BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                  WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Fix RLS policies
DROP POLICY IF EXISTS profiles_select_own ON profiles;
DROP POLICY IF EXISTS profiles_select_referral_codes ON profiles;
DROP POLICY IF EXISTS profiles_select_leaderboard ON profiles;
DROP POLICY IF EXISTS profiles_update_own ON profiles;
DROP POLICY IF EXISTS profiles_insert_own ON profiles;

-- Allow users to read ALL profiles
CREATE POLICY profiles_select_all ON profiles FOR SELECT USING (true);

-- Allow users to update only their own profile
CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (auth.uid() = id);

-- Allow users to insert only their own profile  
CREATE POLICY profiles_insert_own ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_points ON profiles(points DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_nickname ON profiles(nickname);
CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles(referral_code);

-- 4. Grant permissions
GRANT SELECT ON profiles TO anon, authenticated;
GRANT UPDATE ON profiles TO authenticated;
GRANT INSERT ON profiles TO authenticated;

-- 5. Verify repair
DO $$
DECLARE
    profile_count INTEGER;
    avg_points NUMERIC;
BEGIN
    SELECT COUNT(*), COALESCE(AVG(points), 0) 
    INTO profile_count, avg_points 
    FROM profiles;
    
    RAISE NOTICE 'Database repair complete!';
    RAISE NOTICE 'Total profiles: %', profile_count;
    RAISE NOTICE 'Average points: %', avg_points;
END $$;
