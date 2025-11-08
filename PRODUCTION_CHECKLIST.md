# Production Deployment Checklist

## Pre-Deployment

### Database Setup
- [ ] All SQL scripts in `/scripts` folder have been executed in order
- [ ] Database tables have proper indexes on frequently queried columns
- [ ] Row Level Security (RLS) policies are enabled on all tables
- [ ] Database backups are configured
- [ ] Connection pooling is properly configured

### Environment Variables
- [ ] All required environment variables are set in Vercel
- [ ] `NEXT_PUBLIC_SOLANA_NETWORK` is set to `mainnet-beta` for production
- [ ] `NEXT_PUBLIC_RECIPIENT_WALLET` is set to your actual production wallet
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is kept secret (not exposed to client)
- [ ] Remove or update `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` for production

### Security
- [ ] All API routes have authentication checks
- [ ] Input validation is implemented on all endpoints
- [ ] Solana wallet addresses are validated before storage
- [ ] Transaction hashes are checked for duplicates
- [ ] Rate limiting is considered (recommended: implement Upstash Rate Limit)
- [ ] CORS policies are reviewed
- [ ] Error messages don't expose sensitive information

### Wallet Integration
- [ ] Phantom wallet integration tested on both desktop and mobile
- [ ] iOS wallet connection tested (universal links working)
- [ ] Android wallet connection tested (deep links working)
- [ ] Wallet network matches app configuration (mainnet vs devnet)
- [ ] Transaction verification is implemented
- [ ] Recipient wallet can receive payments

### Features Testing
- [ ] User registration and login work correctly
- [ ] Nickname generation and display function properly
- [ ] Point accumulation system works
- [ ] Task completion awards points correctly
- [ ] Referral system processes rewards properly
- [ ] Booster purchases complete successfully
- [ ] Leaderboard displays real nicknames
- [ ] Language switching works across all pages
- [ ] Mobile navigation bar displays correctly

### Performance
- [ ] Images are optimized
- [ ] Unused console.log statements are removed
- [ ] Database queries are optimized with proper indexes
- [ ] API responses are reasonably fast (< 2s)
- [ ] Client-side state management is efficient

### Monitoring
- [ ] Vercel Analytics is enabled
- [ ] Error tracking is set up (consider Sentry)
- [ ] Database monitoring is configured in Supabase
- [ ] Set up alerts for critical errors

## Deployment

### Vercel Configuration
- [ ] Production domain is configured
- [ ] Automatic deployments from main branch enabled
- [ ] Preview deployments configured for testing
- [ ] Environment variables synced across environments

### Post-Deployment
- [ ] Test complete user journey on production
- [ ] Verify wallet connections work on production URL
- [ ] Check all API endpoints return expected responses
- [ ] Test on multiple devices (iOS, Android, Desktop)
- [ ] Verify Solana transactions complete successfully
- [ ] Monitor error logs for first 24 hours

## Maintenance

### Regular Tasks
- [ ] Monitor database usage and optimize queries
- [ ] Review error logs weekly
- [ ] Back up database regularly
- [ ] Update dependencies monthly
- [ ] Review and rotate API keys quarterly
- [ ] Monitor Solana network status
- [ ] Check wallet balance for receiving payments

### Scaling Considerations
- [ ] Implement caching strategy if needed
- [ ] Consider CDN for static assets
- [ ] Review database connection limits
- [ ] Plan for increased API rate limits
- [ ] Monitor Vercel usage and costs

## Emergency Procedures

### If Users Can't Connect Wallets
1. Check Vercel deployment logs
2. Verify `NEXT_PUBLIC_SOLANA_NETWORK` matches user's wallet network
3. Test wallet connection on different devices
4. Check Solana network status
5. Review browser console errors

### If Transactions Fail
1. Verify recipient wallet address is correct
2. Check Solana network status and congestion
3. Review transaction validation logic
4. Check database for duplicate transaction hashes
5. Monitor Supabase logs for errors

### If Points Aren't Awarded
1. Check database function `increment_points` is working
2. Verify RLS policies allow updates
3. Review API route logs for errors
4. Check task_completions table for entries
5. Verify no race conditions in concurrent requests

## Support Contacts

- Vercel Support: https://vercel.com/help
- Supabase Support: https://supabase.com/support
- Solana Status: https://status.solana.com
