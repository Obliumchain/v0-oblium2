-- Set obliumchain@obliumtoken.com as admin
-- This script will make the user with email obliumchain@obliumtoken.com an admin
-- If the user doesn't exist yet, they need to sign up first with that email

-- Update the profile to set is_admin = true for the user with the specified email
UPDATE profiles
SET is_admin = true, updated_at = now()
WHERE id IN (
  SELECT id 
  FROM auth.users 
  WHERE email = 'obliumchain@obliumtoken.com'
);

-- Verify the admin was set
SELECT 
  p.id,
  u.email,
  p.nickname,
  p.is_admin,
  p.created_at
FROM profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'obliumchain@obliumtoken.com';
