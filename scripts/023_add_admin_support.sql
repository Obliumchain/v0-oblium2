-- Add optional admin flag to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = TRUE;

-- If you want to make yourself admin, run this with your user ID:
-- UPDATE profiles SET is_admin = TRUE WHERE id = 'YOUR_USER_ID_HERE';
