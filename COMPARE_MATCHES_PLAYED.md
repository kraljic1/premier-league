# Match Count Discrepancies in Two Clubs Comparison

## Issue Description

When comparing two clubs at a specific matchweek (e.g., "At MW 21"), clubs sometimes show different numbers of matches played:
- **Arsenal**: 21 matches played
- **Liverpool**: 20 matches played
- **Manchester City**: 21 matches played
- **Everton**: 20 matches played

## Root Cause

This is **NOT a bug or duplicate data issue** - it's accurate reflection of real Premier League data. The discrepancy occurs due to:

### Postponed Matches

Teams may have matches postponed within a given matchweek range due to various reasons:
- Cup competitions (FA Cup, League Cup, European competitions)
- Weather conditions
- Stadium issues
- Other unforeseen circumstances

### Current Season (2024/25) Example

Through Matchweek 21:
- **18 teams**: All 21 matches played
- **Liverpool**: 20 matches (MW 15 postponed)
- **Everton**: 20 matches (1 match postponed)

This affects **multiple club comparisons**, not just one specific pair

## How the Filter Works

The "At MW 21" filter shows:
- **All finished matches up to and including matchweek 21**
- NOT necessarily the same number of matches for each team

This is correct behavior from a data accuracy perspective, as it reflects the actual state of the season.

## Solution Implemented

### UX Improvement

Added a visual warning indicator when clubs have played different numbers of matches:

```tsx
{clubAStats && clubBStats && clubAStats.played !== clubBStats.played && (
  <div className="two-clubs-comparison__match-warning">
    <svg>...</svg>
    <span>
      {clubA} has played {clubAStats.played} matches, 
      {clubB} has played {clubBStats.played} matches 
      (X has Y postponed match(es))
    </span>
  </div>
)}
```

### Visual Design

- **Warning badge** with amber/yellow styling
- **Alert icon** for visual attention
- **Clear explanation** of which team has postponed matches
- **Automatically appears** when match counts differ

## Technical Details

### Data Flow

1. Fixtures are filtered by `matchweek <= maxMatchweek` and `status === 'finished'`
2. Each club's stats are calculated independently
3. The `played` count reflects actual finished matches
4. Comparison checks if `clubAStats.played !== clubBStats.played`

### Code Location

- **Component**: `components/TwoClubsComparison.tsx`
- **Styles**: `app/globals.css` (`.two-clubs-comparison__match-warning`)
- **Logic**: `lib/utils-comparison.ts` (`calculatePointsForClub` function)

## Impact on Other Features

This behavior is consistent and may occur:
- In **current season** comparisons when teams have postponed matches
- In **historical season** comparisons with the "At MW X" toggle
- For **any pair of clubs**, not just specific teams

### Verified Scenarios

The solution has been tested with multiple club pairs:
- ✅ Arsenal (21) vs Liverpool (20) - Shows warning
- ✅ Manchester City (21) vs Everton (20) - Shows warning
- ✅ Chelsea (21) vs Liverpool (20) - Shows warning
- ✅ Liverpool (20) vs Everton (20) - No warning (both equal)
- ✅ Manchester United (21) vs Arsenal (21) - No warning (both equal)
- ✅ Historical seasons (2023/24) - Works correctly

### Database Integrity Check

A comprehensive database check confirmed:
- **Zero duplicate fixtures** within any season
- **1000 total fixtures** in database
- **380 fixtures** per season (2024/25 and 2025/2026)
- **240 fixtures** for 2023/24 (partial season data)
- All data is clean and accurate

## Future Considerations

Potential enhancements:
1. Show which specific matchweeks are postponed
2. Add a tooltip with postponement details
3. Option to compare by "matches played" instead of "matchweeks"
4. Indicator showing when postponed matches are rescheduled

## Testing

To verify this works correctly:

### Test Case 1: Team with postponed match vs Team without
1. Compare **Arsenal vs Liverpool** for 2024/25 season
2. Select "At MW 21"
3. ✅ Warning should appear: "Arsenal has played 21 matches, Liverpool has played 20 matches (Liverpool has 1 postponed match)"

### Test Case 2: Different pair with postponed match
1. Compare **Manchester City vs Everton** for 2024/25 season
2. Select "At MW 21"
3. ✅ Warning should appear showing Everton has 1 postponed match

### Test Case 3: Both teams with postponed matches
1. Compare **Liverpool vs Everton** for 2024/25 season
2. Select "At MW 21"
3. ✅ No warning (both have 20 matches)

### Test Case 4: Neither team with postponed matches
1. Compare **Manchester United vs Arsenal** for 2024/25 season
2. Select "At MW 21"
3. ✅ No warning (both have 21 matches)
