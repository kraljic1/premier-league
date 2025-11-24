#!/bin/bash

# Premier League Tracker - Data Refresh Script
# This script calls the refresh API endpoint to update all scraped data

API_URL="${API_URL:-http://localhost:3000}"
ENDPOINT="${API_URL}/api/refresh"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting data refresh..."

# Make POST request to refresh endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${ENDPOINT}" \
  -H "Content-Type: application/json" \
  --max-time 300)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Data refresh completed successfully"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Response: $BODY"
  exit 0
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] ❌ Data refresh failed with HTTP code: $HTTP_CODE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Response: $BODY"
  exit 1
fi

