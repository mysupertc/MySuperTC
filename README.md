# MySuperTC

A comprehensive transaction coordination platform for real estate professionals.

## Environment Variables

Add these environment variables to your project:

### Required
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (server-side only)

### Optional
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox public API token for map functionality
- `NEXT_PUBLIC_SITE_URL` - Your site URL for OAuth redirects
- `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL` - Development OAuth redirect URL

## Getting Started

1. Install dependencies:
\`\`\`bash
npm install
\`\`\`

2. Add environment variables in the v0 sidebar under "Vars"

3. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Database Setup

Run the SQL scripts in the `scripts` folder in your Supabase SQL Editor in order:
1. `001_create_tables.sql`
2. `004_create_transaction_tables.sql`
3. `005_add_profile_id_to_tables.sql`

## Features

- Transaction management with detailed tracking
- Contact and client management
- Task and disclosure checklists
- Calendar and timeline views
- Email integration
- Document upload and AI extraction
- Interactive maps with Mapbox
- Google OAuth authentication
