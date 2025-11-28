# Payment App Webhook Setup Guide

## Overview
After a successful presale purchase, the payment app MUST send a webhook to the Oblium app to credit OBLM tokens to the user's account and update the 900M token pool.

## Webhook Endpoint

\`\`\`
POST https://your-oblium-app.vercel.app/api/webhooks/presale
\`\`\`

## Environment Variables Required

The payment app needs:
\`\`\`env
OBLIUM_WEBHOOK_URL=https://your-oblium-app.vercel.app/api/webhooks/presale
WEBHOOK_SECRET=your-shared-secret-key
\`\`\`

The Oblium app already has:
\`\`\`env
WEBHOOK_SECRET=your-shared-secret-key  # Must match payment app
\`\`\`

## Webhook Payload Structure

Send this JSON payload after successful payment:

\`\`\`typescript
{
  userId: string          // UUID of the user making purchase
  amountUsd: number       // Total USD amount paid (e.g., 10.50)
  tokens: number          // Number of OBLM tokens purchased (e.g., 525)
  transactionId: string   // Unique Solana transaction hash or payment ID
  paymentMethod: string   // "SOL" or payment method used
  status: string          // "completed"
  timestamp: string       // ISO timestamp of payment
}
\`\`\`

## Security: Webhook Signature

For security, sign the webhook with HMAC SHA-256:

\`\`\`typescript
import crypto from 'crypto';

const body = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(body)
  .digest('hex');

// Include signature in headers
headers: {
  'Content-Type': 'application/json',
  'x-webhook-signature': signature
}
\`\`\`

## Complete Example

\`\`\`typescript
// After successful Solana payment in payment app
async function notifyObliumApp(purchaseData) {
  const payload = {
    userId: purchaseData.userId,
    amountUsd: purchaseData.amountUsd,
    tokens: purchaseData.tokensAmount,
    transactionId: purchaseData.solanaTransactionHash,
    paymentMethod: "SOL",
    status: "completed",
    timestamp: new Date().toISOString()
  };

  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  const response = await fetch(process.env.OBLIUM_WEBHOOK_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature
    },
    body
  });

  if (!response.ok) {
    console.error('Webhook failed:', await response.text());
    // Implement retry logic here
    throw new Error('Failed to notify Oblium app');
  }

  return await response.json();
}
\`\`\`

## What Happens When Webhook is Received

1. Verifies webhook signature for security
2. Checks if transaction was already processed (idempotency)
3. Verifies 900M pool has enough tokens available
4. Creates presale transaction record in database
5. Credits OBLM tokens to user's `oblm_token_balance`
6. Deducts tokens from presale pool (`tokens_sold` +, `tokens_remaining` -)
7. Returns success confirmation

## Testing the Webhook

You can test if the webhook is working correctly:

\`\`\`bash
# Call the test endpoint from your Oblium app
curl -X POST https://your-oblium-app.vercel.app/api/webhooks/presale/test
\`\`\`

This will simulate a presale purchase webhook and verify the entire flow works.

## Error Handling

The webhook will return these error codes:

- `200` - Success, tokens credited
- `400` - Invalid payload or insufficient tokens
- `401` - Invalid signature
- `404` - User not found
- `500` - Server error

Always implement retry logic in the payment app:
- Retry up to 3 times with exponential backoff
- Log failures for manual review
- Consider storing pending webhooks in a queue

## Webhook Response

Success response:
\`\`\`json
{
  "success": true,
  "message": "Presale tokens credited successfully",
  "transaction": {
    "userId": "...",
    "tokensAmount": 500,
    "amountUsd": 10,
    "newBalance": 700,
    "transactionId": "...",
    "poolTokensRemaining": 899989185
  }
}
\`\`\`

## Important Notes

1. **Idempotency**: The webhook checks `transactionId` to prevent double-crediting
2. **Minimum Purchase**: $2 minimum enforced
3. **Token Price**: Currently fixed at $0.02 per OBLM token
4. **Pool Tracking**: All purchases deduct from the 900M token supply
5. **Security**: Always include signature header, never send webhooks without it

## Troubleshooting

If tokens aren't being credited:
1. Check webhook is being sent after successful payment
2. Verify `WEBHOOK_SECRET` matches in both apps
3. Ensure signature is calculated correctly
4. Check Oblium app logs for webhook errors
5. Verify user ID exists in database
6. Confirm presale pool was initialized (run script 061)
