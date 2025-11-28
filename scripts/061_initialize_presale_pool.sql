-- Initialize the presale pool with 900 million OBLM tokens
-- This tracks the total supply available for presale

-- First, check if a presale pool already exists
DO $$
BEGIN
  -- If no pool exists, create one
  IF NOT EXISTS (SELECT 1 FROM presale_pool LIMIT 1) THEN
    INSERT INTO presale_pool (
      total_tokens,
      tokens_sold,
      tokens_remaining,
      current_price,
      created_at,
      updated_at
    ) VALUES (
      900000000,  -- 900 million tokens for presale
      0,          -- No tokens sold yet
      900000000,  -- All tokens remaining
      0.02,       -- $0.02 per token
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Presale pool initialized with 900,000,000 tokens';
  ELSE
    RAISE NOTICE 'Presale pool already exists';
  END IF;
END $$;

-- Verify the pool was created
SELECT 
  total_tokens,
  tokens_sold,
  tokens_remaining,
  current_price,
  created_at
FROM presale_pool;
