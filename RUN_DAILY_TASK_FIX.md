# Daily Check-In Fix - PST Timezone

## Issue
The daily check-in is not working because the database function `can_complete_daily_task` doesn't exist in the database.

## Solution
This script creates the `can_complete_daily_task` function that checks if a user can complete a daily task based on PST timezone.

## How to Fix

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the SQL Script**
   - Copy the contents of `scripts/037_create_daily_task_function.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Cmd+Enter (Mac) / Ctrl+Enter (Windows)

3. **Verify the Fix**
   - The script should execute successfully
   - Daily check-in tasks will now reset at 12:00 AM PST every day
   - Users can claim their daily rewards once per day

## What This Does

- Creates the `can_complete_daily_task(user_id, task_id)` database function
- Uses PST (America/Los_Angeles) timezone for consistent daily resets
- Checks the `task_completions` table for the user's last completion date
- Returns `true` if the user can complete the task (not completed today)
- Returns `false` if the user already completed the task today

## Testing

After running the script:
1. Go to the Tasks page in your app
2. Try to complete the "Daily Check-In" task
3. It should work and award points
4. Try again immediately - should show "already completed"
5. After 12:00 AM PST, the task should be available again

## Technical Details

The function:
- Uses `SECURITY DEFINER` to run with elevated privileges
- Stores completion date in `YYYY-MM-DD` format
- Compares dates in PST timezone to ensure consistent resets
- Is granted to `authenticated` role for user access
