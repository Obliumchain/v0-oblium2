// ... existing code ...

## Overview

Users can connect their Solana wallet through the wallet connection app (connect.obliumtoken.com), and the wallet address is stored in their Oblium profile. The connection flow uses webhooks for secure communication.

## Flow Diagram

1. User clicks "Connect Wallet" on Oblium app → redirects to `connect.obliumtoken.com`
2. User connects wallet on the external app
3. **External app sends POST webhook** to `obliumtoken.com/api/webhooks/wallet-connect`
4. **External app redirects user** to `obliumtoken.com/api/wallet-callback?success=true&userId=xxx`
5. Callback handler redirects to ghjkloiuyt page showing success

// ... existing code ...

### 2. Webhook Configuration (Server-to-Server)

After wallet connection, send a POST request to:
\`\`\`
https://obliumtoken.com/api/webhooks/wallet-connect
\`\`\`

// ... existing code ...

### 3. Redirect After Connection (User Browser)

After sending the webhook, redirect the user's browser to:
\`\`\`
https://obliumtoken.com/api/wallet-callback?success=true&userId={userId}
\`\`\`

**Parameters:**
- `success`: "true" for successful connection, "false" for failure
- `userId`: The user ID from the original redirect

**Important:** 
- The webhook POST should complete BEFORE redirecting the user
- Do NOT redirect to the webhook URL - use the callback URL instead
- The callback URL accepts GET requests, webhook URL only accepts POST

## Integration URLs

**For connect.obliumtoken.com environment variables:**

\`\`\`env
NEXT_PUBLIC_EXTERNAL_WEBHOOK_URL=https://obliumtoken.com/api/webhooks/wallet-connect
NEXT_PUBLIC_CALLBACK_URL=https://obliumtoken.com/api/wallet-callback
WEBHOOK_SECRET=[your-shared-secret]
\`\`\`

**Flow:**
1. Send POST to `NEXT_PUBLIC_EXTERNAL_WEBHOOK_URL` with wallet data
2. Redirect user browser to `NEXT_PUBLIC_CALLBACK_URL?success=true&userId=xxx`

// ... existing code ...
\`\`\`

```tsx file="" isHidden
