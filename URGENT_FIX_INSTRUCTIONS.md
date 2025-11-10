# URGENT: Fix User Points Not Loading

## Problem
Users can't see their points, referral codes, or leaderboard data. The error is:
\`\`\`
Profile query error: Could not query the database for the schema cache
\`\`\`

## Root Cause
The database had connection pool exhaustion earlier (you exceeded free resources). This may have:
1. Left migrations incomplete
2. Dropped RLS policies
3. Caused schema cache corruption

## Solution

### Step 1: Run Emergency Repair Script
1. Go to https://supabase.com/dashboard
2. Select your Oblium project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy the ENTIRE contents of `EMERGENCY_DATABASE_REPAIR.sql`
6. Paste into the SQL Editor
7. Click **Run** (green button)
8. You should see success messages like:
   \`\`\`
   Database repair complete!
   Total profiles: X
   Average points: Y
   \`\`\`

### Step 2: Verify Fix
1. Open your app: https://obliumtoken.com
2. Go to Profile page
3. Check if points, referral code, and nickname are showing
4. Go to Leaderboard page
5. Check if all users are listed with their points

### Step 3: If Still Broken
Check the browser console (F12) for error messages and send them to me.

## What the Repair Script Does
- Adds any missing columns to the profiles table
- Fixes RLS policies (allows everyone to read profiles for leaderboard)
- Creates missing database indexes
- Grants proper permissions
- Reports database status

## Prevention
You've upgraded to Pro, so this shouldn't happen again. The free tier had:
- Only 4 hours of Fluid Active CPU per month
- Limited connection pool
- Strict rate limits

Pro gives you much more resources.
