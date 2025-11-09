-- Remove welcome bonus and add task completion bonus tracking
-- This script removes the initial 10,000 point bonus and adds tracking for task completion bonus

-- Add column to track if user has received task completion bonus
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS task_completion_bonus_awarded BOOLEAN DEFAULT FALSE;

-- Update the profile creation trigger to start with 0 points
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
DECLARE
  generated_code text;
BEGIN
  -- Generate unique referral code
  generated_code := 'REF-' || substr(new.id::text, 1, 8) || '-' || substr(md5(random()::text), 1, 4);
  
  -- Set initial points to 0 instead of 10,000 - users must complete all tasks for bonus
  INSERT INTO public.profiles (id, first_name, last_name, nickname, referral_code, points, mining_started_at, task_completion_bonus_awarded)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', null),
    coalesce(new.raw_user_meta_data ->> 'last_name', null),
    coalesce(new.raw_user_meta_data ->> 'nickname', 'Miner-' || substr(new.id::text, 1, 6)),
    generated_code,
    0, -- Start with 0 points instead of 10,000
    now(),
    FALSE -- Bonus not awarded yet
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;
