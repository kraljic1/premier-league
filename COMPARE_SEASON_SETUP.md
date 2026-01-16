# Compare Season Feature Setup

This guide explains how to set up and use the Compare Season feature, which allows comparing a club's current season performance with previous seasons.

## Overview

The Compare Season feature enables users to:
- Select a club
- Compare current season performance (up to current matchweek) with the same matchweeks from previous seasons
- View points, wins, draws, losses, and goals comparison

## Database Migration

Before using this feature, you need to add the `season` column to the `fixtures` table.

### Steps:

1. Open your Supabase SQL Editor
2. Run the migration file: `database/migrations/004_add_season_to_fixtures.sql`

```sql
-- Add season column to fixtures table for historical data comparison
ALTER TABLE fixtures 
ADD COLUMN IF NOT EXISTS season VARCHAR(20) DEFAULT '2025/2026';

-- Create index for season queries
CREATE INDEX IF NOT EXISTS idx_fixtures_season ON fixtures (season);

-- Update existing fixtures to have the default season
UPDATE fixtures SET season = '2025/2026' WHERE season IS NULL;
```

3. Verify the migration:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'fixtures' AND column_name = 'season';
```

## Importing Historical Data

Historical season data is imported from CSV files located in the `results/` folder.

### CSV Files Available:
- `24:25.csv` - 2024/25 season
- `epl-2023-GMTStandardTime.csv` - 2023/24 season
- `epl-2022-UTC.csv` - 2022/23 season
- `epl-2021-GMTStandardTime.csv` - 2021/22 season
- `epl-2020-GMTStandardTime.csv` - 2020/21 season

### Import Steps:

1. Ensure your `.env.local` file has Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_key
   ```

2. Run the import script:
   ```bash
   npx tsx scripts/import-csv-results.ts
   ```

3. The script will:
   - Parse all CSV files
   - Normalize team names
   - Assign matchweeks
   - Save fixtures to database with correct season field
   - Show a summary of imported fixtures

### Expected Results:
- Each season should have 380 fixtures (38 matchweeks × 10 matches)
- Total: 1,900 fixtures across 5 seasons

## API Endpoints

#### GET `/api/historical-season?seasonYear=2024`
Fetches stored historical season data from the database.

**Response:**
```json
{
  "season": "2024/2025",
  "fixtures": [...],
  "count": 380
}
```

#### POST `/api/historical-season`
**Note:** Historical season scraping is no longer supported. Use CSV import instead via `scripts/import-csv-results.ts`.

## Points Calculation

Points are calculated based on Premier League rules:
- **Win**: 3 points
- **Draw**: 1 point
- **Loss**: 0 points

The comparison compares the same number of matchweeks from both seasons.

## Usage

### Via UI

1. Navigate to `/compare-season`
2. Select a club from the dropdown
3. Select a previous season (e.g., "2024/2025")
4. View the comparison between current season and selected season

### Verify Data

To check if historical data is imported:

```bash
npx tsx scripts/check-historical-seasons.ts
```

## File Structure

Key files for the Compare Season feature:

- `scripts/import-csv-results.ts` - CSV import script
- `scripts/check-historical-seasons.ts` - Data verification script
- `lib/utils-comparison.ts` - Comparison utility functions
- `lib/api/compare-season-api.ts` - API client functions
- `lib/hooks/useCompareSeason.ts` - React hook for comparison logic
- `app/compare-season/page.tsx` - Main comparison page
- `components/SeasonStatsDisplay.tsx` - Season statistics component
- `components/ComparisonSummary.tsx` - Comparison summary component

## Troubleshooting

### No data found
- Verify CSV files exist in `results/` folder
- Check that import script ran successfully
- Verify database connection
- Run `scripts/check-historical-seasons.ts` to verify data

### Import errors
- Ensure `.env.local` has correct Supabase credentials
- Check that database migration has been run
- Verify CSV file format matches expected structure
- Check for team name mismatches (script includes normalization)

### Database errors
- Ensure migration has been run
- Check Supabase connection
- Verify RLS policies allow inserts
- Check that service role key has proper permissions

## Future Improvements

- Support for importing additional seasons
- Automatic CSV validation
- Progress indicator during import
- Support for updating existing seasons
