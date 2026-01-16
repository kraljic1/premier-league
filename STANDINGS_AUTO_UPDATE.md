# Standings Auto-Update System

## Overview

The standings table is automatically updated **120 minutes after matches begin** using a **pre-calculated schedule** based on the fixtures calendar. The system analyzes fixtures once daily and schedules updates only when matches finish.

## How It Works

### Two-Function System

#### 1. Daily Scheduler (`netlify/functions/schedule-updates.ts`)
**Runs once daily at 2 AM UTC**

- Analyzes fixtures table for upcoming matches (next 7 days)
- Calculates when each match will finish (start time + 120 minutes)
- Stores scheduled update times in `scheduled_updates` table
- This creates a "calendar" of when updates are needed

#### 2. Auto-Update Function (`netlify/functions/auto-update.ts`)
**Runs every 5 minutes**

- Checks `scheduled_updates` table to see if it's time to update
- If scheduled update time matches current time → scrape & update
- If no scheduled updates → exits immediately (<1 second)
- Updates both match results AND standings automatically

### Process Flow

```
Daily (2 AM):
  ↓
schedule-updates function:
  ├─ Analyzes fixtures calendar
  ├─ Calculates finish times (start + 120 min)
  └─ Stores in scheduled_updates table
  ↓
Every 5 minutes:
  ↓
auto-update function:
  ├─ Checks scheduled_updates table
  ├─ If time matches → update results & standings
  └─ If no matches → exit immediately
```

### Benefits

✅ **Pre-calculated schedule** - Knows exactly when to update  
✅ **Minimal work** - Only runs when matches finish  
✅ **Fast checks** - Just a database query every 5 minutes  
✅ **Calendar-driven** - Based on fixtures table analysis

### Timing Logic

- **Match duration**: ~115 minutes (45min + 15min halftime + 45min + ~10min added time)
- **Check window**: 120-180 minutes after match start
- **Why 120 minutes**: Ensures match has finished before updating standings
- **Why fixtures calendar**: Knows exactly when matches start, so we know when to check

### Process Flow

```
Every 15 minutes:
  ↓
Query fixtures table for matches started 120-180 min ago
  ↓
If matches found in calendar:
  ├─ Scrape match results from Rezultati.com
  ├─ Update fixtures table with final scores
  └─ Update standings table (always)
  ↓
If no matches found:
  └─ Exit quickly (minimal cost, no scraping)
```

### Efficiency Benefits

✅ **Uses fixtures calendar** - Knows when matches are scheduled  
✅ **Minimal work** - Only scrapes when matches are detected  
✅ **Fast exit** - Quick database query when no matches need updating  
✅ **Cost-effective** - Runs frequently but does little work when idle

## Key Features

✅ **Automatic** - No manual intervention needed  
✅ **Efficient** - Only runs when matches likely finished  
✅ **Reliable** - Uses Cheerio (works in serverless) instead of Puppeteer  
✅ **Complete** - Updates both results and standings together  

## Manual Update

If you need to manually update standings:

```bash
# Via API endpoint (after deployment)
curl -X POST https://plmatches.netlify.app/api/standings/update

# Or via Netlify Function
curl https://plmatches.netlify.app/.netlify/functions/update-standings
```

## Scheduled Updates

The function runs automatically:
- **Every 30 minutes** - Checks for finished matches
- **Every 6 hours** - Standalone standings update (via `update-standings` function)

## Database Structure

Standings are stored in the `standings` table with:
- `season`: "2025" (for 2025/26 season)
- `position`: League position (1-20)
- `club`: Team name
- `played`, `won`, `drawn`, `lost`: Match statistics
- `goals_for`, `goals_against`, `goal_difference`: Goal statistics
- `points`: Total points
- `form`: Last 5-6 results (W/D/L)

## Monitoring

Check Netlify Function logs to see:
- When matches are detected
- How many results were updated
- Standings update status
- Any errors that occur

## Troubleshooting

### Standings not updating
1. Check Netlify Function logs for errors
2. Verify Supabase credentials are set
3. Ensure matches exist in database with correct timestamps
4. Check if Rezultati.com is accessible

### Standings outdated
- The function only updates when matches finish (120 min after start)
- For immediate update, use manual trigger endpoint
- Check `cache_metadata` table for last update time
