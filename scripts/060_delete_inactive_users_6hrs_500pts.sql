-- Delete users with less than 500 points and accounts older than 6 hours
-- This is an aggressive cleanup to maintain only engaged users

-- Preview: See which users will be deleted
SELECT 
  id,
  nickname,
  points,
  oblm_token_balance,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_old
FROM profiles
WHERE points < 500
  AND created_at < NOW() - INTERVAL '6 hours'
ORDER BY created_at DESC
LIMIT 20;

-- Count users to be deleted
SELECT COUNT(*) as users_to_delete,
       SUM(points) as total_points_lost,
       SUM(oblm_token_balance) as total_oblm_lost
FROM profiles
WHERE points < 500
  AND created_at < NOW() - INTERVAL '6 hours';

-- Start transaction for safe deletion
BEGIN;

-- Create temporary table with users to delete
CREATE TEMP TABLE users_to_delete AS
SELECT id
FROM profiles
WHERE points < 500
  AND created_at < NOW() - INTERVAL '6 hours';

-- Show count before deletion
SELECT COUNT(*) as total_users_marked_for_deletion FROM users_to_delete;

-- Delete related data in correct order (respecting foreign key constraints)

-- 1. Delete booster transactions
DELETE FROM booster_transactions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 2. Delete user boosters
DELETE FROM user_boosters
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 3. Delete purchase attempts
DELETE FROM purchase_attempts
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 4. Delete conversion history
DELETE FROM conversion_history
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 5. Delete task completions (correct table name)
DELETE FROM task_completions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 6. Delete external task claims
DELETE FROM external_task_claims
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 7. Delete referrals where user was referrer
DELETE FROM referrals
WHERE referrer_id IN (SELECT id FROM users_to_delete);

-- 8. Delete referrals where user was referred
DELETE FROM referrals
WHERE referred_user_id IN (SELECT id FROM users_to_delete);

-- 9. Delete quiz completions
DELETE FROM quiz_completions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 10. Delete presale transactions
DELETE FROM presale_transactions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 11. Finally, delete the user profiles
DELETE FROM profiles
WHERE id IN (SELECT id FROM users_to_delete);

-- Commit the transaction
COMMIT;

-- Verification: Show summary of deletion
SELECT 
  'Cleanup Complete' as status,
  COUNT(*) as remaining_users,
  SUM(CASE WHEN points < 500 THEN 1 ELSE 0 END) as users_under_500_points,
  SUM(CASE WHEN created_at < NOW() - INTERVAL '6 hours' THEN 1 ELSE 0 END) as users_older_than_6hrs
FROM profiles;

-- Show statistics after cleanup
SELECT 
  COUNT(*) as total_users,
  AVG(points) as avg_points,
  MIN(points) as min_points,
  MAX(points) as max_points,
  SUM(oblm_token_balance) as total_oblm_in_circulation
FROM profiles;
