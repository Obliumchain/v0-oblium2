-- Delete users with 1000 points or less and accounts older than 12 hours
-- This script removes inactive users and all their related data

-- Preview: See which users will be deleted
SELECT 
    id,
    nickname,
    points,
    oblm_token_balance,
    created_at,
    EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as account_age_hours
FROM profiles
WHERE points <= 1000
AND created_at < NOW() - INTERVAL '12 hours'
ORDER BY created_at DESC
LIMIT 50;

-- Count total users to be deleted
SELECT COUNT(*) as users_to_delete
FROM profiles
WHERE points <= 1000
AND created_at < NOW() - INTERVAL '12 hours';

-- Begin transaction
BEGIN;

-- Create temporary table with user IDs to delete
CREATE TEMP TABLE users_to_delete AS
SELECT id
FROM profiles
WHERE points <= 1000
AND created_at < NOW() - INTERVAL '12 hours';

-- Delete related data from all tables (in correct order to avoid foreign key violations)

-- 1. Delete booster transactions
DELETE FROM booster_transactions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 2. Delete user boosters
DELETE FROM user_boosters
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 3. Delete conversion history
DELETE FROM conversion_history
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 4. Delete task completions
DELETE FROM task_completions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 5. Delete external task claims
DELETE FROM external_task_claims
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 6. Delete referrals (both as referrer and referred)
DELETE FROM referrals
WHERE referrer_id IN (SELECT id FROM users_to_delete)
OR referred_user_id IN (SELECT id FROM users_to_delete);

-- 7. Delete quiz completions
DELETE FROM quiz_completions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 8. Delete presale transactions
DELETE FROM presale_transactions
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 9. Delete purchase attempts
DELETE FROM purchase_attempts
WHERE user_id IN (SELECT id FROM users_to_delete);

-- 10. Finally delete the user profiles
DELETE FROM profiles
WHERE id IN (SELECT id FROM users_to_delete);

-- Commit the transaction
COMMIT;

-- Verification: Show summary of remaining users
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN points <= 1000 THEN 1 END) as users_below_1000_points,
    COUNT(CASE WHEN created_at < NOW() - INTERVAL '12 hours' THEN 1 END) as users_older_than_12hrs,
    AVG(points) as avg_points,
    MIN(created_at) as oldest_account,
    MAX(created_at) as newest_account
FROM profiles;

-- Show point distribution after cleanup
SELECT 
    CASE 
        WHEN points <= 500 THEN '0-500'
        WHEN points <= 1000 THEN '501-1000'
        WHEN points <= 5000 THEN '1001-5000'
        WHEN points <= 10000 THEN '5001-10000'
        ELSE '10000+'
    END as point_range,
    COUNT(*) as user_count
FROM profiles
GROUP BY point_range
ORDER BY MIN(points);
