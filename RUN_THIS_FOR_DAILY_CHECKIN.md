# Fix Daily Check-In Feature

The daily check-in feature requires database functions that are missing. Follow these steps:

## Step 1: Run the SQL Script

1. Open your **Supabase Dashboard**
2. Go to **SQL Editor**
3. Copy and paste the SQL from `scripts/032_create_task_functions.sql`
4. Click **Run**

## What This Fixes

The script creates two essential database functions:

1. **can_complete_daily_task()** - Checks if a user can complete a daily task today
   - Returns TRUE if the user hasn't completed it today
   - Returns FALSE if already completed today
   - Uses EST timezone for consistency

2. **increment_points()** - Safely adds points to a user's profile
   - Updates the user's points atomically
   - Updates the updated_at timestamp

## After Running

Once you run the script, the daily check-in feature will work:
- Users can complete daily tasks once per day
- Tasks reset at midnight EST
- Points are awarded correctly
- Users see proper feedback messages

## Testing

1. Go to the Tasks page
2. Click on a daily task (marked with "DAILY" badge)
3. Complete it - you should earn points
4. Try completing it again - you should see "Daily task already completed today"
5. Come back tomorrow - it should be available again
