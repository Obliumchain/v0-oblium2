-- Create function to handle combo booster purchases
-- Combo boosters automatically activate both multiplier and auto-claim

CREATE OR REPLACE FUNCTION handle_combo_booster_purchase()
RETURNS TRIGGER AS $$
DECLARE
  combo_booster_type text;
  combo_multiplier int;
  combo_duration int;
  combo_expires_at timestamptz;
BEGIN
  -- Check if the purchased booster is a combo type
  SELECT type, multiplier_value, duration_hours
  INTO combo_booster_type, combo_multiplier, combo_duration
  FROM boosters
  WHERE id = NEW.booster_id;
  
  -- If it's a combo booster, also create auto-claim benefit
  IF combo_booster_type = 'combo' THEN
    -- The combo booster itself provides the multiplier
    -- We need to also enable auto_claim for the user
    UPDATE profiles
    SET has_auto_claim = true
    WHERE id = NEW.user_id;
    
    RAISE NOTICE 'Combo booster activated: multiplier % with auto-claim for user %', combo_multiplier, NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS combo_booster_trigger ON user_boosters;

CREATE TRIGGER combo_booster_trigger
  AFTER INSERT ON user_boosters
  FOR EACH ROW
  EXECUTE FUNCTION handle_combo_booster_purchase();
