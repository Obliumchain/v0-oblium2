-- Create purchase_attempts table to track all purchase attempts (successful and failed)
CREATE TABLE IF NOT EXISTS purchase_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    booster_id UUID NOT NULL REFERENCES boosters(id) ON DELETE CASCADE,
    wallet_address TEXT NOT NULL,
    wallet_type TEXT,
    amount_sol NUMERIC(10, 6) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('initiated', 'pending', 'failed', 'completed')),
    error_message TEXT,
    error_code TEXT,
    wallet_tx_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS purchase_attempts_user_id_idx ON purchase_attempts(user_id);
CREATE INDEX IF NOT EXISTS purchase_attempts_status_idx ON purchase_attempts(status);
CREATE INDEX IF NOT EXISTS purchase_attempts_created_at_idx ON purchase_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS purchase_attempts_wallet_address_idx ON purchase_attempts(wallet_address);

-- Enable RLS
ALTER TABLE purchase_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY purchase_attempts_select_own ON purchase_attempts
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY purchase_attempts_insert_own ON purchase_attempts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Admin policy to view all attempts
CREATE POLICY purchase_attempts_admin_all ON purchase_attempts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.is_admin = true
        )
    );

COMMENT ON TABLE purchase_attempts IS 'Tracks all booster purchase attempts including failures for debugging and analytics';
