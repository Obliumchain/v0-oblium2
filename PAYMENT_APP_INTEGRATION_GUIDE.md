# Payment Application Integration Guide for Oblium

This document provides all the information needed to build the external payment application that processes Solana payments and integrates with the Oblium platform.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [Available Products (Boosters)](#available-products-boosters)
5. [User Flow](#user-flow)
6. [Webhook Integration](#webhook-integration)
7. [Environment Variables](#environment-variables)
8. [Security Considerations](#security-considerations)
9. [Testing](#testing)
10. [Example Implementation](#example-implementation)

---

## Overview

### System Architecture

\`\`\`
User → Oblium App → Payment App → Solana Blockchain
                         ↓
                    Webhook to Oblium
                         ↓
                  Credit Booster to User
\`\`\`

### Key Components

- **Oblium App**: Main application where users browse boosters
- **Payment App**: Your application that handles Solana payment processing
- **Webhook**: POST request from Payment App to Oblium after successful payment
- **Solana Blockchain**: Where actual SOL transactions happen

---

## Architecture

### Payment Flow

1. User clicks "Buy Now" on a booster in Oblium
2. Oblium redirects to Payment App with query parameters:
   - `userId`: UUID of the user
   - `boosterId`: UUID of the booster product
   - `amount`: Price in SOL
   - `returnUrl`: URL to redirect back to Oblium
3. Payment App displays payment UI with Phantom wallet integration
4. User connects Phantom wallet and confirms transaction
5. Payment App sends SOL to recipient wallet on Solana
6. On successful transaction, Payment App:
   - Sends webhook to Oblium with payment details
   - Redirects user back to Oblium with success status
7. Oblium credits booster to user account

### Redirect URL Structure

**From Oblium to Payment App:**
\`\`\`
https://your-payment-app.com/pay?userId={uuid}&boosterId={uuid}&amount={number}&returnUrl={encoded_url}
\`\`\`

**Example:**
\`\`\`
https://payment.oblium.com/pay?userId=f5ed2686-ec12-49b4-94c1-e6971a3dcc1e&boosterId=123e4567-e89b-12d3-a456-426614174000&amount=0.065&returnUrl=https%3A%2F%2Fobliumtoken.com%2Fdashboard
\`\`\`

**Return to Oblium (Success):**
\`\`\`
{returnUrl}?status=success&paymentId={transactionHash}
\`\`\`

**Return to Oblium (Failed):**
\`\`\`
{returnUrl}?status=failed&error={error_message}
\`\`\`

---

## Database Schema

### Relevant Tables

#### 1. `profiles` Table (Users)
\`\`\`sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY,                    -- User ID (linked to Supabase Auth)
  wallet_address TEXT,                    -- User's Solana wallet address (optional)
  wallet_type TEXT,                       -- 'phantom', 'solflare', etc.
  points BIGINT DEFAULT 0,               -- User's points balance
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
\`\`\`

#### 2. `boosters` Table (Products)
\`\`\`sql
CREATE TABLE boosters (
  id UUID PRIMARY KEY,                    -- Booster ID
  name TEXT NOT NULL,                     -- Product name
  description TEXT,                       -- Product description
  type TEXT NOT NULL,                     -- 'multiplier', 'auto_claim', 'combo'
  multiplier_value INTEGER DEFAULT 1,     -- Multiplier (2x, 3x, 5x, 10x)
  duration_hours INTEGER NOT NULL,        -- Always 120 (5 days)
  price_sol NUMERIC NOT NULL,            -- Price in SOL
  active BOOLEAN DEFAULT true,           -- Is product available?
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
\`\`\`

#### 3. `booster_transactions` Table (Payment Records)
\`\`\`sql
CREATE TABLE booster_transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  booster_id UUID REFERENCES boosters(id),
  amount_sol NUMERIC NOT NULL,
  wallet_tx_hash TEXT UNIQUE,            -- Solana transaction hash
  status TEXT DEFAULT 'pending',         -- 'pending', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
\`\`\`

#### 4. `user_boosters` Table (Active Boosters)
\`\`\`sql
CREATE TABLE user_boosters (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  booster_id UUID REFERENCES boosters(id),
  activated_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,         -- Calculated: activated_at + duration_hours
  auto_renew BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
\`\`\`

---

## Available Products (Boosters)

All boosters last **5 days (120 hours)**.

### Multiplier Boosters

| Name | Type | Multiplier | Price (SOL) | Description |
|------|------|------------|-------------|-------------|
| 2x Booster (5d) | multiplier | 2 | 0.035 | Double your mining rewards for 5 days |
| 3x Booster (5d) | multiplier | 3 | 0.045 | Triple your mining rewards for 5 days |
| 5x Booster (5d) | multiplier | 5 | 0.065 | Multiply your rewards by 5× for 5 days |
| 10x Booster (5d) | multiplier | 10 | 0.09 | Multiply your rewards by 10× for 5 days |

### Special Boosters

| Name | Type | Multiplier | Price (SOL) | Description |
|------|------|------------|-------------|-------------|
| Auto-Claim (5d) | auto_claim | 1 | 0.04 | Automatically claim mining rewards every 4 hours for 5 days |

### Combo Packages

| Name | Type | Multiplier | Price (SOL) | Description |
|------|------|------------|-------------|-------------|
| 5x + Auto-Claim (5d) | combo | 5 | 0.06 | Get 5× mining rewards + automatic claiming for 5 days |
| 10x + Auto-Claim (5d) | combo | 10 | 0.085 | Get 10× mining rewards + automatic claiming for 5 days |

### Fetching Products

You can fetch active boosters via API:

\`\`\`typescript
// GET https://obliumtoken.com/api/boosters
const response = await fetch('https://obliumtoken.com/api/boosters');
const boosters = await response.json();
\`\`\`

Response:
\`\`\`json
[
  {
    "id": "uuid-here",
    "name": "5x Booster (5d)",
    "description": "Multiply your rewards by 5× for 5 days",
    "type": "multiplier",
    "multiplier_value": 5,
    "duration_hours": 120,
    "price_sol": 0.065,
    "active": true
  }
]
\`\`\`

---

## User Flow

### 1. User Journey

1. **Browse Boosters** - User views available boosters on Oblium dashboard
2. **Select Booster** - User clicks "Buy Now" button
3. **Redirect to Payment App** - Oblium opens your payment app with product details
4. **Connect Wallet** - User connects Phantom wallet in your payment app
5. **Review Payment** - User sees price, product details, recipient wallet
6. **Confirm Transaction** - User approves transaction in Phantom
7. **Process Payment** - Your app sends SOL to recipient wallet on Solana blockchain
8. **Send Webhook** - Your app notifies Oblium via webhook
9. **Redirect Back** - User is redirected to Oblium with success message
10. **Booster Activated** - User sees active booster in their account

### 2. User Identification

Users are identified by their `userId` (UUID) which is passed in the URL parameters. This is their Supabase Auth user ID and links to the `profiles.id` column.

**No authentication required** - The webhook uses a shared secret (WEBHOOK_SECRET) for security instead of user authentication.

---

## Webhook Integration

### Webhook Endpoint

**URL:** `https://obliumtoken.com/api/webhooks/payment`  
**Method:** POST  
**Content-Type:** `application/json`

### Request Headers

\`\`\`
Content-Type: application/json
x-webhook-signature: <hmac-sha256-signature>
\`\`\`

### Signature Generation

\`\`\`typescript
import crypto from 'crypto';

const webhookSecret = process.env.WEBHOOK_SECRET; // Shared secret
const payload = JSON.stringify(requestBody);
const signature = crypto
  .createHmac('sha256', webhookSecret)
  .update(payload)
  .digest('hex');
\`\`\`

### Request Body

\`\`\`typescript
interface WebhookPayload {
  userId: string;              // UUID - User ID from URL params
  boosterId: string;           // UUID - Booster ID from URL params
  paymentId: string;           // Unique payment ID (can be transaction hash)
  amountSol: number;          // Amount paid in SOL (must match booster price)
  status: 'completed' | 'success'; // Payment status
  transactionHash: string;     // Solana transaction hash (optional but recommended)
  timestamp?: string;          // ISO timestamp (optional)
}
\`\`\`

### Example Request

\`\`\`bash
curl -X POST https://obliumtoken.com/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: abc123..." \
  -d '{
    "userId": "f5ed2686-ec12-49b4-94c1-e6971a3dcc1e",
    "boosterId": "123e4567-e89b-12d3-a456-426614174000",
    "paymentId": "unique-payment-id-123",
    "amountSol": 0.065,
    "status": "completed",
    "transactionHash": "5j7N8..."
  }'
\`\`\`

### Response

**Success (200):**
\`\`\`json
{
  "success": true,
  "message": "Booster activated successfully",
  "transaction": {
    "id": "transaction-uuid",
    "boosterId": "booster-uuid",
    "userId": "user-uuid",
    "expiresAt": "2025-11-19T12:00:00Z"
  }
}
\`\`\`

**Error (400/401/404/500):**
\`\`\`json
{
  "error": "Error message",
  "errorId": "unique-error-id"
}
\`\`\`

### Webhook Validation

Oblium webhook endpoint performs these validations:

1. **Signature verification** - Validates HMAC signature
2. **Required fields** - Checks userId, boosterId, paymentId, amountSol
3. **UUID format** - Validates userId and boosterId are valid UUIDs
4. **Amount range** - Checks 0 < amountSol <= 1000
5. **Payment status** - Only processes 'completed' or 'success'
6. **Idempotency** - Prevents duplicate processing using transactionHash
7. **Booster validation** - Verifies booster exists and is active
8. **Price matching** - Confirms payment amount matches booster price (±0.001 SOL tolerance)

---

## Environment Variables

### Required in Payment App

\`\`\`env
# Oblium Integration
OBLIUM_WEBHOOK_URL=https://obliumtoken.com/api/webhooks/payment
WEBHOOK_SECRET=your-shared-secret-key-here

# Solana Configuration
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta
NEXT_PUBLIC_RECIPIENT_WALLET=your-recipient-wallet-address

# Return URL
NEXT_PUBLIC_OBLIUM_RETURN_URL=https://obliumtoken.com/dashboard
\`\`\`

### Required in Oblium (Already Set)

\`\`\`env
# Payment App URL
NEXT_PUBLIC_PAYMENT_APP_URL=https://your-payment-app.com/pay

# Webhook Security
WEBHOOK_SECRET=your-shared-secret-key-here

# Recipient Wallet (for verification)
NEXT_PUBLIC_RECIPIENT_WALLET=your-recipient-wallet-address
\`\`\`

---

## Security Considerations

### 1. Webhook Security

- **ALWAYS verify webhook signature** using HMAC-SHA256
- Store webhook secret securely (never commit to git)
- Use HTTPS only for webhook endpoint
- Implement rate limiting on webhook endpoint

### 2. Payment Verification

- Verify Solana transaction actually happened on blockchain
- Check transaction recipient matches expected wallet
- Validate transaction amount matches booster price
- Store transaction hash for audit trail

### 3. Idempotency

- Use transaction hash as unique identifier
- Never credit same transaction twice
- Implement proper error handling for retries

### 4. User Data Protection

- Don't store sensitive user data in payment app
- Only store necessary transaction records
- Use UUID references instead of personal info

---

## Testing

### Test Mode Setup

For development and testing:

1. Use **Solana Devnet** instead of Mainnet
2. Get devnet SOL from faucet: https://faucet.solana.com/
3. Set environment to devnet:
   \`\`\`env
   NEXT_PUBLIC_SOLANA_NETWORK=devnet
   NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
   \`\`\`

### Testing Webhook

\`\`\`bash
# Test webhook endpoint
curl -X POST https://obliumtoken.com/api/webhooks/payment \
  -H "Content-Type: application/json" \
  -H "x-webhook-signature: $(echo -n '{"userId":"test","boosterId":"test","paymentId":"test-123","amountSol":0.065,"status":"completed"}' | openssl dgst -sha256 -hmac 'your-secret' -hex | cut -d' ' -f2)" \
  -d '{
    "userId": "f5ed2686-ec12-49b4-94c1-e6971a3dcc1e",
    "boosterId": "valid-booster-uuid",
    "paymentId": "test-payment-123",
    "amountSol": 0.065,
    "status": "completed",
    "transactionHash": "test-tx-hash"
  }'
\`\`\`

### Test Checklist

- [ ] Phantom wallet connects successfully
- [ ] Correct price displayed
- [ ] Transaction sends to correct recipient wallet
- [ ] Webhook signature validates correctly
- [ ] Booster activates in Oblium after payment
- [ ] User redirects back to Oblium with success message
- [ ] Error handling works (insufficient funds, cancelled transaction)
- [ ] Duplicate transactions are rejected
- [ ] Invalid amounts are rejected

---

## Example Implementation

### Payment Page Component

\`\`\`typescript
'use client'

import { useEffect, useState } from 'react'
import { useWallet, useConnection } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js'
import crypto from 'crypto'

export default function PaymentPage() {
  const [booster, setBooster] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const { connection } = useConnection()
  const { publicKey, sendTransaction } = useWallet()
  
  // Get params from URL
  const urlParams = new URLSearchParams(window.location.search)
  const userId = urlParams.get('userId')
  const boosterId = urlParams.get('boosterId')
  const amount = parseFloat(urlParams.get('amount') || '0')
  const returnUrl = decodeURIComponent(urlParams.get('returnUrl') || '')
  
  const recipientWallet = new PublicKey(process.env.NEXT_PUBLIC_RECIPIENT_WALLET!)
  
  // Fetch booster details
  useEffect(() => {
    const fetchBooster = async () => {
      try {
        const response = await fetch(`https://obliumtoken.com/api/boosters`)
        const boosters = await response.json()
        const booster = boosters.find(b => b.id === boosterId)
        setBooster(booster)
      } catch (err) {
        setError('Failed to load product')
      }
    }
    
    fetchBooster()
  }, [boosterId])
  
  const handlePayment = async () => {
    if (!publicKey || !booster) return
    
    setLoading(true)
    setError(null)
    
    try {
      // Create Solana transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: recipientWallet,
          lamports: amount * LAMPORTS_PER_SOL,
        })
      )
      
      // Send transaction
      const signature = await sendTransaction(transaction, connection)
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed')
      
      console.log('Transaction successful:', signature)
      
      // Send webhook to Oblium
      await sendWebhook({
        userId,
        boosterId,
        paymentId: signature,
        amountSol: amount,
        status: 'completed',
        transactionHash: signature,
      })
      
      // Redirect back to Oblium with success
      window.location.href = `${returnUrl}?status=success&paymentId=${signature}`
      
    } catch (err) {
      console.error('Payment error:', err)
      setError(err.message || 'Payment failed')
      setLoading(false)
      
      // Redirect back with error
      window.location.href = `${returnUrl}?status=failed&error=${encodeURIComponent(err.message)}`
    }
  }
  
  const sendWebhook = async (payload) => {
    const webhookUrl = process.env.OBLIUM_WEBHOOK_URL
    const webhookSecret = process.env.WEBHOOK_SECRET
    
    const body = JSON.stringify(payload)
    const signature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex')
    
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-signature': signature,
      },
      body,
    })
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-lg p-6 space-y-6">
        <h1 className="text-2xl font-bold">Complete Payment</h1>
        
        {booster && (
          <div className="space-y-4">
            <div>
              <h2 className="font-semibold">{booster.name}</h2>
              <p className="text-sm text-muted-foreground">{booster.description}</p>
            </div>
            
            <div className="flex justify-between items-center p-4 bg-muted rounded">
              <span>Total</span>
              <span className="text-xl font-bold">{amount} SOL</span>
            </div>
            
            {!publicKey ? (
              <WalletMultiButton />
            ) : (
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-3 rounded font-semibold"
              >
                {loading ? 'Processing...' : 'Pay Now'}
              </button>
            )}
            
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
\`\`\`

### Next Steps

1. Set up Next.js project with Solana wallet adapter
2. Create payment page with Phantom integration
3. Implement transaction sending logic
4. Add webhook notification after successful payment
5. Test on devnet before deploying to mainnet
6. Share webhook secret securely with Oblium team
7. Configure environment variables
8. Deploy payment app

---

## Support

For questions or issues, contact the Oblium team or refer to:
- Solana Web3.js docs: https://solana-labs.github.io/solana-web3.js/
- Wallet Adapter docs: https://github.com/solana-labs/wallet-adapter
- Phantom wallet docs: https://docs.phantom.app/

---

**Last Updated:** November 14, 2025  
**Version:** 1.0
