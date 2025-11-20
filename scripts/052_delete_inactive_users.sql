-- Delete users who have had their account for more than 12 hours with less than 1000 points
-- This script cleans up inactive/low-engagement users

-- First, let's see how many users will be affected
SELECT 
  COUNT(*) as users_to_delete,
  AVG(points) as avg_points,
  MIN(created_at) as oldest_account,
  MAX(created_at) as newest_account
FROM profiles
WHERE created_at < NOW() - INTERVAL '12 hours'
  AND points < 1000;

-- Begin transaction for safety
BEGIN;

-- Store the user IDs that will be deleted for logging
CREATE TEMP TABLE users_to_delete AS
SELECT id, points, created_at, wallet_address, nickname
FROM profiles
WHERE created_at < NOW() - INTERVAL '12 hours'
  AND points < 1000;

-- Log the deletion (optional - comment out if not needed)
SELECT 
  id,
  points,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as account_age_hours,
  wallet_address,
  nickname
FROM users_to_delete
ORDER BY created_at DESC;

-- Delete related data first (to avoid foreign key violations)

-- Delete booster transactions
DELETE FROM booster_transactions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Delete conversion history
DELETE FROM conversion_history
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Delete external task claims
DELETE FROM external_task_claims
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Delete presale transactions
DELETE FROM presale_transactions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Delete purchase attempts
DELETE FROM purchase_attempts
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Delete quiz completions
DELETE FROM quiz_completions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Delete referrals (where they are the referrer)
DELETE FROM referrals
WHERE referrer_id IN (SELECT id FROM users_to_delete);

-- Delete referrals (where they are the referred user)
DELETE FROM referrals
WHERE referred_user_id IN (SELECT id FROM users_to_delete);

-- Delete task completions
DELETE FROM task_completions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Delete user boosters
DELETE FROM user_boosters
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Finally, delete the profiles
DELETE FROM profiles
WHERE id IN (SELECT id FROM users_to_delete);

-- Show deletion summary
SELECT 
  'Total users deleted' as summary,
  COUNT(*) as count
FROM users_to_delete;

-- Clean up temp table
DROP TABLE users_to_delete;

-- Commit the transaction
COMMIT;

-- Verify remaining users
SELECT 
  COUNT(*) as total_remaining_users,
  COUNT(CASE WHEN points < 1000 THEN 1 END) as users_below_1000_points,
  COUNT(CASE WHEN points >= 1000 THEN 1 END) as users_1000_plus_points,
  AVG(points) as avg_points
FROM profiles;
