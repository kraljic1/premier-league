# Auto-Update Setup Guide

This guide explains how to set up automatic updates for match results after they finish.

## Quick Start

Run the auto-update script manually:

```bash
npx tsx scripts/auto-update-results.ts
```

Or use the shell script:

```bash
./scripts/auto-update.sh
```

## What the Script Does

1. **Fetches recent results** from Rezultati.com (last visible page)
2. **Checks scheduled matches** in the database that might have finished
3. **Updates match results** for matches that have completed
4. **Updates standings** after results are updated
5. **Updates cache metadata** to track last update time

## Setting Up Automatic Updates

### Option 1: Cron Job (Linux/macOS)

Edit your crontab:

```bash
crontab -e
```

Add one of these schedules:

```bash
# Run every 15 minutes on weekends (match days) between 11:00-23:00
*/15 11-23 * * 6,0 cd /Users/vidkraljic/Desktop/FIRMA/Code\ and\ Sail/PREMIER\ LEAGUE && ./scripts/auto-update.sh >> logs/auto-update.log 2>&1

# Run every 30 minutes, every day
*/30 * * * * cd /Users/vidkraljic/Desktop/FIRMA/Code\ and\ Sail/PREMIER\ LEAGUE && ./scripts/auto-update.sh >> logs/auto-update.log 2>&1

# Run every hour during typical match hours (11:00-23:00)
0 11-23 * * * cd /Users/vidkraljic/Desktop/FIRMA/Code\ and\ Sail/PREMIER\ LEAGUE && ./scripts/auto-update.sh >> logs/auto-update.log 2>&1
```

Create the logs directory first:

```bash
mkdir -p logs
```

### Option 2: launchd (macOS - Recommended)

Create a plist file at `~/Library/LaunchAgents/com.premierleague.autoupdate.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.premierleague.autoupdate</string>
    <key>ProgramArguments</key>
    <array>
        <string>/Users/vidkraljic/Desktop/FIRMA/Code and Sail/PREMIER LEAGUE/scripts/auto-update.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>900</integer><!-- Run every 15 minutes (900 seconds) -->
    <key>StandardOutPath</key>
    <string>/Users/vidkraljic/Desktop/FIRMA/Code and Sail/PREMIER LEAGUE/logs/auto-update.log</string>
    <key>StandardErrorPath</key>
    <string>/Users/vidkraljic/Desktop/FIRMA/Code and Sail/PREMIER LEAGUE/logs/auto-update-error.log</string>
    <key>WorkingDirectory</key>
    <string>/Users/vidkraljic/Desktop/FIRMA/Code and Sail/PREMIER LEAGUE</string>
</dict>
</plist>
```

Load the service:

```bash
# Create logs directory
mkdir -p "/Users/vidkraljic/Desktop/FIRMA/Code and Sail/PREMIER LEAGUE/logs"

# Load the service
launchctl load ~/Library/LaunchAgents/com.premierleague.autoupdate.plist

# Check status
launchctl list | grep premierleague

# To unload/stop:
launchctl unload ~/Library/LaunchAgents/com.premierleague.autoupdate.plist
```

### Option 3: Netlify Scheduled Functions

If deployed on Netlify, you can use scheduled functions. Add to `netlify.toml`:

```toml
[functions."auto-update"]
  schedule = "*/15 * * * *"
```

Then create a serverless function that calls the update logic.

## Typical Match Schedule

Premier League matches typically happen:
- **Saturday**: 12:30, 15:00, 17:30 (UK time)
- **Sunday**: 14:00, 16:30 (UK time)
- **Midweek**: 19:45, 20:00 (UK time) - usually Tuesday/Wednesday

Adjust your schedule accordingly. A good balance:
- Run every **15 minutes** during match hours on weekends
- Run every **30 minutes** during weekday evening hours
- Run **hourly** at other times

## Monitoring

Check the logs:

```bash
# View recent logs
tail -f logs/auto-update.log

# View errors
tail -f logs/auto-update-error.log
```

Check last update time in database:

```sql
SELECT * FROM cache_metadata WHERE key = 'last_auto_update';
```

## Troubleshooting

### Script not running

1. Check if Node.js/npx is available in the cron environment
2. Ensure the script has execute permissions: `chmod +x scripts/auto-update.sh`
3. Check that `.env.local` has correct Supabase credentials

### No results being updated

1. Ensure matches have actually finished
2. Check that the scheduled matches exist in the database
3. Verify Rezultati.com is accessible

### Standings not updating

1. Check if premierleague.com is accessible
2. The standings scraper may need updating if the website structure changed
