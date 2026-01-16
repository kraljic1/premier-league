# Data Refresh Scripts

This directory contains scripts to automatically refresh Premier League data on a schedule.

## Scripts

### `refresh-data.sh`
Shell script that calls the `/api/refresh` endpoint. Can be used with cron or any scheduler.

**Usage:**
```bash
# Default (http://localhost:3000)
./scripts/refresh-data.sh

# Custom API URL
API_URL=https://your-domain.com ./scripts/refresh-data.sh
```

### `refresh-data.js`
Node.js script that calls the `/api/refresh` endpoint. More robust error handling and cross-platform.

**Usage:**
```bash
# Default (http://localhost:3000)
node scripts/refresh-data.js

# Custom API URL
API_URL=https://your-domain.com node scripts/refresh-data.js
```

### `setup-cron.sh`
Helper script to automatically set up a cron job that runs the refresh script every hour.

**Usage:**
```bash
chmod +x scripts/setup-cron.sh
./scripts/setup-cron.sh
```

### `fetch-results-until-date.js`
Fetches all finished results from the current season until a specified date and saves them to a JSON file.

**Usage:**
```bash
# Default: fetches until 2026-01-07
node scripts/fetch-results-until-date.js

# Custom end date
node scripts/fetch-results-until-date.js 2026-01-07

# Custom end date and output file
END_DATE=2026-01-07 OUTPUT_FILE=my-results.json node scripts/fetch-results-until-date.js

# Custom API URL (if server is not on localhost:3000)
API_URL=https://your-domain.com node scripts/fetch-results-until-date.js 2026-01-07
```

**Note:** This script requires your Next.js server to be running. It calls the `/api/results` endpoint.

**Output:** Creates a JSON file (default: `results-until-date.json`) with:
- Metadata (fetch date, end date, total results, matchweeks)
- All results filtered by date and status

### `fetch-results-until-date.ts`
TypeScript version that runs scrapers directly (doesn't require server to be running).

**Usage:**
```bash
# Requires tsx: npm install -g tsx
npx tsx scripts/fetch-results-until-date.ts 2026-01-07
```

**Note:** This version runs the scrapers directly without needing the API server.

### `fetch-results-by-matchweek.ts`
Fetches all finished results for specific matchweeks and saves them directly to the database.

**Usage:**
```bash
# Fetch all matchweeks (1-38)
npx tsx scripts/fetch-results-by-matchweek.ts

# Fetch specific matchweeks
npx tsx scripts/fetch-results-by-matchweek.ts 1 5 10

# Fetch range of matchweeks
npx tsx scripts/fetch-results-by-matchweek.ts --start=1 --end=10

# Using environment variable
MATCHWEEKS=1,2,3,4,5 npx tsx scripts/fetch-results-by-matchweek.ts
```

**Note:** This script runs the scrapers directly and saves results to the Supabase database. Requires environment variables for Supabase connection.

**Features:**
- Fetches results from multiple sources (Rezultati.com, OneFootball, official Premier League site)
- Automatically saves results to database with proper status ('finished')
- Groups and displays results by matchweek
- Shows statistics and matchweek distribution

## Manual Cron Setup

If you prefer to set up cron manually:

### 1. Make script executable (if using shell script)
```bash
chmod +x scripts/refresh-data.sh
```

### 2. Edit crontab
```bash
crontab -e
```

### 3. Add cron job (runs every hour at minute 0)
```bash
# Refresh Premier League data every hour
0 * * * * cd /path/to/premier-league && node scripts/refresh-data.js >> logs/refresh.log 2>&1
```

Or with shell script:
```bash
0 * * * * cd /path/to/premier-league && ./scripts/refresh-data.sh >> logs/refresh.log 2>&1
```

## Cron Schedule Examples

- `0 * * * *` - Every hour at minute 0
- `0 */2 * * *` - Every 2 hours
- `0 9,12,15,18 * * *` - At 9 AM, 12 PM, 3 PM, and 6 PM daily
- `0 0 * * *` - Once per day at midnight
- `*/30 * * * *` - Every 30 minutes

## Environment Variables

Both scripts support the `API_URL` environment variable:

```bash
# For local development
API_URL=http://localhost:3000 node scripts/refresh-data.js

# For production
API_URL=https://your-domain.com node scripts/refresh-data.js
```

## Logs

Logs are written to `logs/refresh.log` when using cron. Create the directory if it doesn't exist:

```bash
mkdir -p logs
```

## Testing

Test the script manually before setting up cron:

```bash
# Test shell script
./scripts/refresh-data.sh

# Test Node.js script
node scripts/refresh-data.js
```

## Troubleshooting

1. **Script not executable**: Run `chmod +x scripts/refresh-data.sh`
2. **Cron not running**: Check cron service is running (`sudo service cron status` on Linux)
3. **API not accessible**: Ensure your Next.js server is running and accessible at the API_URL
4. **Permission errors**: Check file permissions and ensure the script can write to logs directory

## Production Deployment

For production (e.g., on Netlify, Vercel), consider:

1. **Vercel Cron Jobs**: Use Vercel's built-in cron functionality
2. **Netlify Scheduled Functions**: Use Netlify's scheduled functions
3. **External Cron Service**: Use services like cron-job.org or EasyCron
4. **Server Cron**: If you have a dedicated server, use system cron

### Vercel Cron Example

Create `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/refresh",
      "schedule": "0 * * * *"
    }
  ]
}
```

### Netlify Scheduled Function

Create `netlify/functions/scheduled-refresh.js`:
```javascript
exports.handler = async (event, context) => {
  // Call your refresh endpoint
  const response = await fetch('https://your-site.netlify.app/api/refresh', {
    method: 'POST',
  });
  return { statusCode: 200, body: 'Refreshed' };
};
```

Then configure in `netlify.toml`:
```toml
[build]
  functions = "netlify/functions"

[[plugins]]
  package = "@netlify/plugin-scheduled-functions"
```

