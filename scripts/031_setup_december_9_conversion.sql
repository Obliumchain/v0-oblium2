-- Setup automatic point-to-token conversion for December 9th, 2024
-- Conversion rate: 10,000 points = 200 OBLM tokens (50 points per token)
-- This conversion will be triggered automatically on December 9th

-- Create function to convert points to OBLM tokens
CREATE OR REPLACE FUNCTION convert_points_to_oblm_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
DECLARE
  user_record RECORD;
  points_to_convert INTEGER;
  tokens_to_award NUMERIC;
BEGIN
  -- Loop through all users with points
  FOR user_record IN 
    SELECT id, points, wallet_address 
    FROM profiles 
    WHERE points >= 10000
  LOOP
    -- Calculate how many points can be converted (in multiples of 10,000)
    points_to_convert := (user_record.points / 10000) * 10000;
    
    -- Calculate tokens to award (10,000 points = 200 tokens)
    tokens_to_award := (points_to_convert / 10000.0) * 200;
    
    -- Record the conversion in history
    INSERT INTO conversion_history (
      user_id,
      points_converted,
      obl_tokens_received,
      conversion_rate,
      status,
      wallet_tx_hash,
      created_at
    ) VALUES (
      user_record.id,
      points_to_convert,
      tokens_to_award,
      50, -- 50 points per 1 token
      'pending', -- Will be completed when tokens are actually sent
      NULL, -- Will be filled when blockchain transaction completes
      NOW()
    );
    
    -- Deduct converted points from user's balance
    UPDATE profiles 
    SET points = points - points_to_convert
    WHERE id = user_record.id;
    
    RAISE NOTICE 'Converted % points to % OBLM tokens for user %', 
      points_to_convert, tokens_to_award, user_record.id;
  END LOOP;
END;
$$;

-- Create a reminder comment for December 9th
COMMENT ON FUNCTION convert_points_to_oblm_tokens() IS 
'Run this function on December 9th, 2024 to convert all user points to OBLM tokens at rate of 10,000 points = 200 tokens. After running, process pending conversions with blockchain transactions.';

-- Instructions to run on December 9th:
-- SELECT convert_points_to_oblm_tokens();
-- 
-- Then process all pending conversions:
-- SELECT * FROM conversion_history WHERE status = 'pending' ORDER BY created_at;
-- For each pending conversion, send tokens via Solana and update:
-- UPDATE conversion_history SET status = 'completed', wallet_tx_hash = '<tx_hash>' WHERE id = '<conversion_id>';
