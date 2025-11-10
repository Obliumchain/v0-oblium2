# How to Run the Referral Fix Script

The database connection pool timeout error happens when trying to run SQL scripts through v0's preview environment. You need to run this script directly in Supabase.

## Steps to Fix Referrals:

1. **Open Supabase Dashboard**
   - Go to https://supabase.com/dashboard
   - Select your Oblium project

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "+ New query"

3. **Copy and Paste the Script**
   - Open the file `MANUAL_RUN_referral_fix.sql`
   - Copy the ENTIRE contents
   - Paste into the SQL Editor

4. **Run the Script**
   - Click the "Run" button (or press Ctrl/Cmd + Enter)
   - Wait for "Success. No rows returned" message

5. **Verify It Worked**
   - Test by having a new user sign up with a referral code
   - Check that both users receive 500 points
   - Verify the referral count updates on profile and leaderboard

## What This Script Does:

- Creates a function that handles referral rewards
- Awards 500 points to the referrer
- Awards 500 points to the new user who used the code
- Prevents self-referrals and duplicate referrals
- Creates the referral relationship in the database

## Troubleshooting:

If you still see errors after running the script:
- Check that the `referrals` table exists
- Verify the `profiles` table has a `referral_code` column
- Make sure both tables have proper permissions
