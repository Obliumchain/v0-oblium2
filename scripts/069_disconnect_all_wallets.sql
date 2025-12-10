-- Disconnect all user wallets for reconnection
-- This clears wallet addresses and connection timestamps
-- but preserves wallet_bonus_claimed to prevent duplicate bonuses

UPDATE profiles
SET 
  wallet_address = NULL,
  wallet_type = NULL,
  wallet_connected_at = NULL
WHERE wallet_address IS NOT NULL;

-- Log the number of disconnected wallets
DO $$
DECLARE
  disconnected_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO disconnected_count
  FROM profiles
  WHERE wallet_address IS NULL AND wallet_bonus_claimed = true;
  
  RAISE NOTICE 'Disconnected % wallets. Users can reconnect but will not receive bonus again.', disconnected_count;
END $$;
