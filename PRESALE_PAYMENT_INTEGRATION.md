# Presale Payment Integration Guide

## Overview
This guide explains how to integrate your payment app with the Oblium presale token purchase system.

## Webhook Endpoint
Your payment app should send webhooks to:
\`\`\`
POST https://obliumtoken.com/api/webhooks/presale
\`\`\`

## Authentication
All webhook requests must include an HMAC SHA256 signature for security.

### Generating the Signature
\`\`\`javascript
const crypto = require('crypto');

// 1. Stringify the payload
const payload = JSON.stringify({
  userId: "user-uuid",
  amountUsd: 50,
  tokensAmount: 2500,
  // ... other fields
});

// 2. Generate HMAC signature using your WEBHOOK_SECRET
const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(payload)
  .digest('hex');

// 3. Include signature in headers
headers: {
  'Content-Type': 'application/json',
  'x-webhook-signature': signature
}
\`\`\`

## Webhook Payload Structure

### Required Fields
\`\`\`typescript
{
  userId: string;              // UUID of the user making purchase
  amountUsd: number;          // Total amount paid in USD
  tokensAmount: number;       // Number of OBLM tokens purchased
  paymentId: string;          // Unique payment transaction ID
  status: "completed" | "success";  // Payment status
  amountSol: number;          // Amount paid in SOL
  transactionHash?: string;   // Solana transaction hash (optional)
  timestamp?: string;         // ISO timestamp (optional)
}
\`\`\`

### Example Payload
\`\`\`json
{
  "userId": "f5ed2686-ec12-49b4-94c1-e0971a3dcc1e",
  "amountUsd": 50,
  "tokensAmount": 2500,
  "paymentId": "presale_20250116_123456",
  "status": "completed",
  "amountSol": 0.15,
  "transactionHash": "5j6k7l8m9n0p1q2r3s4t5u6v7w8x9y0z1a2b3c4d5e6f7g8h9i0j",
  "timestamp": "2025-01-16T12:34:56.789Z"
}
\`\`\`

## Presale Purchase Flow

### 1. User Initiates Purchase
User visits the presale page at `/ghjkloiuyt` and selects their purchase amount:
- Minimum: $7 (0.05 SOL)
- Token price: $0.02 per OBLM
- Example: $50 = 2,500 OBLM tokens

### 2. Redirect to Payment App
The user is redirected to your payment app with the following URL parameters:
\`\`\`
https://your-payment-app.com/pay?userId={userId}&amount={amountSol}&returnUrl={returnUrl}&metadata={metadata}
\`\`\`

Example:
\`\`\`
https://your-payment-app.com/pay?userId=f5ed2686-ec12-49b4-94c1-e0971a3dcc1e&amount=0.15&returnUrl=https://obliumtoken.com/ghjkloiuyt/success&metadata=presale_2500_tokens
\`\`\`

### 3. Process Payment
Your payment app:
1. Shows the user the payment details
2. Processes the SOL payment
3. Confirms the transaction on Solana blockchain

### 4. Send Webhook
After successful payment, send a webhook to:
\`\`\`
POST https://obliumtoken.com/api/webhooks/presale
\`\`\`

With the payload structure shown above.

### 5. User Receives Tokens
The Oblium system will:
1. Verify the webhook signature
2. Validate the payment amount
3. Calculate tokens: `tokensAmount = (amountUsd / 0.02)`
4. Credit `oblm_token_balance` in user's profile
5. Record the transaction in `presale_transactions` table
6. Redirect user back to success page

## Response Format

### Success Response
\`\`\`json
{
  "success": true,
  "message": "Presale tokens credited successfully",
  "transaction": {
    "id": "transaction-uuid",
    "userId": "user-uuid",
    "tokensAmount": 2500,
    "amountUsd": 50
  }
}
\`\`\`

### Error Responses

**Invalid Signature (401)**
\`\`\`json
{
  "error": "Invalid signature",
  "errorId": "abc123"
}
\`\`\`

**Missing Fields (400)**
\`\`\`json
{
  "error": "Missing required fields",
  "errorId": "def456"
}
\`\`\`

**Invalid Amount (400)**
\`\`\`json
{
  "error": "Amount below minimum ($7)",
  "errorId": "ghi789"
}
\`\`\`

**Duplicate Transaction (200)**
\`\`\`json
{
  "message": "Transaction already processed",
  "errorId": "jkl012"
}
\`\`\`

## Implementation Example

### Node.js/Express
\`\`\`javascript
const crypto = require('crypto');
const axios = require('axios');

async function notifyPresalePurchase(paymentData) {
  const webhookUrl = 'https://obliumtoken.com/api/webhooks/presale';
  const webhookSecret = process.env.WEBHOOK_SECRET;
  
  const payload = {
    userId: paymentData.userId,
    amountUsd: paymentData.amountUsd,
    tokensAmount: paymentData.amountUsd / 0.02, // $0.02 per token
    paymentId: paymentData.paymentId,
    status: 'completed',
    amountSol: paymentData.amountSol,
    transactionHash: paymentData.transactionHash,
    timestamp: new Date().toISOString()
  };
  
  const body = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');
  
  try {
    const response = await axios.post(webhookUrl, payload, {
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature
      }
    });
    
    console.log('Webhook sent successfully:', response.data);
    return response.data;
  } catch (error) {
    console.error('Webhook failed:', error.response?.data || error.message);
    throw error;
  }
}

// Usage after successful payment
await notifyPresalePurchase({
  userId: 'f5ed2686-ec12-49b4-94c1-e0971a3dcc1e',
  amountUsd: 50,
  amountSol: 0.15,
  paymentId: 'presale_20250116_123456',
  transactionHash: '5j6k7l8m...'
});
\`\`\`

## Environment Variables Required

Your payment app needs:
- `WEBHOOK_SECRET` - Shared secret for signing webhooks (same as Oblium's WEBHOOK_SECRET)
- `OBLIUM_WEBHOOK_URL` - Set to `https://obliumtoken.com/api/webhooks/presale`

## Testing

### Test Webhook Locally
\`\`\`bash
curl -X POST http://localhost:3000/api/webhooks/presale \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: YOUR_SIGNATURE_HERE" \
  -d '{
    "userId": "test-user-uuid",
    "amountUsd": 50,
    "tokensAmount": 2500,
    "paymentId": "test_payment_123",
    "status": "completed",
    "amountSol": 0.15,
    "timestamp": "2025-01-16T12:00:00.000Z"
  }'
\`\`\`

### Test Success Flow
1. Visit `/ghjkloiuyt` on Oblium
2. Select purchase amount (minimum $7)
3. Click "Buy OBLM Tokens"
4. Complete payment in your payment app
5. Verify webhook is sent with correct signature
6. Check user's profile for updated `oblm_token_balance`

## Security Notes

1. **Always verify the webhook signature** - This prevents unauthorized token credits
2. **Implement idempotency** - Check for duplicate `paymentId` to prevent double-credits
3. **Validate amounts** - Ensure payment amount matches expected token amount
4. **Use HTTPS** - All webhook communications must use HTTPS in production
5. **Keep WEBHOOK_SECRET secure** - Never expose this in client-side code or logs

## Support

For integration issues or questions, contact the Oblium development team with:
- Error ID from failed webhooks
- Payment transaction details
- Webhook request/response logs
