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

## How It Works

### 1. Scraping Historical Data

The feature scrapes historical season data from SofaScore:
- URL: `https://www.sofascore.com/tournament/football/england/premier-league/17`
- Navigates through matchweeks from 38 down to 1 (backwards)
- Stores results chronologically (matchweek 1 first, matchweek 38 last)
- Includes delays to avoid rate limiting (2 seconds between matchweeks)

### 2. API Endpoints

#### POST `/api/historical-season`
Scrapes and stores historical season data.

**Request Body:**
```json
{
  "seasonYear": 2024
}
```

**Response:**
```json
{
  "success": true,
  "season": "2024/2025",
  "fixturesCount": 380,
  "message": "Successfully scraped and stored 380 fixtures for season 2024/2025"
}
```

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

### 3. Points Calculation

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
4. Click "Scrape [Season] Season Data" if data is not available
5. View the comparison between current season and selected season

### Via API

To scrape a historical season programmatically:

```bash
curl -X POST http://localhost:3000/api/historical-season \
  -H "Content-Type: application/json" \
  -d '{"seasonYear": 2024}'
```

## File Structure

The scraper is split into modular files (all under 200 lines):

- `lib/scrapers/sofascore-historical.ts` - Main scraper orchestration
- `lib/scrapers/sofascore-navigation.ts` - Navigation utilities
- `lib/scrapers/sofascore-extraction.ts` - Extraction coordination
- `lib/scrapers/sofascore-element-extraction.ts` - DOM element extraction
- `lib/scrapers/sofascore-processor.ts` - Data processing utilities

## Notes

- The scraper includes delays to avoid rate limiting
- Historical data is stored in the same `fixtures` table with a `season` field
- The scraper may need adjustments based on SofaScore's actual page structure
- Scraping a full season (38 matchweeks) can take several minutes due to delays

## Troubleshooting

### No data scraped
- Check if SofaScore page structure has changed
- Verify network connectivity
- Check browser console for errors
- The scraper may need selector updates

### Rate limiting
- Increase delays in `sofascore-historical.ts` if needed
- Scrape during off-peak hours

### Database errors
- Ensure migration has been run
- Check Supabase connection
- Verify RLS policies allow inserts

## Future Improvements

- Cache scraped data to avoid re-scraping
- Add progress indicator during scraping
- Support for more seasons
- Batch scraping multiple seasons
