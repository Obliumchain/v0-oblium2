# Disk I/O Budget Optimization Guide

Your project is hitting Vercel's Disk I/O limits with 11,000 concurrent users. Here's what to do:

## Immediate Actions

### 1. Upgrade Vercel Plan
With 11,000 users, you need **Vercel Pro or Enterprise**:
- Pro: Higher compute limits, better for scaling
- Enterprise: Unlimited, best for 10k+ users

### 2. Enable Edge Functions for Critical Routes
Go to Vercel Dashboard → Settings → Functions:
- Convert `/api/*` routes to Edge Runtime where possible
- Edge functions don't count toward Disk I/O

### 3. Use Vercel KV for Caching
Instead of session storage, use Vercel KV:
\`\`\`bash
npm install @vercel/kv
\`\`\`

### 4. Database Optimization (Critical!)
Run this in Supabase SQL Editor NOW:

\`\`\`sql
-- Critical indexes for 11k users
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_wallet ON profiles(wallet_address);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_referral ON profiles(referral_code);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_profiles_points ON profiles(points DESC);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_boosters_active ON user_boosters(user_id, expires_at) WHERE expires_at > NOW();
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_tasks_lookup ON user_tasks(user_id, task_id);

-- Enable parallel queries
ALTER DATABASE postgres SET max_parallel_workers_per_gather = 4;
\`\`\`

### 5. Supabase Connection Pooling
Go to Supabase Dashboard → Database → Connection Pooling:
- Mode: Transaction
- Pool Size: Maximum (varies by plan)

## Code Changes Applied

1. **Next.js Config**: Added `output: 'standalone'` to minimize file operations
2. **Middleware**: Completely bypassed for static assets and API routes
3. **Disabled logging**: Reduces disk writes significantly

## Monitoring

Check Vercel Dashboard → Analytics:
- Function Duration
- Function Invocations
- Bandwidth Usage

If still hitting limits, you MUST upgrade to a higher Vercel tier.

## Long-term Solutions

1. **CDN for static assets**: Use Cloudflare or similar
2. **Rate limiting**: Prevent abuse
3. **Edge caching**: Cache responses at the edge
4. **Database read replicas**: Distribute query load
