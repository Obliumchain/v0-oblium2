# Payment Webhook Integration Guide

This document explains how to integrate an external payment application with Oblium to handle booster purchases.

## Overview

Oblium accepts payment notifications from an external payment processing application via webhooks. When a payment is successfully completed, the external app sends a webhook to Oblium, which then credits the purchased booster to the user's account.

## Webhook Endpoint

**URL:** `https://your-oblium-domain.com/api/webhooks/payment`
**Method:** `POST`
**Content-Type:** `application/json`

## Authentication

All webhook requests must include a signature for verification:

**Header:** `x-webhook-signature`
**Value:** HMAC SHA256 hash of the request body using the shared webhook secret

### Generating the Signature (Example in Node.js)

\`\`\`javascript
const crypto = require('crypto');

const body = JSON.stringify(payload);
const signature = crypto
  .createHmac('sha256', WEBHOOK_SECRET)
  .update(body)
  .digest('hex');

// Include in request headers
headers['x-webhook-signature'] = signature;
\`\`\`

## Webhook Payload

The external payment app should send the following JSON payload:

\`\`\`json
{
  "userId": "uuid-of-user",
  "boosterId": "uuid-of-booster",
  "paymentId": "unique-payment-identifier",
  "transactionHash": "blockchain-tx-hash-if-applicable",
  "amountSol": 0.5,
  "status": "completed",
  "timestamp": "2025-01-01T12:00:00Z"
}
\`\`\`

### Payload Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userId` | string (UUID) | Yes | The user's ID in Oblium system |
| `boosterId` | string (UUID) | Yes | The booster being purchased |
| `paymentId` | string | Yes | Unique payment identifier from your system |
| `transactionHash` | string | No | Blockchain transaction hash if applicable |
| `amountSol` | number | Yes | Payment amount in SOL |
| `status` | string | Yes | Payment status: "completed" or "success" |
| `timestamp` | string (ISO) | No | Payment completion timestamp |

## Response Codes

| Code | Description |
|------|-------------|
| 200 | Success - Booster activated |
| 400 | Bad Request - Invalid payload or amount mismatch |
| 401 | Unauthorized - Invalid signature |
| 404 | Not Found - Booster doesn't exist or is inactive |
| 500 | Server Error - Internal processing error |

### Success Response

\`\`\`json
{
  "success": true,
  "message": "Booster activated successfully",
  "transaction": {
    "id": "transaction-uuid",
    "boosterId": "booster-uuid",
    "userId": "user-uuid",
    "expiresAt": "2025-01-06T12:00:00Z"
  }
}
\`\`\`

### Error Response

\`\`\`json
{
  "error": "Error description",
  "errorId": "unique-error-identifier"
}
\`\`\`

## Integration Flow

1. **User initiates purchase** - User selects a booster in your payment app
2. **Payment processed** - Your app processes the payment (Solana, credit card, etc.)
3. **Payment succeeds** - Your app receives payment confirmation
4. **Send webhook** - Your app sends POST request to Oblium webhook endpoint
5. **Oblium validates** - Oblium verifies signature and payment details
6. **Booster activated** - Oblium credits the booster to user's account
7. **Response sent** - Oblium returns success/error response

## Setup Instructions

### 1. Environment Variables

Add to your Oblium `.env` file:

\`\`\`env
WEBHOOK_SECRET=your-shared-secret-key-here
\`\`\`

**Important:** Share this secret securely with the payment application team. Both systems must use the same secret for signature verification.

### 2. Get Booster Information

To display available boosters in your payment app, query Oblium's database or use this API endpoint:

\`\`\`bash
GET /api/boosters
\`\`\`

Returns list of active boosters with pricing and details.

### 3. Testing

Use this example webhook request:

\`\`\`bash
curl -X POST https://your-oblium-domain.com/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: YOUR_CALCULATED_SIGNATURE" \
  -d '{
    "userId": "f5ed2686-ec12-49b4-94c1-e6971a3dcc1e",
    "boosterId": "booster-uuid-here",
    "paymentId": "test-payment-123",
    "amountSol": 0.5,
    "status": "completed"
  }'
\`\`\`

## Security Considerations

1. **Always verify signatures** - Never process webhooks without signature verification
2. **Use HTTPS** - Only accept webhooks over HTTPS in production
3. **Idempotency** - Oblium checks for duplicate `paymentId`/`transactionHash` to prevent double-crediting
4. **Amount validation** - Oblium verifies payment amount matches booster price
5. **Rate limiting** - Consider implementing rate limiting on webhook endpoint

## Monitoring & Logs

All webhook processing includes detailed logging with unique error IDs. Search logs using `[errorId]` to trace issues.

## Support

For integration support or questions, contact the Oblium development team.
