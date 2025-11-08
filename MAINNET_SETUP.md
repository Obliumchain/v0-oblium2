# Production Mainnet Setup Guide

## Critical: RPC Provider Setup

The public Solana RPC endpoint (`https://api.mainnet-beta.solana.com`) has **strict rate limits** and will cause frequent 403 errors in production.

### Recommended RPC Providers

#### 1. Helius (Recommended)
- **Free Tier**: 100 requests/second
- **Setup**: 
  1. Sign up at [helius.dev](https://helius.dev)
  2. Create an API key
  3. Add to Vercel: `NEXT_PUBLIC_SOLANA_RPC_URL=https://mainnet.helius-rpc.com/?api-key=YOUR_API_KEY`

#### 2. QuickNode
- **Free Tier**: 500k requests/month
- **Setup**:
  1. Sign up at [quicknode.com](https://quicknode.com)
  2. Create a Solana mainnet endpoint
  3. Add to Vercel: `NEXT_PUBLIC_SOLANA_RPC_URL=YOUR_QUICKNODE_URL`

#### 3. Alchemy
- **Free Tier**: 300M compute units/month
- **Setup**:
  1. Sign up at [alchemy.com](https://alchemy.com)
  2. Create a Solana mainnet app
  3. Add to Vercel: `NEXT_PUBLIC_SOLANA_RPC_URL=YOUR_ALCHEMY_URL`

### How to Add RPC URL

1. Go to your Vercel Dashboard
2. Select your Oblium project
3. Go to **Settings → Environment Variables**
4. Add new variable:
   - **Key**: `NEXT_PUBLIC_SOLANA_RPC_URL`
   - **Value**: Your RPC provider URL
5. Redeploy your application

### Current Network Check

Your `NEXT_PUBLIC_SOLANA_NETWORK` should be set to:
- `devnet` - For testing (no real money)
- `mainnet-beta` - For production (real SOL transactions)

## Other Production Requirements

### Wallet Configuration
- Set `NEXT_PUBLIC_RECIPIENT_WALLET` to your **mainnet** wallet address
- Verify the wallet is on mainnet, not devnet

### User Wallet Mode
- Users must have Phantom wallet set to **mainnet mode**
- Users will need real SOL for transactions

### Testing Before Going Live
1. Keep on devnet until fully tested
2. Get small amount of mainnet SOL for testing
3. Test all features with real mainnet transactions
4. Monitor RPC usage and upgrade plan if needed
