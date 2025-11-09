# How to Delete a User from Oblium

## Quick Method: Direct SQL Query

Go to your Supabase Dashboard → SQL Editor and run this query:

\`\`\`sql
-- Replace 'user@email.com' with the email of the user you want to delete
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from email
  SELECT id INTO user_id FROM auth.users WHERE email = 'user@email.com';
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'User not found';
    RETURN;
  END IF;
  
  -- Delete all user data
  DELETE FROM task_completions WHERE user_id = user_id;
  DELETE FROM referrals WHERE referrer_id = user_id OR referred_id = user_id;
  DELETE FROM active_boosters WHERE user_id = user_id;
  DELETE FROM profiles WHERE id = user_id;
  DELETE FROM auth.users WHERE id = user_id;
  
  RAISE NOTICE 'User deleted successfully: %', user_id;
END $$;
\`\`\`

## Alternative: Delete by Nickname

\`\`\`sql
-- Replace 'nickname_here' with the user's nickname
DO $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from nickname
  SELECT id INTO user_id FROM profiles WHERE nickname = 'nickname_here';
  
  IF user_id IS NULL THEN
    RAISE NOTICE 'User not found';
    RETURN;
  END IF;
  
  -- Delete all user data
  DELETE FROM task_completions WHERE user_id = user_id;
  DELETE FROM referrals WHERE referrer_id = user_id OR referred_id = user_id;
  DELETE FROM active_boosters WHERE user_id = user_id;
  DELETE FROM profiles WHERE id = user_id;
  DELETE FROM auth.users WHERE id = user_id;
  
  RAISE NOTICE 'User deleted successfully: %', user_id;
END $$;
\`\`\`

## Alternative: Using Admin Panel

If you want to use the admin panel instead:

1. First, make yourself an admin by running this SQL:
\`\`\`sql
-- Replace 'your@email.com' with your admin email
UPDATE profiles 
SET is_admin = TRUE 
WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
\`\`\`

2. Add the is_admin column if it doesn't exist:
\`\`\`sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;
\`\`\`

3. Then visit `yourdomain.com/admin` to access the admin panel

## Finding Suspicious Users

To find users with suspiciously high points:

\`\`\`sql
-- Show top 20 users by points
SELECT 
  nickname,
  email,
  points,
  referral_count,
  created_at,
  last_claim
FROM profiles
ORDER BY points DESC
LIMIT 20;
\`\`\`

To find users who may be botting (claiming too frequently):

\`\`\`sql
-- Find users with unrealistic claim patterns
SELECT 
  nickname,
  email,
  points,
  last_claim,
  EXTRACT(EPOCH FROM (NOW() - created_at))/3600 as hours_since_signup
FROM profiles
WHERE points > 10000 AND created_at > NOW() - INTERVAL '7 days'
ORDER BY points DESC;
