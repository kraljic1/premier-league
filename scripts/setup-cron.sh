#!/bin/bash

# Setup cron job for automatic data refresh
# This script adds a cron job to refresh data every hour

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CRON_LOG_DIR="$PROJECT_DIR/logs"

# Create logs directory if it doesn't exist
mkdir -p "$CRON_LOG_DIR"

# Determine which script to use (prefer Node.js if available, otherwise shell)
if command -v node &> /dev/null; then
  REFRESH_SCRIPT="$SCRIPT_DIR/refresh-data.js"
  CMD="cd $PROJECT_DIR && node $REFRESH_SCRIPT"
else
  REFRESH_SCRIPT="$SCRIPT_DIR/refresh-data.sh"
  chmod +x "$REFRESH_SCRIPT"
  CMD="cd $PROJECT_DIR && $REFRESH_SCRIPT"
fi

# Cron job runs every hour at minute 0
CRON_JOB="0 * * * * $CMD >> $CRON_LOG_DIR/refresh.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "refresh-data"; then
  echo "⚠️  Cron job already exists. Removing old entry..."
  crontab -l 2>/dev/null | grep -v "refresh-data" | crontab -
fi

# Add new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job installed successfully!"
echo ""
echo "The data refresh will run every hour at minute 0."
echo "Logs will be written to: $CRON_LOG_DIR/refresh.log"
echo ""
echo "To view current cron jobs: crontab -l"
echo "To remove this cron job: crontab -e (then delete the line)"
echo ""
echo "Note: Make sure your Next.js server is running and accessible at the API_URL"
echo "      (default: http://localhost:3000)"

