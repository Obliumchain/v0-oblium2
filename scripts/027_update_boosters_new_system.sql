-- Update booster system with new pricing and add combo packages
-- Base mining points: 4000
-- All boosters last 5 days (120 hours)
-- This script ONLY updates existing boosters, no deletions

BEGIN;

-- Update existing multiplier boosters with new prices
UPDATE boosters SET 
  price_sol = 0.035,
  duration_hours = 120,
  description = 'Double your mining rewards (2×) for 5 days',
  multiplier_value = 2,
  type = 'multiplier',
  active = true
WHERE name ILIKE '%2x%' OR name ILIKE '%x2%' OR multiplier_value = 2;

UPDATE boosters SET 
  price_sol = 0.045,
  duration_hours = 120,
  description = 'Triple your mining rewards (3×) for 5 days',
  multiplier_value = 3,
  type = 'multiplier',
  active = true
WHERE name ILIKE '%3x%' OR name ILIKE '%x3%' OR multiplier_value = 3;

UPDATE boosters SET 
  price_sol = 0.065,
  duration_hours = 120,
  description = 'Multiply your rewards by 5× for 5 days',
  multiplier_value = 5,
  type = 'multiplier',
  active = true
WHERE name ILIKE '%5x%' OR name ILIKE '%x5%' OR multiplier_value = 5;

UPDATE boosters SET 
  price_sol = 0.09,
  duration_hours = 120,
  description = 'Multiply your rewards by 10× for 5 days',
  multiplier_value = 10,
  type = 'multiplier',
  active = true
WHERE name ILIKE '%10x%' OR name ILIKE '%x10%' OR multiplier_value = 10;

-- Update auto-claim booster with new price
UPDATE boosters SET 
  price_sol = 0.04,
  duration_hours = 120,
  description = 'Automatically claim mining rewards every 4 hours for 5 days',
  type = 'auto_claim',
  multiplier_value = 1,
  active = true
WHERE type = 'auto_claim' OR name ILIKE '%auto%claim%';

-- Insert combo packages if they don't exist
INSERT INTO boosters (name, description, type, multiplier_value, duration_hours, price_sol, active)
SELECT 'x5 + Auto-Claim (5d)', 'Get 5× mining rewards + automatic claiming for 5 days', 'combo', 5, 120, 0.06, true
WHERE NOT EXISTS (SELECT 1 FROM boosters WHERE name = 'x5 + Auto-Claim (5d)');

INSERT INTO boosters (name, description, type, multiplier_value, duration_hours, price_sol, active)
SELECT 'x10 + Auto-Claim (5d)', 'Get 10× mining rewards + automatic claiming for 5 days', 'combo', 10, 120, 0.085, true
WHERE NOT EXISTS (SELECT 1 FROM boosters WHERE name = 'x10 + Auto-Claim (5d)');

COMMIT;

-- Verify the updates
SELECT name, type, price_sol, duration_hours, multiplier_value 
FROM boosters 
ORDER BY 
  CASE 
    WHEN type = 'multiplier' THEN 1 
    WHEN type = 'auto_claim' THEN 2 
    WHEN type = 'combo' THEN 3 
  END,
  multiplier_value;
