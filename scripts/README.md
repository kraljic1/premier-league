# Scripts

This directory contains utility scripts for managing Premier League data.

## Available Scripts

### Data Fetching

#### fetch-all-remaining-fixtures.ts
Fetches ALL remaining fixtures for the 2025/26 season from Rezultati.com and stores them in the database. This script clicks "Show more" button repeatedly to load all future matches through matchweek 38.

```bash
npm run fetch-all-fixtures
# or
npx tsx scripts/fetch-all-remaining-fixtures.ts
```

**What it does:**
- Scrapes all future fixtures from Rezultati.com
- Assigns correct matchweek numbers based on last finished matchweek
- Stores 170 remaining fixtures (matchweeks 22-38)
- Updates cache metadata

#### fetch-fixtures.ts
Fetches and stores fixtures in Supabase database.

```bash
npx tsx scripts/fetch-fixtures.ts
```

#### fetch-results-by-matchweek.ts
Fetches results for specific matchweeks.

```bash
npx tsx scripts/fetch-results-by-matchweek.ts --start=1 --end=21
```

### Data Maintenance

#### cleanup-duplicate-fixtures.ts
Removes duplicate fixtures caused by team name variations (e.g., "Manchester United" vs "Man Utd").

```bash
npm run cleanup-duplicates
# or
npx tsx scripts/cleanup-duplicate-fixtures.ts
```

**What it does:**
- Identifies duplicate fixtures based on normalized team names
- Keeps one fixture per match, deletes duplicates
- Handles common team name variations

#### check-matchweeks.ts
Verifies matchweek distribution in the database. Useful for debugging and confirming data integrity.

```bash
npx tsx scripts/check-matchweeks.ts
```

**What it does:**
- Shows scheduled fixtures by matchweek
- Displays last finished matchweek
- Lists fixture details for verification

#### fix-upcoming-matchweeks.ts
Adjusts matchweek numbers for scheduled fixtures to continue from the last finished matchweek.

```bash
npx tsx scripts/fix-upcoming-matchweeks.ts
```

### Automated Refresh

#### refresh-data.sh
Refreshes all Premier League data (fixtures, results, standings) from web sources.

```bash
./scripts/refresh-data.sh
```

Or use the npm script:
```bash
npm run refresh
```

#### setup-cron.sh
Sets up automatic data refresh via cron job (runs every 6 hours).

```bash
./scripts/setup-cron.sh
```

Or use the npm script:
```bash
npm run setup-cron
```

## Typical Workflow

### Initial Setup (Season Start)
1. Fetch all fixtures: `npm run fetch-all-fixtures`
2. Clean up duplicates: `npm run cleanup-duplicates`
3. Verify data: `npx tsx scripts/check-matchweeks.ts`

### After Matches Are Played
1. Results are automatically updated by Netlify scheduled function
2. Or manually refresh: `npm run refresh`

### Mid-Season Maintenance
1. Check data integrity: `npx tsx scripts/check-matchweeks.ts`
2. Clean duplicates if needed: `npm run cleanup-duplicates`

## Requirements

- Node.js 18+
- Environment variables configured in `.env.local`:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Supabase database with proper schema

## Database State (as of Jan 17, 2026)

- **Finished matches**: Matchweeks 1-21 (210 fixtures)
- **Scheduled matches**: Matchweeks 22-38 (170 fixtures)
- **Total**: 380 fixtures for complete 2025/26 season
