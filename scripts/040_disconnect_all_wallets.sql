-- Disconnect all user wallets and reset wallet-related fields
-- This will force all users to reconnect their wallets

UPDATE profiles
SET 
  wallet_address = NULL,
  wallet_type = NULL,
  wallet_connected_at = NULL
WHERE 
  wallet_address IS NOT NULL;

-- Log the number of wallets disconnected
SELECT 
  COUNT(*) as disconnected_wallets_count
FROM profiles
WHERE 
  wallet_address IS NULL
  AND wallet_connected_at IS NOT NULL;
