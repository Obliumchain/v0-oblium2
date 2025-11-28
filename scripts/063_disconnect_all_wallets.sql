-- Disconnect All Wallets Script
-- This script removes wallet connections from all users

-- Preview: Show all currently connected wallets before disconnecting
SELECT 
  COUNT(*) as total_connected_wallets,
  COUNT(DISTINCT wallet_type) as wallet_types,
  wallet_type,
  COUNT(*) as count_per_type
FROM profiles
WHERE wallet_address IS NOT NULL
GROUP BY wallet_type;

-- Show sample of connected wallets
SELECT 
  id,
  nickname,
  wallet_address,
  wallet_type,
  wallet_connected_at,
  points
FROM profiles
WHERE wallet_address IS NOT NULL
ORDER BY wallet_connected_at DESC
LIMIT 10;

-- Disconnect all wallets
UPDATE profiles
SET 
  wallet_address = NULL,
  wallet_type = NULL,
  wallet_connected_at = NULL
WHERE wallet_address IS NOT NULL;

-- Verification: Show disconnection results
SELECT 
  COUNT(*) as total_users,
  COUNT(wallet_address) as still_connected,
  COUNT(*) - COUNT(wallet_address) as disconnected_successfully
FROM profiles;

-- Show that no wallets are connected anymore
SELECT 
  COUNT(*) as remaining_connected_wallets
FROM profiles
WHERE wallet_address IS NOT NULL;
