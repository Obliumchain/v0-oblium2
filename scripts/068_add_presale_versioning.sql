-- Add version column to presale_pool to support multiple presale versions
ALTER TABLE presale_pool ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;
ALTER TABLE presale_pool ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE presale_pool ADD COLUMN IF NOT EXISTS version_name TEXT DEFAULT 'Version 1';
ALTER TABLE presale_pool ADD COLUMN IF NOT EXISTS start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE presale_pool ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE;

-- Update existing presale pool record to be version 1
UPDATE presale_pool 
SET version = 1, 
    version_name = 'Presale Version 1',
    is_active = false
WHERE version IS NULL;

-- Create Presale Version 2 with new parameters
INSERT INTO presale_pool (
  version,
  version_name,
  total_tokens,
  tokens_sold,
  tokens_remaining,
  current_price,
  is_active,
  start_date
) VALUES (
  2,
  'Presale Version 2',
  100000000, -- 100 million tokens
  0, -- No tokens sold yet
  100000000, -- All tokens available
  0.02, -- $0.02 per token (same as v1)
  true, -- Active version
  NOW()
);

-- Add version column to presale_transactions to track which version each purchase was made in
ALTER TABLE presale_transactions ADD COLUMN IF NOT EXISTS presale_version INTEGER DEFAULT 1;

-- Add comment for clarity
COMMENT ON COLUMN presale_pool.version IS 'Version number of the presale (1, 2, 3, etc.)';
COMMENT ON COLUMN presale_pool.is_active IS 'Whether this presale version is currently active';
COMMENT ON COLUMN presale_transactions.presale_version IS 'Which presale version this transaction belongs to';
