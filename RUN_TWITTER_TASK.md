# Twitter Engagement Task Setup

Run this SQL script in your Supabase SQL Editor to add the Twitter engagement task:

\`\`\`sql
-- Add Twitter engagement task for like, repost, and share
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
  'Like & Repost on X',
  'Like and repost our tweet, then share with 5 friends to earn points!',
  1000,
  'twitter_engagement',
  '🐦',
  'https://x.com/theobliumchain/status/1987890962887053575?s=46',
  true,
  false,
  NOW(),
  NOW()
)
ON CONFLICT DO NOTHING;
\`\`\`

## How it works:

1. **Like & Repost**: When users click "Complete", it opens the tweet in a new tab for them to like and repost
2. **Share with Friends**: A share button automatically copies their referral link (`https://www.obliumtoken.com?ref=THEIR_CODE`) and opens X to share
3. **Reward**: Users earn 1000 points for completing this task
4. **One-time**: This is not a daily task, users can only complete it once
