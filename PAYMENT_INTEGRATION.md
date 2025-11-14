# Payment Application Integration Guide

This document explains how to integrate your payment application with Oblium to handle booster purchases.

## Overview

Your payment application will:
1. Receive users redirected from Oblium with purchase details
2. Handle the Solana payment transaction
3. Send a webhook to Oblium after successful payment
4. Redirect user back to Oblium

## Flow Diagram

\`\`\`
User clicks "Buy Booster" → Redirected to Payment App → Payment Processed → Webhook sent to Oblium → User redirected back
\`\`\`

## 1. Receiving Purchase Requests

Users will be redirected to your payment app with these URL parameters:

\`\`\`
https://your-payment-app.com/checkout?userId={userId}&boosterId={boosterId}&amount={amount}&returnUrl={returnUrl}
\`\`\`

**Parameters:**
- `userId` (UUID): The Oblium user ID
- `boosterId` (UUID): The booster they want to purchase
- `amount` (number): Price in SOL
- `returnUrl` (string): URL to redirect user back to Oblium

## 2. Processing Payment

After the user completes the Solana payment in your app:

1. Verify the transaction on the Solana blockchain
2. Send webhook to Oblium (see below)
3. Redirect user back to `returnUrl` with status

## 3. Webhook Integration

### Endpoint

\`\`\`
POST https://obliumtoken.com/api/webhooks/payment
\`\`\`

### Headers

\`\`\`json
{
  "Content-Type": "application/json",
  "x-webhook-signature": "HMAC-SHA256 signature of the request body"
}
\`\`\`

### Request Body

\`\`\`json
{
  "userId": "user-uuid-from-url-params",
  "boosterId": "booster-uuid-from-url-params",
  "paymentId": "unique-payment-id-from-your-system",
  "transactionHash": "solana-transaction-signature",
  "amountSol": 0.1,
  "status": "completed"
}
\`\`\`

**Required Fields:**
- `userId`: The Oblium user ID
- `boosterId`: The booster ID
- `paymentId`: Unique identifier from your payment system
- `amountSol`: Payment amount in SOL
- `status`: Must be "completed" or "success" for processing

**Optional Fields:**
- `transactionHash`: Solana transaction signature (recommended for verification)

### Signature Generation

To secure the webhook, sign the request body with HMAC-SHA256:

\`\`\`javascript
const crypto = require('crypto');

function generateSignature(body, secret) {
  const bodyString = JSON.stringify(body);
  return crypto
    .createHmac('sha256', secret)
    .update(bodyString)
    .digest('hex');
}

// Usage
const webhookSecret = process.env.WEBHOOK_SECRET; // Same secret configured in Oblium
const signature = generateSignature(requestBody, webhookSecret);
\`\`\`

### Response Codes

- `200`: Webhook processed successfully
- `400`: Invalid request (missing fields, invalid IDs, amount mismatch)
- `401`: Invalid signature
- `404`: Booster not found
- `500`: Server error

### Success Response

\`\`\`json
{
  "success": true,
  "message": "Booster activated successfully",
  "transaction": {
    "id": "transaction-uuid",
    "boosterId": "booster-uuid",
    "userId": "user-uuid",
    "expiresAt": "2025-12-09T10:00:00.000Z"
  }
}
\`\`\`

## 4. Redirecting User Back

After sending the webhook, redirect the user back to Oblium:

**Success:**
\`\`\`
{returnUrl}?status=success&paymentId={paymentId}
\`\`\`

**Failure:**
\`\`\`
{returnUrl}?status=failed&error={errorMessage}
\`\`\`

## 5. Environment Setup

### Oblium Configuration

Add this environment variable to Oblium:

\`\`\`
WEBHOOK_SECRET=your-shared-secret-key-here
\`\`\`

### Your Payment App Configuration

Add the same secret to your payment app:

\`\`\`
WEBHOOK_SECRET=your-shared-secret-key-here
OBLIUM_WEBHOOK_URL=https://obliumtoken.com/api/webhooks/payment
\`\`\`

## Example Implementation (Node.js)

\`\`\`javascript
const crypto = require('crypto');

async function notifyObliumAfterPayment(paymentDetails) {
  const webhookUrl = process.env.OBLIUM_WEBHOOK_URL;
  const webhookSecret = process.env.WEBHOOK_SECRET;

  const payload = {
    userId: paymentDetails.userId,
    boosterId: paymentDetails.boosterId,
    paymentId: paymentDetails.paymentId,
    transactionHash: paymentDetails.solanaSignature,
    amountSol: paymentDetails.amount,
    status: 'completed'
  };

  const bodyString = JSON.stringify(payload);
  const signature = crypto
    .createHmac('sha256', webhookSecret)
    .update(bodyString)
    .digest('hex');

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-webhook-signature': signature
    },
    body: bodyString
  });

  const result = await response.json();
  
  if (!response.ok) {
    console.error('Webhook failed:', result);
    throw new Error(result.error || 'Webhook failed');
  }

  return result;
}
\`\`\`

## Testing

Use this test payload to verify your integration:

\`\`\`bash
curl -X POST https://obliumtoken.com/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: YOUR_SIGNATURE" \
  -d '{
    "userId": "test-user-uuid",
    "boosterId": "test-booster-uuid",
    "paymentId": "test-payment-123",
    "transactionHash": "test-tx-hash",
    "amountSol": 0.1,
    "status": "completed"
  }'
\`\`\`

## Security Considerations

1. **Always verify signatures** to ensure webhooks are from your payment app
2. **Use HTTPS** for all webhook communications
3. **Implement idempotency** - Oblium checks for duplicate transactions
4. **Validate amounts** - Oblium verifies the payment matches booster price
5. **Keep webhook secret secure** - Never commit it to version control

## Support

For integration support or questions, contact the Oblium development team.
