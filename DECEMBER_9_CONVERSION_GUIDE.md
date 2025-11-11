# December 9th OBLM Token Conversion Guide

## Overview

On **December 9th, 2024**, all user points will be automatically converted to OBLM tokens at the following rate:

**10,000 points = 200 OBLM tokens** (50 points per 1 token)

## Current Token Display

Until December 9th:
- Users who completed ALL tasks show **200 OBLM tokens** (from task completion bonus)
- All other users show **0 OBLM tokens**
- Points continue to accumulate normally through mining and tasks

## What Happens on December 9th

1. **Automatic Conversion**
   - Run the conversion function in Supabase SQL Editor:
     \`\`\`sql
     SELECT convert_points_to_oblm_tokens();
     \`\`\`

2. **Process Pending Conversions**
   - Check all pending conversions:
     \`\`\`sql
     SELECT * FROM conversion_history WHERE status = 'pending' ORDER BY created_at;
     \`\`\`

3. **Send Tokens on Solana**
   - For each user in the conversion history:
     - Send the `obl_tokens_received` amount to their `wallet_address`
     - Record the transaction hash
     - Update the conversion record:
       \`\`\`sql
       UPDATE conversion_history 
       SET status = 'completed', wallet_tx_hash = '<transaction_hash>' 
       WHERE id = '<conversion_id>';
       \`\`\`

## After December 9th

- Users will see their OBLM token balance updated
- The conversion function can be run monthly or as needed
- Points will continue to accumulate and can be converted in future conversions

## Important Notes

- Users without wallets connected will have their conversions marked as pending until they connect a wallet
- The 200 tokens from task completion bonus are already included in user accounts
- Only points in multiples of 10,000 will be converted (remainder stays as points)

## Example Conversion

User with 45,000 points:
- Convertible: 40,000 points → 800 OBLM tokens
- Remaining: 5,000 points (stays in account)
