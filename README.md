# Oblium - Crypto Mining Platform

A Next.js-based cryptocurrency mining and rewards platform with Solana wallet integration.

## Features

- User authentication with Supabase
- Solana wallet integration (Phantom)
- Point accumulation system
- Task completion rewards
- Referral program
- Booster shop for mining multipliers
- Multi-language support (English, Spanish, French, Arabic, German)
- Real-time leaderboard
- Mobile-responsive design

## Tech Stack

- **Framework**: Next.js 16
- **Authentication**: Supabase Auth
- **Database**: Supabase (PostgreSQL)
- **Blockchain**: Solana (Web3.js)
- **Wallet**: Solana Wallet Adapter
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + shadcn/ui
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- A Supabase account and project
- A Solana wallet (Phantom recommended)

### Installation

1. Clone the repository:
\`\`\`bash
git clone <your-repo-url>
cd oblium
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Copy environment variables:
\`\`\`bash
cp .env.local.example .env.local
\`\`\`

4. Update `.env.local` with your Supabase and Solana credentials

5. Run database migrations:
   - Go to your Supabase project SQL Editor
   - Execute all SQL files in `/scripts` folder in numerical order (001, 002, 003, etc.)

6. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

7. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

Required environment variables are listed in `.env.local.example`. Key variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (keep secret)
- `NEXT_PUBLIC_SOLANA_NETWORK` - Solana network (devnet/testnet/mainnet-beta)
- `NEXT_PUBLIC_RECIPIENT_WALLET` - Wallet address for receiving payments

## Database Setup

Execute SQL scripts in order:

1. `001_create_profiles.sql` - User profiles table
2. `002_create_referrals_table.sql` - Referral system
3. `003_profile_trigger.sql` - Auto-create profiles
4. `004_add_nickname_and_wallet.sql` - Additional profile fields
5. `005_create_boosters_table.sql` - Booster system
6. `006_seed_boosters.sql` - Seed booster data
7. `007_add_mining_system.sql` - Mining mechanics
8. `008_create_tasks_system.sql` - Task system
9. `009_seed_tasks.sql` - Seed tasks
10. `010_create_increment_points_function.sql` - Point management
11. `011_add_admin_role.sql` - Admin functionality
12. `013_create_conversion_history.sql` - Conversion tracking
13. `014_create_referral_rewards_function.sql` - Referral rewards
14. `015_update_existing_profiles_nicknames.sql` - Nickname updates

## Production Deployment

See [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for a comprehensive deployment checklist.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Important Production Settings

- Set `NEXT_PUBLIC_SOLANA_NETWORK=mainnet-beta`
- Update `NEXT_PUBLIC_RECIPIENT_WALLET` to your production wallet
- Enable Vercel Analytics
- Configure custom domain
- Set up database backups in Supabase

## Wallet Connection

### Desktop
- Click "Connect Wallet" button
- Select Phantom from the modal
- Approve connection in Phantom extension

### Mobile - Android
- Click "Connect Wallet"
- Select Phantom or Mobile Wallet Adapter
- App redirects to Phantom app
- Approve connection and return

### Mobile - iOS
- Open in Phantom in-app browser for best experience
- Or use the "Open in Phantom" button from Safari
- Wallet connects automatically in Phantom browser

## API Routes

- `POST /api/wallet/connect` - Connect Solana wallet
- `POST /api/tasks/complete` - Complete a task
- `POST /api/boosters/purchase` - Purchase a booster
- `POST /api/referral/process` - Process referral code

All routes require authentication and include input validation.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Security

- All API routes validate authentication
- Input validation on all endpoints
- Row Level Security (RLS) enabled on database
- Wallet addresses validated before storage
- Transaction hashes checked for duplicates

## Support

For issues or questions:
- Check [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md) for common issues
- Review Vercel deployment logs
- Check Supabase database logs
- Open an issue in this repository

## License

Private - All rights reserved
