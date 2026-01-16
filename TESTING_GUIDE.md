# Testing Guide for Compare Season Feature

This guide will help you test and debug the SofaScore scraper step by step.

## Prerequisites

1. ✅ Database migration completed (`004_add_season_to_fixtures.sql`)
2. ✅ Dependencies installed (`npm install`)
3. ✅ Environment variables set (Supabase credentials)

## Step-by-Step Testing Process

### Step 1: Inspect SofaScore Page Structure

**Purpose:** Understand how SofaScore structures their page to identify correct selectors.

```bash
npx tsx scripts/inspect-sofascore-page.ts
```

**What it does:**
- Opens SofaScore Premier League page
- Identifies navigation buttons
- Finds match elements
- Detects team name selectors
- Takes a screenshot for manual inspection
- Saves results to `sofascore-inspection.png`

**What to look for:**
- Navigation button selectors (previous/next matchweek)
- Match container classes or data attributes
- Team name element structure
- Score element structure

**If selectors are found:**
- Update `lib/scrapers/sofascore-navigation.ts` with correct button selectors
- Update `lib/scrapers/sofascore-element-extraction.ts` with correct match selectors

### Step 2: Test Single Matchweek Scraping

**Purpose:** Test if you can scrape one matchweek successfully before trying all 38.

```bash
# Test matchweek 38 (last matchweek)
npx tsx scripts/test-scraper-single-matchweek.ts 38

# Or test any other matchweek
npx tsx scripts/test-scraper-single-matchweek.ts 1
```

**What it does:**
- Navigates to specified matchweek
- Extracts matches from that matchweek
- Validates the data
- Shows detailed debugging info if no matches found

**Expected output:**
- Should find ~10 matches per matchweek (20 teams = 10 matches)
- Each match should have valid team names and scores
- Team names should match your club names

**If it fails:**
- Check the debugging info in the output
- Review the selectors found in Step 1
- Update selectors and try again

### Step 3: Test Full Season Scraping

**Purpose:** Test scraping an entire historical season.

```bash
npx tsx scripts/test-sofascore-scraper.ts
```

**What it does:**
- Scrapes all 38 matchweeks for 2023/2024 season
- Shows progress for each matchweek
- Displays summary statistics
- Groups results by matchweek

**Expected output:**
- ~380 matches total (38 matchweeks × ~10 matches)
- All matchweeks 1-38 should be present
- Each matchweek should have ~10 matches

**If it fails:**
- Check which matchweeks failed
- Review error messages
- May need to adjust delays or selectors

### Step 4: Test via UI

**Purpose:** Test the full user experience.

1. Start dev server: `npm run dev`
2. Navigate to `/compare-season`
3. Select a club (e.g., "Arsenal")
4. Select a season (e.g., "2023/2024")
5. Click "Scrape 2023/2024 Season Data"
6. Wait for scraping to complete (may take several minutes)
7. Verify comparison displays correctly

**What to verify:**
- Scraping progress indicator works
- Data is stored in database
- Comparison shows correct stats
- Points calculations are accurate

## Common Issues & Solutions

### Issue: No matches found

**Symptoms:**
- Scraper returns 0 results
- Test script shows "No matches found"

**Solutions:**
1. Run `inspect-sofascore-page.ts` to see actual page structure
2. Check if SofaScore requires authentication
3. Verify selectors match actual page elements
4. Check browser console for JavaScript errors
5. Try increasing wait times in `sofascore-historical.ts`

### Issue: Team names don't match

**Symptoms:**
- Teams scraped but names are wrong (e.g., "Man City" instead of "Manchester City")
- Comparison shows "No Data" even though matches exist

**Solutions:**
1. Check `lib/scrapers/sofascore-team-mapper.ts`
2. Add new mappings to `TEAM_NAME_MAPPINGS` object
3. Run test again to verify mapping works

**Example mapping:**
```typescript
const TEAM_NAME_MAPPINGS: Record<string, string> = {
  "Man City": "Manchester City",
  "Your SofaScore Name": "Your Club Name",
};
```

### Issue: Navigation doesn't work

**Symptoms:**
- Scraper stuck on one matchweek
- Can't navigate to previous/next matchweek

**Solutions:**
1. Run `inspect-sofascore-page.ts` to find correct button selectors
2. Update selectors in `sofascore-navigation.ts`
3. Check if buttons are disabled/hidden
4. Try different selector patterns (aria-label, class, data-testid)

### Issue: Rate limiting

**Symptoms:**
- Scraper stops mid-way
- Network errors
- Page access denied

**Solutions:**
1. Increase delays in `sofascore-historical.ts`:
   ```typescript
   await new Promise(resolve => setTimeout(resolve, 3000)); // Increase from 2000
   ```
2. Scrape during off-peak hours
3. Add exponential backoff for retries

### Issue: Database errors

**Symptoms:**
- Scraping works but data not saved
- API returns database errors

**Solutions:**
1. Verify migration ran successfully
2. Check Supabase RLS policies
3. Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
4. Check Supabase logs for detailed errors

## Debugging Tips

### Enable verbose logging

Add more console.logs in:
- `lib/scrapers/sofascore-historical.ts` - Main scraper flow
- `lib/scrapers/sofascore-navigation.ts` - Navigation debugging
- `lib/scrapers/sofascore-element-extraction.ts` - Extraction debugging

### Use browser DevTools

1. Run scraper with `headless: false` in `browser.ts`:
   ```typescript
   browserInstance = await puppeteer.launch({
     headless: false, // Change to false
   });
   ```
2. Watch the browser navigate
3. Inspect elements manually
4. Check console for errors

### Test incrementally

1. Start with one matchweek (use `test-scraper-single-matchweek.ts`)
2. Once that works, test 5 matchweeks
3. Then test full season

### Check network requests

Monitor network tab in DevTools to see:
- If requests are being blocked
- Response status codes
- Any API errors

## Success Criteria

✅ **Scraper works when:**
- Can navigate between matchweeks
- Extracts ~10 matches per matchweek
- Team names match your club names
- Scores are correctly extracted
- All 38 matchweeks can be scraped
- Data is stored in database
- UI displays comparison correctly

## Next Steps After Testing

Once testing is successful:

1. **Remove test scripts** (optional, or keep for future debugging)
2. **Document any custom mappings** added to `sofascore-team-mapper.ts`
3. **Update selectors** if SofaScore structure changes
4. **Monitor scraping** in production for any issues
5. **Add caching** to avoid re-scraping same seasons

## Getting Help

If you're stuck:

1. Check `NEXT_STEPS.md` for troubleshooting
2. Review `COMPARE_SEASON_SETUP.md` for setup details
3. Check browser console and server logs
4. Run inspection scripts to understand page structure
5. Test incrementally (one matchweek → full season)

## Quick Reference

```bash
# Inspect page structure
npx tsx scripts/inspect-sofascore-page.ts

# Test single matchweek
npx tsx scripts/test-scraper-single-matchweek.ts 38

# Test full season
npx tsx scripts/test-sofascore-scraper.ts

# Start dev server
npm run dev

# Check database
# Run in Supabase SQL Editor:
SELECT season, COUNT(*) FROM fixtures GROUP BY season;
```
