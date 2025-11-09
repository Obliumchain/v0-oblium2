# Disable Email Verification in Supabase

To allow users to sign up without email verification:

## Steps:

1. Go to your **Supabase Dashboard**
2. Navigate to **Authentication → Settings**
3. Scroll down to **Email Auth** section
4. Find **"Enable email confirmations"**
5. **Toggle it OFF** (disable it)
6. Click **Save**

## What This Does:

- Users can sign up with email/password and immediately access their account
- No confirmation email will be sent
- Users go directly to the dashboard after signup
- You can re-enable it later when you add SMTP

## Note:

The app is now configured to redirect users directly to the dashboard after signup. This works best with email confirmations disabled in Supabase settings.
