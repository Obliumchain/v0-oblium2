# Presale Repost Task Setup

Run this SQL script in your Supabase SQL Editor to add the new presale repost task:

## SQL Script

\`\`\`sql
-- Add presale repost task for 2000 points
INSERT INTO public.tasks (
  title, 
  description, 
  reward, 
  task_type, 
  icon, 
  action_url,
  active,
  is_daily_repeatable,
  created_at,
  updated_at
) VALUES (
  'Repost Presale Announcement',
  'Help spread the word! Repost our presale announcement on X and earn 2000 points!',
  2000,
  'twitter_engagement',
  '🔥',
  'https://x.com/theobliumchain/status/1988959319681802474?s=46',
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
\`\`\`

## What This Does

1. **Adds a new high-value task** worth 2,000 points
2. **Links to the presale announcement** on X (Twitter)
3. **One-time completion** - users can only complete this once
4. **Automatic popup notification** - users who haven't completed this task will see a popup when they log in

## After Running

- Users will see a popup notification about the new task on their next dashboard visit
- The task will appear in the Tasks page with a 🔥 icon
- Clicking the task opens the tweet and allows users to repost
- Completing the task awards 2,000 points immediately

## Notes

- The popup only shows once per user (tracked in localStorage)
- Only shows for users who haven't completed the task yet
- Users can dismiss the popup and complete the task later
