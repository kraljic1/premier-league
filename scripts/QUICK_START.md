# Quick Start - Hourly Data Refresh

## Option 1: Automatic Setup (Recommended)

Run the setup script to automatically configure cron:

```bash
npm run setup-cron
```

This will:
- Set up a cron job that runs every hour
- Create a logs directory
- Configure logging to `logs/refresh.log`

## Option 2: Manual Setup

### Step 1: Test the script

```bash
# Make sure your Next.js server is running first!
npm run dev

# In another terminal, test the refresh script
npm run refresh
```

### Step 2: Set up cron manually

```bash
# Edit your crontab
crontab -e

# Add this line (runs every hour at minute 0)
0 * * * * cd /Users/vidkraljic/Desktop/FIRMA/Code\ and\ Sail/PREMIER\ LEAGUE && npm run refresh >> logs/refresh.log 2>&1
```

**Important:** Replace the path with your actual project path!

### Step 3: Verify cron is set up

```bash
# View your cron jobs
crontab -l

# Check logs (after first run)
tail -f logs/refresh.log
```

## For Production (Netlify/Vercel)

### Vercel

Add to `vercel.json`:
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

### Netlify

Use Netlify Scheduled Functions or an external cron service like:
- cron-job.org
- EasyCron
- GitHub Actions (with scheduled workflows)

## Troubleshooting

1. **Script fails**: Make sure your Next.js server is running
2. **Cron not running**: Check cron service status
3. **Permission denied**: Run `chmod +x scripts/*.sh`
4. **API URL wrong**: Set `API_URL` environment variable

