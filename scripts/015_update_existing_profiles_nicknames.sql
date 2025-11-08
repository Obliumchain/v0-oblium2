-- Update existing profiles without nicknames to have default nicknames
UPDATE profiles
SET nickname = 'Miner-' || substr(id::text, 1, 6)
WHERE nickname IS NULL OR nickname = '';
