-- Delete users with less than 1000 points who have been registered for more than 24 hours
-- This script safely removes inactive users and all their associated data

-- PREVIEW: Check how many users will be deleted
SELECT 
  COUNT(*) as users_to_delete,
  SUM(points) as total_points,
  MIN(created_at) as oldest_account,
  MAX(created_at) as newest_account
FROM profiles
WHERE points < 1000
  AND created_at < NOW() - INTERVAL '24 hours';

-- PREVIEW: Show sample of users to be deleted
SELECT 
  id,
  nickname,
  points,
  oblm_token_balance,
  created_at,
  NOW() - created_at as account_age
FROM profiles
WHERE points < 1000
  AND created_at < NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 20;

-- Start transaction for safe deletion
BEGIN;

-- Create temporary table to store IDs of users to delete
CREATE TEMP TABLE users_to_delete AS
SELECT id FROM profiles
WHERE points < 1000
  AND created_at < NOW() - INTERVAL '24 hours';

-- Step 1: Delete booster transactions for these users
DELETE FROM booster_transactions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Step 2: Delete user boosters for these users
DELETE FROM user_boosters
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Step 3: Delete conversion history for these users
DELETE FROM conversion_history
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Step 4: Delete external task claims for these users
DELETE FROM external_task_claims
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Step 5: Delete task completions for these users
DELETE FROM task_completions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Step 6: Delete quiz completions for these users
DELETE FROM quiz_completions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Step 7: Delete referrals where user is the referrer
DELETE FROM referrals
WHERE referrer_id IN (SELECT id FROM users_to_delete);

-- Step 8: Delete referrals where user is the referred user
DELETE FROM referrals
WHERE referred_user_id IN (SELECT id FROM users_to_delete);

-- Step 9: Delete purchase attempts for these users
DELETE FROM purchase_attempts
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Step 10: Delete presale transactions for these users
DELETE FROM presale_transactions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- Step 11: Finally, delete the user profiles
DELETE FROM profiles
WHERE id IN (SELECT id FROM users_to_delete);

-- Drop temporary table
DROP TABLE users_to_delete;

-- Commit the transaction
COMMIT;

-- VERIFICATION: Show deletion summary
SELECT 
  'Deletion Complete' as status,
  COUNT(*) as remaining_users,
  SUM(points) as total_points,
  AVG(points) as avg_points,
  MIN(created_at) as oldest_account
FROM profiles;

-- VERIFICATION: Show users with less than 1000 points that remain (should be only those created in last 24 hours)
SELECT 
  COUNT(*) as low_point_users_remaining,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600) as avg_age_in_hours
FROM profiles
WHERE points < 1000;
