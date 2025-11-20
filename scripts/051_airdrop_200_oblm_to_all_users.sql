-- Airdrop 200 OBLM tokens to all existing users
-- This is a one-time bonus and is exempt from the 900,000,000 total supply

-- Add 200 OBLM tokens to all users who currently have less than 200 tokens
-- This prevents duplicate airdrops if script is run multiple times
UPDATE profiles
SET oblm_token_balance = COALESCE(oblm_token_balance, 0) + 200,
    updated_at = NOW()
WHERE COALESCE(oblm_token_balance, 0) < 200;

-- Optional: Log the airdrop for record keeping
-- You can uncomment this if you want to track the airdrop
/*
INSERT INTO user_activities (user_id, activity_type, details, created_at)
SELECT 
    id as user_id,
    'airdrop' as activity_type,
    jsonb_build_object(
        'amount', 200,
        'token', 'OBLM',
        'reason', 'Initial user bonus - exempt from total supply'
    ) as details,
    NOW() as created_at
FROM profiles
WHERE COALESCE(oblm_token_balance, 0) >= 200;
*/

-- Verify the update
SELECT 
    COUNT(*) as total_users,
    SUM(oblm_token_balance) as total_oblm_distributed,
    AVG(oblm_token_balance) as average_oblm_per_user,
    MIN(oblm_token_balance) as min_balance,
    MAX(oblm_token_balance) as max_balance
FROM profiles;
