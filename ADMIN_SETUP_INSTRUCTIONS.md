# Admin Setup Instructions

## Making obliumchain@obliumtoken.com an Admin

### Step 1: Sign Up (If Not Already Done)

1. Go to your Oblium app: `https://yourdomain.com/auth`
2. Click "Create account"
3. Enter the following details:
   - **Email**: `obliumchain@obliumtoken.com`
   - **Password**: `Hugob12oss!@#$$12`
   - **Nickname**: Any nickname you prefer (e.g., "Admin" or "ObliumChain")
   - **Referral Code**: Leave blank or use a code if desired
4. Click "CREATE ACCOUNT"
5. You'll be redirected to the dashboard

### Step 2: Set Admin Flag in Database

After signing up, run the SQL script to grant admin privileges:

**Option A: Using v0 (Recommended)**
1. Run the SQL script: `scripts/024_set_admin_user.sql`
2. Click the "Run Script" button in v0

**Option B: Using Supabase Dashboard**
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your Oblium project
3. Navigate to **SQL Editor**
4. Copy and paste the contents of `scripts/024_set_admin_user.sql`
5. Click **Run**
6. Check the results - you should see the admin user with `is_admin = true`

### Step 3: Access Admin Panel

1. Log in with `obliumchain@obliumtoken.com`
2. Navigate to: `https://yourdomain.com/admin`
3. You should now see the admin panel with all users listed
4. You can search for users and delete suspicious accounts

## Security Notes

- Keep the admin password secure
- Change the password after first login if needed
- The admin panel is protected - only users with `is_admin = true` can access it
- Admin privileges allow deleting any user and viewing all user data

## Troubleshooting

**If you can't access the admin panel:**
1. Verify the email is exactly: `obliumchain@obliumtoken.com`
2. Check that the SQL script ran successfully
3. Query the database to verify: 
   \`\`\`sql
   SELECT email, p.is_admin 
   FROM auth.users u 
   JOIN profiles p ON p.id = u.id 
   WHERE email = 'obliumchain@obliumtoken.com';
   \`\`\`
4. Make sure you're logged in with that account

**If the user doesn't exist:**
- Sign up first using the credentials above
- Wait a few seconds for the profile to be created by the trigger
- Then run the SQL script to set admin flag
