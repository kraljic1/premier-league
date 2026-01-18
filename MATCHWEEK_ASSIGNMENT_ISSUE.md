# Matchweek Assignment Data Quality Issue

## Problem Summary

The database contains incorrect matchweek assignments for the 2024/25 season, causing:
- Teams to show different numbers of matches played through specific matchweeks
- Duplicate matchweek numbers (same team playing multiple matches in one MW)
- Missing matchweek numbers (no match assigned to certain MWs)

## Evidence

### Liverpool (38 total matches)
- **Missing**: MW 15, 30, 37 (3 matchweeks with no data)
- **Duplicates**: 
  - MW 25: 2 matches (vs Everton, vs Wolves)
  - MW 38: 3 matches (vs Arsenal, vs Brighton, vs Crystal Palace)
- **Impact**: Shows only 20 matches through MW 21 (should be 21)

### Everton (38 total matches)
- **Missing**: MW 16, 18, 28 (3 matchweeks with no data)
- **Duplicates**:
  - MW 17: 2 matches (vs Chelsea, vs Man City)
  - MW 25: 2 matches (vs Liverpool, vs Crystal Palace)
  - MW 38: 2 matches (vs Southampton, vs Newcastle)
- **Impact**: Shows only 20 matches through MW 21 (should be 21)

## Root Cause

The scrapers are likely:
1. Not getting correct matchweek data from the source
2. Assigning postponed/rescheduled matches to the matchweek they were actually played, not their original scheduled matchweek
3. Not handling rescheduled matches properly

In real Premier League:
- When a match is postponed (e.g., MW 15), it keeps its original matchweek number
- When it's rescheduled and played later, it's still recorded as MW 15
- This ensures consistency in standings and statistics

## Impact on Application

### Current Issues:
1. **Comparison Feature**: Shows incorrect "postponed match" warnings when it's actually a data issue
2. **Statistics**: Calculating points/stats "through MW 21" is inaccurate
3. **Standings**: May show incorrect positions if calculated by matchweek
4. **User Trust**: Inconsistent data reduces confidence in the application

## Solutions

### Option 1: Fix Existing Data (Recommended)
**Pros:**
- Corrects historical data
- Ensures accuracy for all features
- One-time fix

**Cons:**
- Requires identifying correct matchweeks for each misassigned match
- Needs Premier League official data as reference

**Steps:**
1. Fetch official Premier League fixture list with correct matchweeks
2. Match existing fixtures to official data
3. Update matchweek numbers in database
4. Verify no duplicates or gaps remain

### Option 2: Update Scraper Logic
**Pros:**
- Prevents future issues
- Handles rescheduled matches correctly

**Cons:**
- Doesn't fix existing data
- May not have access to original matchweek data from scrape sources

**Steps:**
1. Update scrapers to preserve original matchweek numbers
2. Add a separate field for "rescheduled_matchweek" or "played_in_matchweek"
3. Use original matchweek for calculations, display both

### Option 3: Use Match Date Instead
**Pros:**
- Doesn't rely on matchweek numbers
- More accurate for "progress through season"

**Cons:**
- Changes comparison logic significantly
- Doesn't align with how Premier League presents data

**Steps:**
1. Change filters from "matchweek <= X" to "date <= cutoff_date"
2. Calculate what date corresponds to "current progress"
3. Update UI to show "Through [Date]" instead of "Through MW X"

### Option 4: Hybrid Approach (Best Long-term)
**Pros:**
- Combines accuracy of official data with flexibility
- Handles both current and future data correctly

**Cons:**
- Most complex to implement
- Requires maintaining multiple data sources

**Steps:**
1. Fix existing data (Option 1)
2. Add database fields:
   - `original_matchweek` (official PL matchweek)
   - `played_in_matchweek` (actual gameweek it was played)
   - `is_rescheduled` (boolean flag)
3. Update scrapers (Option 2)
4. Use `original_matchweek` for all calculations
5. Display rescheduled status in UI

## Recommended Action Plan

### Immediate (Now):
1. ✅ Document the issue (this file)
2. ✅ Update UI to clarify when data may be inconsistent
3. ⚠️  Add admin warning about matchweek data quality

### Short-term (Next):
1. Create script to fetch official Premier League fixture list
2. Match and correct matchweek assignments
3. Run data validation to ensure:
   - Each team has exactly 1 match per matchweek (1-38)
   - No duplicate matchweeks per team
   - No missing matchweeks per team

### Long-term:
1. Add data validation to scrapers
2. Implement rescheduled match tracking
3. Add automated data quality checks
4. Consider using official Premier League API if available

## Data Sources for Correction

Potential sources for official matchweek data:
- Premier League official website: https://www.premierleague.com/
- ESPN: https://www.espn.com/soccer/
- BBC Sport: https://www.bbc.com/sport/football/
- Official Premier League API (if accessible)

## Testing After Fix

Verify that:
- [ ] Each team has exactly 38 matches for the season
- [ ] Each team has exactly 1 match in matchweeks 1-38
- [ ] Liverpool and Everton show 21 matches through MW 21
- [ ] No duplicate matchweek numbers per team
- [ ] No missing matchweek numbers per team
- [ ] Merseyside Derby appears in correct matchweeks
- [ ] All comparisons show correct match counts

## User Communication

Consider adding to UI:
```
⚠️  Note: Match data for 2024/25 season is being verified. 
Some matchweek assignments may be inaccurate for postponed/rescheduled matches.
```
