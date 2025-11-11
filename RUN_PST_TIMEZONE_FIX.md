# Fix Daily Task Timezone to PST

## Issue
Daily tasks were resetting at 12:00 AM EST instead of 12:00 AM PST.

## Solution
Run the SQL script `scripts/035_fix_daily_task_timezone_pst.sql` in your Supabase SQL Editor.

## Steps

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy and paste the contents of `scripts/035_fix_daily_task_timezone_pst.sql`
5. Click "Run" or press Cmd/Ctrl + Enter

## What it does

- Updates the `can_complete_daily_task()` function to use `America/Los_Angeles` (PST) timezone
- Daily tasks will now reset at 12:00 AM PST (midnight Pacific Time)
- Users can claim daily tasks once every 24 hours, with the reset happening at midnight PST

## Testing

After running the script:
1. Try completing a daily task
2. Wait until after 12:00 AM PST
3. The task should become available again

The frontend code has also been updated to display completion status based on PST timezone.
