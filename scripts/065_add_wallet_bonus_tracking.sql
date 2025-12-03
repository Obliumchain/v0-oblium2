-- Add wallet_bonus_claimed column to track if user already received the 150 OBLM wallet connection bonus
-- This provides an additional safeguard to ensure users only get the bonus once

-- Add the column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'wallet_bonus_claimed'
    ) THEN
        ALTER TABLE profiles 
        ADD COLUMN wallet_bonus_claimed boolean DEFAULT false;
        
        -- Set to true for users who already have wallet addresses
        UPDATE profiles 
        SET wallet_bonus_claimed = true 
        WHERE wallet_address IS NOT NULL;
        
        RAISE NOTICE 'Added wallet_bonus_claimed column and marked existing wallet users';
    ELSE
        RAISE NOTICE 'Column wallet_bonus_claimed already exists';
    END IF;
END $$;

-- Verify the changes
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN wallet_address IS NOT NULL THEN 1 END) as users_with_wallet,
    COUNT(CASE WHEN wallet_bonus_claimed = true THEN 1 END) as users_with_bonus_claimed
FROM profiles;
