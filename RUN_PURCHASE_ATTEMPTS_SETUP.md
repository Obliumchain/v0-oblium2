# Purchase Attempts Table Setup

Run this SQL script in your Supabase SQL Editor to create the purchase_attempts tracking table:

## SQL Script Location
`scripts/039_create_purchase_attempts_table.sql`

## What This Does
- Creates a `purchase_attempts` table to track all booster purchase attempts
- Records both successful and failed purchases with detailed error information
- Enables admins to view all purchase attempts for debugging
- Tracks wallet addresses, transaction hashes, and error codes

## Features
- Tracks purchase status: initiated, pending, failed, completed
- Stores error messages and codes for failed attempts
- Links to users, boosters, and wallet information
- Includes timestamps for analytics

## After Running
You can query failed purchases with:
\`\`\`sql
SELECT * FROM purchase_attempts 
WHERE status = 'failed' 
ORDER BY created_at DESC;
\`\`\`

This helps identify and debug authentication and payment issues.
