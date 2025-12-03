# Wallet Connection Unlock Timer Setup

This guide explains how to control when users can connect their wallets using a global countdown timer.

## How It Works

The wallet connection feature can be locked for all users until a specific time. Once the timer expires, all users can connect their wallets and claim the 150 OBLM bonus.

## Setting the Unlock Time

Add the `NEXT_PUBLIC_WALLET_UNLOCK_TIME` environment variable to your Vercel project:

### Option 1: Set a Specific Date/Time

Use ISO 8601 format:
\`\`\`
NEXT_PUBLIC_WALLET_UNLOCK_TIME=2025-12-03T20:30:00Z
\`\`\`

### Option 2: Calculate from Now

To set it to 2.5 hours from now, use JavaScript:
\`\`\`javascript
const unlockTime = new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString()
// Example result: 2025-12-03T20:30:00.000Z
\`\`\`

### Option 3: Allow Immediate Connections

Leave the variable empty or don't set it:
\`\`\`
NEXT_PUBLIC_WALLET_UNLOCK_TIME=
\`\`\`

## Updating the Unlock Time

1. Go to your Vercel project settings
2. Navigate to Environment Variables
3. Find `NEXT_PUBLIC_WALLET_UNLOCK_TIME`
4. Update the value to your desired unlock time
5. Redeploy your application for changes to take effect

## Example Scenarios

**Scenario 1: Lock wallets for 2.5 hours starting now**
\`\`\`
Current time: 2025-12-03 18:00:00 UTC
Unlock time: 2025-12-03T20:30:00Z
\`\`\`

**Scenario 2: Specific event time**
\`\`\`
Event time: 2025-12-10 15:00:00 UTC
Unlock time: 2025-12-10T15:00:00Z
\`\`\`

**Scenario 3: No restrictions**
\`\`\`
NEXT_PUBLIC_WALLET_UNLOCK_TIME= (empty)
\`\`\`

## Behavior

- **Before unlock time**: All users see a countdown timer, wallet connection is disabled
- **After unlock time**: All users can connect wallets and claim 150 OBLM bonus
- **Already connected wallets**: Users with connected wallets can always reconnect/disconnect regardless of timer
- **First connection bonus**: Only awarded once per user, on their first wallet connection

## Testing

To test the countdown timer locally:
1. Set `NEXT_PUBLIC_WALLET_UNLOCK_TIME` to 5 minutes from now
2. Reload the app
3. Observe the countdown timer on dashboard and profile pages
4. Wait for timer to expire and verify connection button becomes enabled
