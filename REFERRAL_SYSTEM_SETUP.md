# Referral System Setup Guide

## Current Status

The referral system code is implemented but requires the database function to be executed in Supabase.

## How the System Works

1. **Profile Creation**: When a user signs up, a unique referral code is automatically generated (format: `REF-xxxxxxxx-xxxx`)
2. **Referral Usage**: New users can enter a referral code during signup
3. **Reward Distribution**: Both the referrer and the new user receive 500 points each
4. **One-time Use**: Each user can only use one referral code, and cannot refer themselves

## Setup Instructions

### Step 1: Run the SQL Script

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy the entire content of `scripts/036_verify_and_fix_referral_system.sql`
5. Paste it into the SQL Editor
6. Click "Run" button
7. Check the output for verification messages

### Step 2: Verify the Setup

You can verify the referral system is working by:

1. Testing the diagnostic API endpoint:
   \`\`\`
   GET /api/referral/check
   \`\`\`
   This will show:
   - Your referral code
   - How many people you've referred
   - Whether you were referred by someone
   - Current points balance

2. Check database directly in Supabase:
   - Go to Table Editor
   - Check the `referrals` table exists
   - Verify `profiles` table has the `referral_code` column

### Step 3: Test the Referral Flow

1. Copy your referral code from the dashboard
2. Open an incognito/private browser window
3. Go to the signup page with `?ref=YOUR_CODE`
4. Create a new account
5. Both accounts should receive 500 points

## Troubleshooting

### Referrals not working?

1. **Function not created**: Run the SQL script in Step 1
2. **Profile creation timing**: The system waits 3 seconds after signup to process referrals
3. **RLS policies**: Ensure authenticated users can insert into the referrals table

### Check the logs

The referral API includes extensive logging. Check your browser console for:
- `[v0][xxxxx] Referral processing API called`
- `[v0][xxxxx] SUCCESS: Referral processed!`

### Common Issues

- **"Invalid referral code"**: The referral code doesn't exist in the database
- **"You have already used a referral code"**: User already used a different referral
- **"You cannot use your own referral code"**: Self-referral attempt
- **"Profile not created"**: Wait a few seconds and try again

## Database Schema

\`\`\`sql
-- Referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY,
  referrer_id UUID REFERENCES profiles(id),
  referred_user_id UUID REFERENCES profiles(id) UNIQUE,
  created_at TIMESTAMP
);

-- Profiles have a referral_code column
ALTER TABLE profiles ADD COLUMN referral_code TEXT UNIQUE;
\`\`\`

## Points Distribution

- **Referrer**: Gets 500 points when someone uses their code
- **New User**: Gets 500 points when they use a referral code
- **Welcome Bonus**: New users start with 10,000 points regardless of referral
- **Total**: Using a referral code means the new user has 10,500 points total

## API Endpoints

- `POST /api/referral/process` - Process a referral code (called automatically during signup)
- `GET /api/referral/check` - Check referral system status for current user
