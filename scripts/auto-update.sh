#!/bin/bash

# Premier League Tracker - Auto Update Shell Script
# 
# This script runs the auto-update-results.ts script to update match results.
# It's designed to be called by cron or other schedulers.
#
# Usage:
#   ./scripts/auto-update.sh
#
# Cron examples:
#   # Run every 15 minutes on match days (Saturday/Sunday) between 11:00-23:00
#   */15 11-23 * * 6,0 /path/to/project/scripts/auto-update.sh >> /path/to/logs/auto-update.log 2>&1
#
#   # Run every hour every day
#   0 * * * * /path/to/project/scripts/auto-update.sh >> /path/to/logs/auto-update.log 2>&1
#
#   # Run every 30 minutes during typical match times (Sat 12-22, Sun 13-22)
#   */30 12-22 * * 6 /path/to/project/scripts/auto-update.sh
#   */30 13-22 * * 0 /path/to/project/scripts/auto-update.sh

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Change to project directory
cd "$PROJECT_DIR"

# Log start time
echo ""
echo "========================================"
echo "Auto-update started at $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"

# Check if npx is available
if ! command -v npx &> /dev/null; then
    echo "Error: npx is not installed or not in PATH"
    exit 1
fi

# Run the TypeScript script
npx tsx scripts/auto-update-results.ts

# Capture exit code
EXIT_CODE=$?

# Log completion
echo "========================================"
echo "Auto-update finished at $(date '+%Y-%m-%d %H:%M:%S') with exit code: $EXIT_CODE"
echo "========================================"

exit $EXIT_CODE
