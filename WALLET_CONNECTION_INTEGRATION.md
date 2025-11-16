# Wallet Connection Integration Guide

This document explains how to integrate the wallet connection system between the Oblium app and the payment app.

## Overview

Users can connect their Solana wallet through the payment app, and the wallet address is stored in their Oblium profile. The connection flow uses webhooks for secure communication.

## Payment App Requirements

### 1. Wallet Connection Page

Create a page at `/wallet-connect` that:
- Accepts URL parameters: `userId` and `redirectUrl`
- Allows users to connect their Solana wallet
- After successful connection, sends a webhook to Oblium

### 2. Webhook Configuration

After wallet connection, send a POST request to:
\`\`\`
https://www.obliumtoken.com/api/webhooks/wallet-connect
\`\`\`

**Headers:**
\`\`\`
Content-Type: application/json
x-webhook-signature: <HMAC_SHA256_SIGNATURE>
\`\`\`

**Payload:**
\`\`\`json
{
  "userId": "user-uuid-from-url-params",
  "walletAddress": "solana-wallet-address",
  "walletType": "solana",
  "timestamp": "2025-01-16T12:00:00Z"
}
\`\`\`

**Security - HMAC Signature:**
- Generate an HMAC SHA256 signature of the JSON payload
- Use the same `WEBHOOK_SECRET` environment variable as other webhooks
- Include the signature in the `x-webhook-signature` header

### 3. Redirect After Connection

After sending the webhook, redirect the user back to:
\`\`\`
{redirectUrl}?wallet=connected
\`\`\`

Where `redirectUrl` is the URL parameter received initially.

## Oblium App Features

### Dashboard Integration
- Wallet Connect tile shows connection status
- Users can connect or disconnect their wallet
- Connect button redirects to payment app
- Disconnect removes wallet address from profile

### Profile Integration
- Same wallet connection tile on profile page
- Displays connected wallet address (truncated)
- Users can manage their wallet connection

### Database Schema
The `profiles` table includes:
- `wallet_address` (text, nullable) - Solana wallet address
- `wallet_connected_at` (timestamp, nullable) - When wallet was connected
- `wallet_type` (text, nullable) - Type of wallet (e.g., "solana")

## Testing

1. User clicks "Connect Wallet" on dashboard or profile
2. Redirected to payment app: `https://payment.obliumtoken.com/wallet-connect?userId=xxx&redirectUrl=xxx`
3. User connects wallet on payment app
4. Payment app sends webhook to Oblium
5. Payment app redirects user back to Oblium
6. Wallet address appears on dashboard and profile

## Environment Variables

Ensure these are configured:
- `NEXT_PUBLIC_PAYMENT_APP_URL` - Payment app URL (default: https://payment.obliumtoken.com)
- `WEBHOOK_SECRET` - Shared secret for HMAC signature verification
