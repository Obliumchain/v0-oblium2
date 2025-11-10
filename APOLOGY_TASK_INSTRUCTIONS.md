# Apology Task Setup Instructions

## What This Does
Creates a special task that awards all users 10,000 points as compensation for recent downtime.

## Setup Steps

1. **Run the SQL Script**
   - Go to Supabase Dashboard → SQL Editor
   - Copy and paste the contents of `scripts/029_add_apology_task.sql`
   - Click Run

2. **Task Details**
   - **Title:** "Downtime Compensation"
   - **Reward:** 10,000 points
   - **Icon:** 🎁
   - **Type:** Special (one-time task)
   - **Duration:** 2 days

3. **Auto-Deactivation After 2 Days**

   You have two options:

   **Option A: Manual Deactivation (Simple)**
   - After 2 days, go to Supabase SQL Editor
   - Run this command:
     \`\`\`sql
     SELECT deactivate_apology_task();
     \`\`\`

   **Option B: Automatic Deactivation (Recommended)**
   - In Supabase Dashboard, go to Database → Cron Jobs (if available in your plan)
   - Create a new cron job that runs the `deactivate_apology_task()` function
   - Set it to run once 2 days from now

   **Option C: Alternative Automatic Method**
   - Set a calendar reminder for 2 days
   - Run the deactivation command manually when reminded

## How Users Will See It

- The task will appear in the Tasks page with a special gift icon 🎁
- Users click "Complete" to instantly receive 10,000 points
- No external action required - instant reward
- After 2 days, the task will no longer appear for new users

## Verification

After running the script, verify it worked:

\`\`\`sql
SELECT title, reward, active, created_at 
FROM tasks 
WHERE title = 'Downtime Compensation';
\`\`\`

You should see the task with 10,000 reward and active = true.
