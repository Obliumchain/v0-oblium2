-- Add OBLM token balance to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS oblm_token_balance NUMERIC(20, 4) DEFAULT 0 NOT NULL;

COMMENT ON COLUMN profiles.oblm_token_balance IS 'Direct OBLM token balance purchased via presale';

-- Create presale transactions table to track purchases
CREATE TABLE IF NOT EXISTS presale_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount_sol NUMERIC(10, 6) NOT NULL,
  tokens_received NUMERIC(20, 4) NOT NULL,
  token_price NUMERIC(10, 6) NOT NULL,
  wallet_tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE presale_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for presale_transactions
CREATE POLICY presale_transactions_select_own 
  ON presale_transactions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY presale_transactions_insert_own 
  ON presale_transactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_presale_transactions_user_id ON presale_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_presale_transactions_status ON presale_transactions(status);

-- Function to process presale purchase
CREATE OR REPLACE FUNCTION process_presale_purchase(
  p_user_id UUID,
  p_amount_sol NUMERIC,
  p_tokens_received NUMERIC,
  p_token_price NUMERIC,
  p_wallet_tx_hash TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT, new_balance NUMERIC) AS $$
DECLARE
  v_current_balance NUMERIC;
BEGIN
  -- Get current token balance
  SELECT oblm_token_balance INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;

  -- Update profile with new token balance
  UPDATE profiles
  SET oblm_token_balance = oblm_token_balance + p_tokens_received,
      updated_at = NOW()
  WHERE id = p_user_id;

  -- Insert transaction record
  INSERT INTO presale_transactions (
    user_id,
    amount_sol,
    tokens_received,
    token_price,
    wallet_tx_hash,
    status
  ) VALUES (
    p_user_id,
    p_amount_sol,
    p_tokens_received,
    p_token_price,
    p_wallet_tx_hash,
    'completed'
  );

  -- Return success
  RETURN QUERY SELECT TRUE, 'Purchase completed successfully'::TEXT, (v_current_balance + p_tokens_received);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
