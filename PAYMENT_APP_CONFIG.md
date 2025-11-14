# Payment App Configuration

Your specific configuration values for building the payment application.

## Environment Variables

Add these to your payment app's `.env.local` file:

\`\`\`env
# Oblium Integration
OBLIUM_WEBHOOK_URL=https://obliumtoken.com/api/webhooks/payment
WEBHOOK_SECRET=GHiTWomHMdmvpV7Nd3Spz9ZtpchCTt6EsDQjZBw2ESUe7aQFKmoWU7yJKzNrEL2Brdt52gy3xz44dcvJwWbvSKPv

# Your payment app URL
NEXT_PUBLIC_APP_URL=https://payment.obliumtoken.com

# Solana Configuration
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RECIPIENT_WALLET=your_recipient_wallet_address_here
\`\`\`

## Webhook Endpoint

Your payment app will send POST requests to:
\`\`\`
https://obliumtoken.com/api/webhooks/payment
\`\`\`

## Available Boosters & Prices

| Booster ID | Name | Price (SOL) | Price (USDC) | Points Given |
|------------|------|-------------|--------------|--------------|
| 1 | Starter Pack | 0.1 | 1 | 100 |
| 2 | Growth Pack | 0.25 | 2.5 | 250 |
| 3 | Premium Pack | 0.5 | 5 | 500 |
| 4 | Elite Pack | 1.0 | 10 | 1000 |
| 5 | Ultimate Pack | 2.5 | 25 | 2500 |

## Integration Flow

1. **User clicks "Buy" in Oblium** → Redirected to your payment app
   - URL: `https://payment.obliumtoken.com/checkout?userId={userId}&boosterId={boosterId}&amount={amount}&boosterName={name}&returnUrl={returnUrl}`

2. **User completes payment** → Your app processes Solana transaction

3. **Payment successful** → Your app sends webhook to Oblium:
   \`\`\`typescript
   const webhook = await fetch('https://obliumtoken.com/api/webhooks/payment', {
     method: 'POST',
     headers: {
       'Content-Type': 'application/json',
       'X-Webhook-Signature': hmacSignature
     },
     body: JSON.stringify({
       userId: 'f5ed2686-ec12-49b4-94c1-e6971a3dcc1e',
       boosterId: 1,
       transactionId: 'solana_tx_hash',
       amount: 0.1,
       currency: 'SOL',
       status: 'success'
     })
   })
   \`\`\`

4. **Oblium receives webhook** → Credits boosters to user

5. **Redirect user back** → `{returnUrl}?status=success&tx={transactionId}`

## Next Steps

1. Build your payment app with Solana integration
2. Use the webhook secret to sign all webhook requests
3. Test with devnet before going to mainnet
4. Deploy and set NEXT_PUBLIC_APP_URL in Oblium

## Security Notes

- Never expose `WEBHOOK_SECRET` in client-side code
- Always verify transaction on Solana blockchain before sending webhook
- Use HTTPS only for webhook communication
- Implement retry logic for failed webhook deliveries
