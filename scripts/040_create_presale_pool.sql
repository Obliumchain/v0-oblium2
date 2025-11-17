-- Create presale pool table to track remaining tokens
CREATE TABLE IF NOT EXISTS public.presale_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  total_tokens NUMERIC NOT NULL DEFAULT 900000000, -- 900 million tokens
  tokens_sold NUMERIC NOT NULL DEFAULT 0,
  tokens_remaining NUMERIC NOT NULL DEFAULT 900000000,
  current_price NUMERIC NOT NULL DEFAULT 0.02, -- $0.02 per token
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert initial presale pool
INSERT INTO public.presale_pool (total_tokens, tokens_sold, tokens_remaining, current_price)
VALUES (900000000, 0, 900000000, 0.02)
ON CONFLICT DO NOTHING;

-- Enable RLS
ALTER TABLE public.presale_pool ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view the presale pool
CREATE POLICY "presale_pool_select_all" ON public.presale_pool
  FOR SELECT
  USING (true);

-- Drop existing function first to avoid return type conflict
DROP FUNCTION IF EXISTS update_presale_pool(NUMERIC);

-- Function to update presale pool after purchase
CREATE FUNCTION update_presale_pool(p_tokens_purchased NUMERIC)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pool_id UUID;
  v_tokens_remaining NUMERIC;
  v_result JSONB;
BEGIN
  -- Get the current pool (there should only be one row)
  SELECT id, tokens_remaining INTO v_pool_id, v_tokens_remaining
  FROM presale_pool
  LIMIT 1;

  -- Check if enough tokens are available
  IF v_tokens_remaining < p_tokens_purchased THEN
    RAISE EXCEPTION 'Not enough tokens available. Remaining: %, Requested: %', v_tokens_remaining, p_tokens_purchased;
  END IF;

  -- Update the pool
  UPDATE presale_pool
  SET 
    tokens_sold = tokens_sold + p_tokens_purchased,
    tokens_remaining = tokens_remaining - p_tokens_purchased,
    updated_at = NOW()
  WHERE id = v_pool_id
  RETURNING 
    jsonb_build_object(
      'total_tokens', total_tokens,
      'tokens_sold', tokens_sold,
      'tokens_remaining', tokens_remaining,
      'current_price', current_price,
      'updated_at', updated_at
    ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Drop existing process_presale_purchase function to avoid conflicts
DROP FUNCTION IF EXISTS process_presale_purchase(UUID, NUMERIC, NUMERIC, NUMERIC, TEXT);

-- Update the existing presale purchase function to use the pool
CREATE FUNCTION process_presale_purchase(
  p_user_id UUID,
  p_amount_sol NUMERIC,
  p_tokens_received NUMERIC,
  p_token_price NUMERIC,
  p_wallet_tx_hash TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_balance NUMERIC;
  v_pool_update JSONB;
BEGIN
  -- First update the presale pool
  v_pool_update := update_presale_pool(p_tokens_received);

  -- Update user's token balance
  UPDATE profiles
  SET oblm_token_balance = COALESCE(oblm_token_balance, 0) + p_tokens_received,
      updated_at = NOW()
  WHERE id = p_user_id
  RETURNING oblm_token_balance INTO v_new_balance;

  -- Record the transaction
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

  -- Return success with pool info
  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'tokens_purchased', p_tokens_received,
    'pool_info', v_pool_update
  );
END;
$$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_presale_pool_tokens_remaining ON public.presale_pool(tokens_remaining);
