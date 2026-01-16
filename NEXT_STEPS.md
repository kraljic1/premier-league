# Next Steps to Complete Compare Season Feature

## ✅ Completed

1. ✅ Database migration created (`004_add_season_to_fixtures.sql`)
2. ✅ SofaScore scraper implemented (modular, <200 lines per file)
3. ✅ API endpoints created (`/api/historical-season`)
4. ✅ UI components created (Compare Season page)
5. ✅ Navigation updated
6. ✅ Documentation created (`COMPARE_SEASON_SETUP.md`)
7. ✅ Test script created (`scripts/test-sofascore-scraper.ts`)
8. ✅ Navigation logic improved with better error handling

## 🔧 Next Steps

### 1. Run Database Migration (REQUIRED)

**Before using the feature, you must run the migration:**

1. Open Supabase Dashboard → SQL Editor
2. Run the migration file: `database/migrations/004_add_season_to_fixtures.sql`
3. Verify the migration:
```sql
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'fixtures' AND column_name = 'season';
```

### 2. Test the Scraper

**Option A: Test via Script (Recommended)**
```bash
npx tsx scripts/test-sofascore-scraper.ts
```

This will:
- Test scraping a historical season (2023/2024)
- Show you what data is extracted
- Help identify any selector issues

**Option B: Test via UI**
1. Start your dev server: `npm run dev`
2. Navigate to `/compare-season`
3. Select a club and season
4. Click "Scrape [Season] Season Data"
5. Monitor the browser console and server logs

### 3. Adjust Scraper Selectors (If Needed)

**If the scraper doesn't work, you'll need to:**

1. **Inspect SofaScore page structure:**
   - Visit: https://www.sofascore.com/tournament/football/england/premier-league/17
   - Open browser DevTools
   - Inspect the matchweek navigation buttons
   - Inspect match elements

2. **Update selectors in:**
   - `lib/scrapers/sofascore-navigation.ts` - For navigation buttons
   - `lib/scrapers/sofascore-element-extraction.ts` - For match elements

3. **Common selector patterns to look for:**
   - Matchweek buttons: Check aria-labels, classes, data attributes
   - Match cards: Look for container classes, data-testid attributes
   - Team names: Check for specific class patterns
   - Scores: Look for score containers

### 4. Verify Data Quality

After scraping, verify:
- ✅ All 38 matchweeks are present
- ✅ Each matchweek has ~10 matches (20 teams = 10 matches per week)
- ✅ Team names match your club names in `lib/clubs.ts`
- ✅ Scores are correctly extracted
- ✅ Dates are reasonable (not all the same date)

### 5. Handle Edge Cases

**Potential issues to watch for:**

1. **Team name mismatches:**
   - SofaScore might use different team names
   - Add name mapping in `lib/scrapers/sofascore-element-extraction.ts`

2. **Missing data:**
   - Some matchweeks might not be accessible
   - Handle gracefully (log warnings, continue)

3. **Rate limiting:**
   - If you get blocked, increase delays in `sofascore-historical.ts`
   - Current delay: 2 seconds between matchweeks

### 6. Production Considerations

**Before deploying:**

1. **Environment variables:**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` is set

2. **Rate limiting:**
   - Consider adding a queue system for scraping requests
   - Add user feedback during long scraping operations

3. **Error handling:**
   - Add retry logic for failed matchweeks
   - Store partial results if scraping fails mid-way

4. **Caching:**
   - Consider caching scraped seasons
   - Add a "last scraped" timestamp

## 🐛 Troubleshooting

### Scraper returns 0 results
- Check browser console for errors
- Verify selectors match actual page structure
- Try manually navigating SofaScore to see the actual structure
- Check if SofaScore requires authentication/cookies

### Navigation doesn't work
- Verify matchweek buttons exist on the page
- Check if buttons are disabled/hidden
- Try different selector patterns
- Add more wait time between clicks

### Team names don't match
- Create a mapping function in `sofascore-element-extraction.ts`
- Map SofaScore names to your club names
- Example: "Man City" → "Manchester City"

### Database errors
- Verify migration ran successfully
- Check RLS policies allow inserts
- Verify service role key has permissions

## 📝 Testing Checklist

- [ ] Database migration completed
- [ ] Test scraper script runs without errors
- [ ] Can scrape at least one matchweek successfully
- [ ] Team names are correctly extracted
- [ ] Scores are correctly extracted
- [ ] Dates are reasonable
- [ ] UI can display scraped data
- [ ] Comparison calculations are correct
- [ ] Error handling works for failed scrapes

## 🎯 Success Criteria

The feature is complete when:
1. ✅ Database migration is applied
2. ✅ Scraper can extract data from SofaScore
3. ✅ Data is stored correctly in database
4. ✅ UI displays comparison correctly
5. ✅ Points calculations are accurate
6. ✅ Error handling works gracefully

## 📚 Additional Resources

- See `COMPARE_SEASON_SETUP.md` for detailed setup instructions
- Check `lib/scrapers/` for scraper implementation details
- Review `app/api/historical-season/route.ts` for API documentation
