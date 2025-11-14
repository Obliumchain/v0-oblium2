# Disconnect All User Wallets

This script will disconnect all user wallets from the database, forcing everyone to reconnect their wallets.

## What it does:
- Sets `wallet_address` to NULL for all users
- Sets `wallet_type` to NULL for all users  
- Sets `wallet_connected_at` to NULL for all users
- This affects ALL users with connected wallets

## How to run:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy the contents of `scripts/040_disconnect_all_wallets.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

## After running:
- All users will see "Connect Wallet" button
- Users will need to reconnect their Phantom/Solflare wallets
- Wallet connection will be fresh and should resolve session issues

## Warning:
This is a disruptive action. All users will be logged out of their wallet connections.
