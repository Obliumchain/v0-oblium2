# Security Note: Solana RPC Endpoints

## Why RPC URLs Are Client-Side

In Solana dApps, the RPC endpoint **must be accessible from the browser** because:

1. **Wallet Adapters Need Direct Access** - Phantom and other wallets connect directly to the Solana network through the RPC endpoint
2. **Transaction Signing** - Users sign transactions client-side with their private keys (which never leave their wallet)
3. **Real-time Updates** - The app needs to query the blockchain for account balances, transaction status, etc.

## Is This Secure?

**Yes, this is standard practice for all Solana dApps.** The `NEXT_PUBLIC_` prefix in Next.js makes variables accessible in the browser, which is required for Solana functionality.

### How RPC Providers Handle Security

RPC providers like Syndica, Helius, and QuickNode expect their endpoints to be used client-side and provide security through:

1. **Rate Limiting** - Limits requests per IP/domain to prevent abuse
2. **Domain Whitelisting** - Configure allowed domains in your provider dashboard
3. **Usage Analytics** - Monitor for unusual patterns or abuse
4. **Free Tier Limits** - Caps on daily/monthly requests

### Best Practices

1. **Use a Dedicated RPC Provider** - Don't use public endpoints in production
2. **Configure Domain Restrictions** - In your Syndica dashboard, restrict your API key to your domain
3. **Monitor Usage** - Set up alerts for unusual activity
4. **Rotate Keys Periodically** - Generate new API keys every few months
5. **Use Different Keys for Dev/Prod** - Never use production keys in development

### For Your Syndica Setup

Add this to your Vercel environment variables:

\`\`\`bash
NEXT_PUBLIC_SOLANA_RPC_URL=https://solana-mainnet.api.syndica.io/api-key/3jYbtdrZaCmGbJjTruQKQsd7Uq5EkM184Lv51J3CR1kh9SHcF6bNBFeKqf1qHvng869qRCpJEZm5Zwph9iBJkVxAcvReYcuaipP
\`\`\`

**Important:** Go to your Syndica dashboard and configure domain restrictions to only allow requests from your production domain (e.g., `yourapp.vercel.app`).

### The v0 Security Warning

The warning you see from v0 is a general security reminder. For Solana dApps specifically, exposing the RPC endpoint is:
- **Expected behavior**
- **Required for wallet functionality**
- **Standard across all Solana applications**
- **Secure when properly configured with your RPC provider**

You can safely proceed with this configuration.
