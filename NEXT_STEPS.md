# Next Steps to Complete Compare Season Feature

## ✅ Completed

1. ✅ Database migration created (`004_add_season_to_fixtures.sql`)
2. ✅ CSV import script implemented (`scripts/import-csv-results.ts`)
3. ✅ API endpoints created (`/api/historical-season`)
4. ✅ UI components created (Compare Season page)
5. ✅ Navigation updated
6. ✅ Documentation created (`COMPARE_SEASON_SETUP.md`)
7. ✅ Historical data imported (2020/21 - 2024/25 seasons)

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

### 2. Import Historical Data

**Import CSV files:**

```bash
npx tsx scripts/import-csv-results.ts
```

This will:
- Import all 5 seasons (2020/21 - 2024/25)
- Parse and normalize team names
- Assign matchweeks correctly
- Save 1,900 fixtures to database

### 3. Verify Data Quality

After importing, verify:
- ✅ All 5 seasons are imported
- ✅ Each season has 380 fixtures (38 matchweeks × 10 matches)
- ✅ Team names match your club names
- ✅ Scores are correctly imported
- ✅ Dates are reasonable

**Check script:**
```bash
npx tsx scripts/check-historical-seasons.ts
```

### 4. Test the Feature

**Via UI:**
1. Start your dev server: `npm run dev`
2. Navigate to `/compare-season`
3. Select a club and season
4. View the comparison between current season and selected season

### 5. Handle Edge Cases

**Potential issues to watch for:**

1. **Team name mismatches:**
   - CSV files might use different team names
   - Script includes normalization (e.g., "Man Utd" → "Manchester United")
   - Check `scripts/import-csv-results.ts` for team mappings

2. **Missing data:**
   - Verify all CSV files are present in `results/` folder
   - Check import script logs for any skipped fixtures

3. **Matchweek assignment:**
   - Script calculates matchweeks from dates
   - Verify matchweeks are 1-38 for each season

### 6. Production Considerations

**Before deploying:**

1. **Environment variables:**
   - Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
   - Ensure `NEXT_PUBLIC_SUPABASE_URL` is set

2. **Data import:**
   - CSV files should be committed to repository
   - Import script can be run on deployment if needed

3. **Error handling:**
   - Import script includes error handling
   - Failed seasons are logged but don't stop the process

## 🐛 Troubleshooting

### No data found
- Verify CSV files exist in `results/` folder
- Check that import script ran successfully
- Run `scripts/check-historical-seasons.ts` to verify

### Import errors
- Ensure `.env.local` has correct Supabase credentials
- Check that database migration has been run
- Verify CSV file format matches expected structure

### Database errors
- Verify migration ran successfully
- Check RLS policies allow inserts
- Verify service role key has permissions

## 📝 Testing Checklist

- [x] Database migration completed
- [x] CSV import script runs successfully
- [x] All 5 seasons imported (1,900 fixtures)
- [x] Team names are correctly normalized
- [x] Matchweeks are correctly assigned (1-38)
- [x] UI can display comparison data
- [x] Comparison calculations are correct

## 🎯 Success Criteria

The feature is complete when:
1. ✅ Database migration is applied
2. ✅ Historical data is imported from CSV files
3. ✅ Data is stored correctly in database
4. ✅ UI displays comparison correctly
5. ✅ Points calculations are accurate
6. ✅ Error handling works gracefully

## 📚 Additional Resources

- See `COMPARE_SEASON_SETUP.md` for detailed setup instructions
- Check `scripts/import-csv-results.ts` for import implementation
- Review `app/api/historical-season/route.ts` for API documentation
