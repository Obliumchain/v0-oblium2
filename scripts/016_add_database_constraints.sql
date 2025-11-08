-- Add database constraints for production integrity

-- Ensure wallet addresses are unique across profiles
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_wallet_address 
ON profiles(wallet_address) 
WHERE wallet_address IS NOT NULL;

-- Ensure referral codes are unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_referral_code 
ON profiles(referral_code);

-- Prevent duplicate task completions (additional safety)
CREATE UNIQUE INDEX IF NOT EXISTS idx_task_completions_user_task 
ON task_completions(user_id, task_id);

-- Prevent duplicate referrals
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_referred_user 
ON referrals(referred_user_id);

-- Ensure transaction hashes are unique to prevent double-spending
CREATE UNIQUE INDEX IF NOT EXISTS idx_booster_tx_hash 
ON booster_transactions(wallet_tx_hash) 
WHERE wallet_tx_hash IS NOT NULL;

-- Add check constraint for positive points
ALTER TABLE profiles 
ADD CONSTRAINT check_points_positive 
CHECK (points >= 0);

-- Add check constraint for positive booster prices
ALTER TABLE boosters 
ADD CONSTRAINT check_price_positive 
CHECK (price_sol > 0);

-- Add check constraint for positive task rewards
ALTER TABLE tasks 
ADD CONSTRAINT check_reward_positive 
CHECK (reward > 0);

-- Add check constraint for valid booster duration
ALTER TABLE boosters 
ADD CONSTRAINT check_duration_positive 
CHECK (duration_hours > 0);

-- Add performance indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_profiles_points 
ON profiles(points DESC);

CREATE INDEX IF NOT EXISTS idx_user_boosters_user_expires 
ON user_boosters(user_id, expires_at);

CREATE INDEX IF NOT EXISTS idx_task_completions_user 
ON task_completions(user_id);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer 
ON referrals(referrer_id);

-- Add comment for documentation
COMMENT ON TABLE profiles IS 'User profiles with points, wallets, and referral tracking';
COMMENT ON TABLE boosters IS 'Available mining boosters with duration and multiplier';
COMMENT ON TABLE user_boosters IS 'Active boosters assigned to users';
COMMENT ON TABLE tasks IS 'Available tasks that award points';
COMMENT ON TABLE task_completions IS 'Record of completed tasks by users';
COMMENT ON TABLE referrals IS 'Referral relationships between users';
COMMENT ON TABLE booster_transactions IS 'Purchase transactions for boosters';
