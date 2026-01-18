# Data Quality Issue: Matchweek Assignments

## Executive Summary

Your question about including "postponed matches" in calculations led to discovering a **critical data quality issue**: **all 20 Premier League teams have incorrect matchweek assignments** in the 2024/25 season data.

**Good news**: These aren't actually postponed matches - they're **played matches assigned to wrong matchweeks**.  
**Bad news**: This affects ALL comparisons, standings, and statistics throughout your application.

## The Problem

### What You Asked
> "How could we include this postponed match into our calculation? Somewhere in the DB should also be written this postponed match or?"

### What We Found
The matches **are** in the database, but:
- Liverpool shows 20 matches through MW 21 (should be 21)
- Everton shows 20 matches through MW 21 (should be 21)
- Investigation revealed: **Every single team** has matchweek assignment errors

### Root Cause
Your scrapers are assigning incorrect matchweek numbers to fixtures, resulting in:
- **Missing matchweeks** (e.g., 16 teams missing MW 28)
- **Duplicate matchweeks** (e.g., 19 teams have 2-3 matches in MW 38)
- **Inconsistent data** across all teams

## Impact

### Features Affected
- ✅ **Two Clubs Comparison**: Shows incorrect "postponed match" warnings
- ✅ **Standings**: May calculate incorrect positions by matchweek  
- ✅ **Statistics**: "Through MW X" filters return wrong data
- ✅ **Historical Comparisons**: Inaccurate when using matchweek filters

### Examples of Issues
```
Arsenal (38 matches):
  Missing: MW 16, 28, 37
  Duplicates: MW 15 (2 matches), MW 38 (3 matches)

Liverpool (38 matches):
  Missing: MW 15, 30, 37
  Duplicates: MW 25 (2 matches), MW 38 (3 matches)

All 20 teams have similar issues.
```

## Why This Happened

### Possible Causes
1. **Source Website Issues**: Your scraping source may not provide accurate matchweek data
2. **Rescheduled Match Handling**: Scrapers may assign the "played date's matchweek" instead of "original scheduled matchweek"
3. **Multiple Scraping Sources**: Different sources may use different matchweek numbering
4. **No Validation**: No checks to ensure each team has exactly 1 match per matchweek

### Pattern Analysis
- **MW 28 missing for 16 teams** → Likely FA Cup weekend (no PL matches)
- **MW 38 has 19 duplicates** → Matches from other MWs incorrectly assigned here
- **Systematic across all teams** → Not random errors, but systematic scraper issue

## Solutions

### Option 1: Fix Existing Data (Recommended for Immediate Use)
**Use Official Premier League Data**

```bash
# Tools provided:
1. scripts/check-all-duplicates.ts - Verify current state
2. scripts/fix-matchweek-assignments.ts - Analyze issues per team  
3. scripts/reorganize-matchweeks-by-date.ts - Propose date-based groupings
```

**Steps:**
1. Get official PL fixture list from:
   - https://www.premierleague.com/fixtures
   - Fantasy Premier League API
   - https://www.football-data.org/
2. Match your fixtures to official ones (by teams + date)
3. Create mapping: `your_fixture_id → correct_matchweek`
4. Run batch update in Supabase

**Pros:** Fixes all historical data  
**Cons:** One-time manual effort required

### Option 2: Update Scraper Logic (Recommended for Future)
**Prevent Future Issues**

1. Use a reliable source that provides correct matchweeks
2. Add validation: Each team must have exactly 1 match per MW (1-38)
3. Add `original_matchweek` and `played_in_matchweek` fields
4. Implement data quality checks before inserting

**Pros:** Prevents future issues  
**Cons:** Doesn't fix existing data

### Option 3: Hybrid Approach (Best Long-term)
**Combine both solutions**

1. Fix existing data (Option 1)
2. Update scrapers (Option 2)
3. Add database schema:
   ```sql
   ALTER TABLE fixtures 
   ADD COLUMN original_matchweek INTEGER,
   ADD COLUMN is_rescheduled BOOLEAN DEFAULT false;
   ```
4. Use `original_matchweek` for all calculations
5. Display rescheduled status in UI when relevant

## Answering Your Original Question

### "How to include postponed matches in calculations?"

**For truly postponed matches (not yet played):**
- You **cannot** include them in points calculations
- No score = no points to award
- Best practice: Show them separately with status "postponed" or "scheduled"

**For your current situation:**
- These aren't actually postponed - they're **misassigned**
- Once you fix matchweek assignments, the issue will resolve
- All teams will show correct match counts through any matchweek

### Example After Fix:
```
Arsenal vs Liverpool (2024/25, At MW 21):
  Arsenal: 21 matches played ✅
  Liverpool: 21 matches played ✅
  No warning displayed ✅
```

## Recommended Action Plan

### Immediate (This Week)
1. ✅ Add warning banner in app:
   ```
   ⚠️  2024/25 season data is being verified. 
   Match counts may be inaccurate due to matchweek assignment issues.
   ```

2. ✅ Run `scripts/check-all-duplicates.ts` to document current state

3. ⚠️  Decide on fix strategy (manual vs automated)

### Short-term (Next 1-2 Weeks)
1. Obtain official Premier League 2024/25 fixture list
2. Create matchweek correction mapping
3. Test fixes on backup database
4. Apply corrections to production
5. Verify: Run `scripts/check-all-duplicates.ts` again (should show 0 issues)

### Long-term
1. Review and update scraper source/logic
2. Add data validation to scrapers
3. Implement automated quality checks
4. Add `original_matchweek` field for rescheduled matches
5. Document data sources and update procedures

## Tools Created for You

### Analysis Scripts
- `scripts/check-all-duplicates.ts` - Check all teams for duplicate/missing MWs
- `scripts/fix-matchweek-assignments.ts` - Detailed analysis per team
- `scripts/reorganize-matchweeks-by-date.ts` - Propose date-based MW groupings

### Documentation  
- `MATCHWEEK_ASSIGNMENT_ISSUE.md` - Detailed technical documentation
- `DATA_QUALITY_SUMMARY.md` - This file (executive summary)
- `COMPARE_MATCHES_PLAYED.md` - Original comparison feature documentation

### UI Improvements
- Added warning in TwoClubsComparison component when match counts differ
- Shows which team has "postponed" matches (will be accurate after data fix)

## Data Sources to Consider

### Official Sources
1. **Premier League Official**: https://www.premierleague.com/fixtures
2. **Fantasy PL API**: https://fantasy.premierleague.com/api/bootstrap-static/
3. **Football Data**: https://www.football-data.org/
4. **ESPN**: https://www.espn.com/soccer/fixtures/_/league/ENG.1

### API Options
- Most reliable: Fantasy Premier League (free, accurate matchweeks)
- Alternative: football-data.org (free tier available)

## Questions to Consider

1. **Which scraping source are you currently using?**
   - This will help identify why matchweeks are wrong

2. **Do you have access to the official Premier League API?**
   - Would be the most reliable source

3. **Are you tracking rescheduled matches separately?**
   - Important for future seasons

4. **Do you want to fix past seasons too (2023/24, etc.)?**
   - Same issue may exist in historical data

## Next Steps

Choose your approach:
- **Quick fix**: Use option 1 (fix current data manually)
- **Proper fix**: Use option 3 (hybrid approach)
- **Need help?**: I can create automated scripts once you provide official fixture data

The UI warning I implemented will work correctly once the data is fixed - it detects any mismatch in match counts and explains it to users.
