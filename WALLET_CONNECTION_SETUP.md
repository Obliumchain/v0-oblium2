# Wallet Connection Setup for connect.obliumtoken.com

## Environment Variables

Configure these environment variables on the wallet connection app:

### 1. WEBHOOK_URL
\`\`\`
https://obliumtoken.com/api/webhooks/wallet-connect
\`\`\`
This is where the wallet app sends the POST request with wallet data.

### 2. WEBHOOK_SECRET
Use the same secret value as your main Oblium app for security verification.

### 3. REDIRECT_URL (Alternative Option)

**Option A: Use the callback endpoint (recommended)**
\`\`\`
https://obliumtoken.com/api/wallet-callback
\`\`\`

**Option B: Direct redirect to page**
\`\`\`
https://obliumtoken.com/ghjkloiuyt
\`\`\`

## Complete Flow

1. User clicks "Connect Wallet" on obliumtoken.com/ghjkloiuyt
2. User is redirected to connect.obliumtoken.com with userId parameter
3. User connects their Solana wallet
4. Wallet app sends POST to `https://obliumtoken.com/api/webhooks/wallet-connect`:
   \`\`\`json
   {
     "userId": "xxx",
     "walletAddress": "xxx",
     "walletType": "solana",
     "timestamp": 1234567890
   }
   \`\`\`
5. Main app receives webhook, saves wallet, awards 150 OBLM tokens
6. Wallet app redirects user browser to:
   - **Option A**: `https://obliumtoken.com/api/wallet-callback?success=true&userId=xxx`
   - **Option B**: `https://obliumtoken.com/ghjkloiuyt?wallet=connected&userId=xxx`

## Direct Redirect (Simpler Option)

If the callback endpoint has issues, use direct redirect:

**Success:**
\`\`\`
https://obliumtoken.com/ghjkloiuyt?wallet=connected&userId={userId}
\`\`\`

**Failure:**
\`\`\`
https://obliumtoken.com/ghjkloiuyt?wallet=failed&userId={userId}
\`\`\`

This skips the callback endpoint and goes straight to the page where the wallet tile will show the connection status.
