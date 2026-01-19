import { Handler, schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

/**
 * Netlify Scheduled Function - Scheduled Auto Update
 * 
 * Uses pre-calculated schedule from schedule-updates function:
 * - Checks scheduled_updates table FIRST (super quick database query)
 * - Only runs when matches are scheduled to finish (pre-calculated)
 * - Updates both match results and standings automatically
 * 
 * Schedule: Runs every 5 minutes (just to check if it's time)
 * 
 * How it works:
 * 1. Daily scheduler (schedule-updates) analyzes fixtures and creates schedule
 * 2. This function checks scheduled_updates table every 5 minutes
 * 3. If update_time matches current time → scrape & update
 * 4. If no scheduled updates → exit immediately (<1 second)
 * 
 * This way it ONLY runs when matches actually finish (based on pre-calculated schedule)
 */

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || "";
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const REZULTATI_URL = "https://www.rezultati.com/nogomet/engleska/premier-league/rezultati/";
const REZULTATI_STANDINGS_URL = "https://www.rezultati.com/nogomet/engleska/premier-league/tablica/";

// Match duration: 45min + 15min halftime + 45min + ~10min added time = ~115min
// Adding buffer for delays: check matches that started 100-240 minutes ago
// WIDENED: Increased window to catch delayed matches and ensure updates
const CHECK_WINDOW_START_MS = 100 * 60 * 1000;  // 100 minutes (match likely finishing)
const CHECK_WINDOW_END_MS = 240 * 60 * 1000;    // 240 minutes (4 hours max window)

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  matchweek: number;
}

interface ScheduledMatch {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  status: string;
}

interface Standing {
  position: number;
  club: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: string;
}

/**
 * Check scheduled_updates table to see if it's time to update
 * Uses pre-calculated schedule from daily scheduler function
 * 
 * IMPROVED: Wider time window (30 min) and no status filter to catch all updates
 */
async function getMatchesToUpdate(): Promise<ScheduledMatch[]> {
  const now = new Date();
  
  // Check scheduled_updates table for updates that should run now
  // WIDENED: Allow 30 minute window to catch any missed updates
  const timeWindowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
  const timeWindowEnd = new Date(now.getTime() + 5 * 60 * 1000); // 5 min in future
  
  console.log(`[AutoUpdate] Checking scheduled updates:`);
  console.log(`  Time window: ${timeWindowStart.toISOString()} to ${timeWindowEnd.toISOString()}`);
  
  // First try scheduled_updates table (if it exists)
  const { data: scheduledUpdates, error: scheduledError } = await supabase
    .from("scheduled_updates")
    .select("match_id, home_team, away_team, match_start")
    .gte("update_time", timeWindowStart.toISOString())
    .lte("update_time", timeWindowEnd.toISOString())
    .order("update_time", { ascending: true });
  
  if (!scheduledError && scheduledUpdates && scheduledUpdates.length > 0) {
    console.log(`[AutoUpdate] Found ${scheduledUpdates.length} scheduled update(s):`);
    scheduledUpdates.forEach(s => {
      console.log(`  - ${s.home_team} vs ${s.away_team} (scheduled update)`);
    });
    
    // Get full match details from fixtures table
    // FIX: scheduled_updates.match_id includes suffixes (primary/secondary/final),
    // so we match by date + team names instead of fixture id.
    const fixturesToUpdate: ScheduledMatch[] = [];
    const seenFixtureIds = new Set<string>();
    
    for (const scheduled of scheduledUpdates) {
      const dateOnly = new Date(scheduled.match_start).toISOString().split("T")[0];
      const dateStart = `${dateOnly}T00:00:00.000Z`;
      const dateEnd = `${dateOnly}T23:59:59.999Z`;
      
      const { data: fixtures } = await supabase
        .from("fixtures")
        .select("id, date, home_team, away_team, status")
        .gte("date", dateStart)
        .lte("date", dateEnd);
      
      const normalizedHome = normalizeTeamName(scheduled.home_team);
      const normalizedAway = normalizeTeamName(scheduled.away_team);
      
      const matchingFixture = (fixtures || []).find((fixture) => {
        const dbHome = normalizeTeamName(fixture.home_team);
        const dbAway = normalizeTeamName(fixture.away_team);
        return dbHome === normalizedHome && dbAway === normalizedAway;
      });
      
      if (matchingFixture && !seenFixtureIds.has(matchingFixture.id)) {
        fixturesToUpdate.push(matchingFixture);
        seenFixtureIds.add(matchingFixture.id);
      }
    }
    
    // Return all matches, we'll update them with results regardless of current status
    return fixturesToUpdate;
  }
  
  // Fallback: If scheduled_updates table doesn't exist or is empty, use old method
  // IMPROVED: Check wider window and include matches that might already be marked as 'live'
  console.log(`[AutoUpdate] No scheduled updates found, checking fixtures calendar (fallback)...`);
  
  const windowStart = new Date(now.getTime() - CHECK_WINDOW_END_MS); // 180 min ago
  const windowEnd = new Date(now.getTime() - CHECK_WINDOW_START_MS); // 120 min ago
  
  // FIX: Check for both 'scheduled' and 'live' status matches
  // Also check for matches without scores that might have been partially updated
  const { data, error } = await supabase
    .from("fixtures")
    .select("id, date, home_team, away_team, status")
    .in("status", ["scheduled", "live"])
    .gte("date", windowStart.toISOString())
    .lte("date", windowEnd.toISOString())
    .order("date", { ascending: true });
  
  if (error) {
    console.error("[AutoUpdate] Error querying fixtures:", error);
    return [];
  }
  
  const matches = data || [];
  
  if (matches.length > 0) {
    console.log(`[AutoUpdate] Found ${matches.length} match(es) via fallback method`);
  } else {
    console.log(`[AutoUpdate] No matches found - skipping update`);
  }
  
  return matches;
}

/**
 * Parse date string from DD.MM. HH:mm format
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  const ddmmTime = dateStr.match(/(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})/);
  if (ddmmTime) {
    const day = parseInt(ddmmTime[1]);
    const month = parseInt(ddmmTime[2]) - 1;
    const hour = parseInt(ddmmTime[3]);
    const minute = parseInt(ddmmTime[4]);
    const currentYear = month >= 7 ? 2025 : 2026;
    return new Date(currentYear, month, day, hour, minute);
  }
  
  return null;
}

/**
 * Check if two teams are derby rivals
 */
function isDerby(home: string, away: string): boolean {
  const h = home.toLowerCase();
  const a = away.toLowerCase();
  
  const derbies = [
    ["arsenal", "tottenham"],
    ["arsenal", "chelsea"],
    ["liverpool", "manchester utd"],
    ["liverpool", "everton"],
    ["manchester city", "manchester utd"],
    ["chelsea", "tottenham"],
  ];
  
  return derbies.some(([t1, t2]) => 
    (h.includes(t1) && a.includes(t2)) || (h.includes(t2) && a.includes(t1))
  );
}

/**
 * Fetch results from our custom scraping API
 * Uses Next.js API route that handles Puppeteer scraping
 */
async function fetchResults(): Promise<MatchResult[]> {
  console.log("[AutoUpdate] Fetching results from scraping API...");

  try {
    // Get the base URL for the API call
    const baseUrl = process.env.URL || process.env.NETLIFY_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/scrape-results`;

    console.log(`[AutoUpdate] Calling scraping API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-AutoUpdate/1.0',
      },
      // Add timeout for the API call
      signal: AbortSignal.timeout(60000), // 60 seconds
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[AutoUpdate] Scrape API error ${response.status} ${response.statusText}: ${errorText}`);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API returned error: ${data.error}`);
    }

    const results = data.results || [];
    console.log(`[AutoUpdate] API returned ${results.length} results`);

    // Convert API results to MatchResult format
    const matchResults: MatchResult[] = results.map((result: any) => ({
      homeTeam: result.homeTeam,
      awayTeam: result.awayTeam,
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      date: result.date,
      matchweek: result.matchweek,
    }));

    console.log(`[AutoUpdate] Converted to ${matchResults.length} MatchResult objects`);
    return matchResults;

  } catch (error) {
    console.error(`[AutoUpdate] Error fetching results from API:`, error);
    return [];
  }
}

/**
 * Canonical team names used in the database (from lib/clubs.ts)
 * Maps various name variants to the canonical name
 */
const TEAM_NAME_MAPPINGS: Record<string, string> = {
  // Arsenal
  "arsenal": "Arsenal",
  "arsenal fc": "Arsenal",
  
  // Aston Villa
  "aston villa": "Aston Villa",
  "aston villa fc": "Aston Villa",
  
  // Bournemouth
  "bournemouth": "Bournemouth",
  "afc bournemouth": "Bournemouth",
  
  // Brentford
  "brentford": "Brentford",
  "brentford fc": "Brentford",
  
  // Brighton
  "brighton": "Brighton & Hove Albion",
  "brighton & hove albion": "Brighton & Hove Albion",
  "brighton and hove albion": "Brighton & Hove Albion",
  "brighton hove albion": "Brighton & Hove Albion",
  
  // Burnley
  "burnley": "Burnley",
  "burnley fc": "Burnley",
  
  // Chelsea
  "chelsea": "Chelsea",
  "chelsea fc": "Chelsea",
  
  // Crystal Palace
  "crystal palace": "Crystal Palace",
  "crystal palace fc": "Crystal Palace",
  
  // Everton
  "everton": "Everton",
  "everton fc": "Everton",
  
  // Fulham
  "fulham": "Fulham",
  "fulham fc": "Fulham",
  
  // Leeds United
  "leeds": "Leeds United",
  "leeds united": "Leeds United",
  "leeds utd": "Leeds United",
  
  // Liverpool
  "liverpool": "Liverpool",
  "liverpool fc": "Liverpool",
  
  // Manchester City
  "manchester city": "Manchester City",
  "man city": "Manchester City",
  "man. city": "Manchester City",
  
  // Manchester United
  "manchester united": "Manchester United",
  "manchester utd": "Manchester United",
  "man united": "Manchester United",
  "man utd": "Manchester United",
  "man. utd": "Manchester United",
  
  // Newcastle United
  "newcastle": "Newcastle United",
  "newcastle united": "Newcastle United",
  "newcastle utd": "Newcastle United",
  
  // Nottingham Forest
  "nottingham forest": "Nottingham Forest",
  "nott'm forest": "Nottingham Forest",
  "nottingham": "Nottingham Forest",
  
  // Sunderland
  "sunderland": "Sunderland",
  "sunderland afc": "Sunderland",
  
  // Tottenham
  "tottenham": "Tottenham Hotspur",
  "tottenham hotspur": "Tottenham Hotspur",
  "spurs": "Tottenham Hotspur",
  
  // West Ham
  "west ham": "West Ham United",
  "west ham united": "West Ham United",
  "west ham utd": "West Ham United",
  
  // Wolves
  "wolves": "Wolverhampton Wanderers",
  "wolverhampton": "Wolverhampton Wanderers",
  "wolverhampton wanderers": "Wolverhampton Wanderers",
};

/**
 * Normalize team name to canonical database format
 */
function normalizeTeamName(name: string): string {
  const normalized = name.toLowerCase().trim();
  return TEAM_NAME_MAPPINGS[normalized] || name;
}

/**
 * Fetch standings from our custom scraping API
 * Uses Next.js API route that handles Puppeteer scraping
 */
async function scrapeStandings(): Promise<Standing[]> {
  console.log("[AutoUpdate] Fetching standings from scraping API...");

  try {
    // Get the base URL for the API call
    const baseUrl = process.env.URL || process.env.NETLIFY_URL || 'http://localhost:3000';
    const apiUrl = `${baseUrl}/api/scrape-standings`;

    console.log(`[AutoUpdate] Calling standings API: ${apiUrl}`);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-AutoUpdate/1.0',
      },
      // Add timeout for the API call
      signal: AbortSignal.timeout(60000), // 60 seconds
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error(`[AutoUpdate] Standings API error ${response.status} ${response.statusText}: ${errorText}`);
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(`API returned error: ${data.error}`);
    }

    const standings = data.standings || [];
    console.log(`[AutoUpdate] API returned ${standings.length} standings`);

    console.log(`[AutoUpdate] Returning ${standings.length} Standing objects`);
    return standings;

  } catch (error) {
    console.error(`[AutoUpdate] Error fetching standings from API:`, error);
    return [];
  }
}

/**
 * Update standings in database
 */
async function updateStandings(): Promise<number> {
  try {
    const standings = await scrapeStandings();

    if (standings.length === 0) {
      console.log("[AutoUpdate] No standings scraped, skipping update");
      return 0;
    }

    const dbStandings = standings.map((s) => ({
      position: s.position,
      club: s.club,
      played: s.played,
      won: s.won,
      drawn: s.drawn,
      lost: s.lost,
      goals_for: s.goalsFor,
      goals_against: s.goalsAgainst,
      goal_difference: s.goalDifference,
      points: s.points,
      form: s.form,
      season: "2025",
    }));

    // Delete existing standings for season 2025
    const { error: deleteError } = await supabase
      .from("standings")
      .delete()
      .eq("season", "2025");

    if (deleteError) {
      console.error("[AutoUpdate] Error deleting old standings:", deleteError);
    }

    // Insert new standings
    const { error: insertError } = await supabase.from("standings").insert(dbStandings);

    if (insertError) {
      console.error("[AutoUpdate] Error inserting standings:", insertError);
      throw insertError;
    }

    // Update cache metadata
    await supabase.from("cache_metadata").upsert(
      {
        key: "standings",
        last_updated: new Date().toISOString(),
        data_count: standings.length,
      },
      { onConflict: "key" }
    );

    console.log(`[AutoUpdate] Successfully updated ${standings.length} standings`);
    return standings.length;
  } catch (error) {
    console.error("[AutoUpdate] Error updating standings:", error);
    return 0;
  }
}

/**
 * Update results in database
 * Uses smart matching to find existing fixtures by date and normalized team names
 */
async function updateDatabase(results: MatchResult[]): Promise<number> {
  if (results.length === 0) return 0;
  
  let updatedCount = 0;
  
  for (const result of results) {
    // Normalize team names to canonical format
    const normalizedHomeTeam = normalizeTeamName(result.homeTeam);
    const normalizedAwayTeam = normalizeTeamName(result.awayTeam);
    
    const dateOnly = new Date(result.date).toISOString().split("T")[0];
    const dateStart = `${dateOnly}T00:00:00.000Z`;
    const dateEnd = `${dateOnly}T23:59:59.999Z`;
    
    console.log(`[AutoUpdate] Looking for match: ${normalizedHomeTeam} vs ${normalizedAwayTeam} on ${dateOnly}`);
    
    // First, try to find existing fixture by date and team names
    const { data: existingFixtures, error: findError } = await supabase
      .from("fixtures")
      .select("id, home_team, away_team, date")
      .gte("date", dateStart)
      .lte("date", dateEnd);
    
    if (findError) {
      console.error(`[AutoUpdate] Error finding fixture:`, findError);
      continue;
    }
    
    // Find matching fixture (fuzzy match on team names)
    const matchingFixture = existingFixtures?.find(f => {
      const dbHome = normalizeTeamName(f.home_team);
      const dbAway = normalizeTeamName(f.away_team);
      return dbHome === normalizedHomeTeam && dbAway === normalizedAwayTeam;
    });
    
    if (matchingFixture) {
      // Update existing fixture with result
      console.log(`[AutoUpdate] Found existing fixture: ${matchingFixture.id}`);
      
      const { error: updateError } = await supabase
        .from("fixtures")
        .update({
          home_score: result.homeScore,
          away_score: result.awayScore,
          status: "finished",
        })
        .eq("id", matchingFixture.id);
      
      if (updateError) {
        console.error(`[AutoUpdate] Error updating fixture ${matchingFixture.id}:`, updateError);
      } else {
        console.log(`[AutoUpdate] Updated: ${matchingFixture.home_team} ${result.homeScore}-${result.awayScore} ${matchingFixture.away_team}`);
        updatedCount++;
      }
    } else {
      // No existing fixture found, create new one with normalized names
      console.log(`[AutoUpdate] No existing fixture found, creating new one`);
      
      const id = `${normalizedHomeTeam.toLowerCase().replace(/\s+/g, "-")}-${normalizedAwayTeam.toLowerCase().replace(/\s+/g, "-")}-${dateOnly}`;
      
      const { error: insertError } = await supabase
        .from("fixtures")
        .upsert({
          id,
          date: result.date,
          home_team: normalizedHomeTeam,
          away_team: normalizedAwayTeam,
          home_score: result.homeScore,
          away_score: result.awayScore,
          matchweek: result.matchweek,
          status: "finished",
          is_derby: isDerby(normalizedHomeTeam, normalizedAwayTeam),
        }, { onConflict: "id" });
      
      if (insertError) {
        console.error(`[AutoUpdate] Error inserting fixture:`, insertError);
      } else {
        console.log(`[AutoUpdate] Created: ${normalizedHomeTeam} ${result.homeScore}-${result.awayScore} ${normalizedAwayTeam}`);
        updatedCount++;
      }
    }
  }
  
  // Update cache metadata
  await supabase
    .from("cache_metadata")
    .upsert({
      key: "last_auto_update",
      last_updated: new Date().toISOString(),
      data_count: updatedCount,
    }, { onConflict: "key" });
  
  return updatedCount;
}

/**
 * Get upcoming matches for logging/debugging
 */
async function getUpcomingMatches(): Promise<void> {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  const { data } = await supabase
    .from("fixtures")
    .select("date, home_team, away_team, status")
    .eq("status", "scheduled")
    .gte("date", now.toISOString())
    .lte("date", next24Hours.toISOString())
    .order("date", { ascending: true })
    .limit(5);
  
  if (data && data.length > 0) {
    console.log(`[AutoUpdate] Next matches in fixtures calendar:`);
    data.forEach(m => {
      const matchTime = new Date(m.date);
      const hoursUntil = ((matchTime.getTime() - now.getTime()) / (60 * 60 * 1000)).toFixed(1);
      console.log(`  - ${m.home_team} vs ${m.away_team} (in ${hoursUntil}h)`);
    });
  }
}

/**
 * Check if there are any matches from today that should have finished but still show as scheduled/live
 * This is a safety net to catch any missed updates
 */
async function getUnupdatedTodayMatches(): Promise<ScheduledMatch[]> {
  const now = new Date();
  
  // Get start of today (midnight)
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);
  
  // Look for matches that started more than 2.5 hours ago but aren't marked as finished
  const cutoffTime = new Date(now.getTime() - 150 * 60 * 1000); // 2.5 hours ago
  
  const { data, error } = await supabase
    .from("fixtures")
    .select("id, date, home_team, away_team, status, home_score, away_score")
    .in("status", ["scheduled", "live"])
    .gte("date", todayStart.toISOString())
    .lte("date", cutoffTime.toISOString())
    .order("date", { ascending: true });
  
  if (error) {
    console.error("[AutoUpdate] Error checking unupdated matches:", error);
    return [];
  }
  
  // Filter for matches that don't have scores yet
  const unupdated = (data || []).filter(m => m.home_score === null || m.away_score === null);
  
  if (unupdated.length > 0) {
    console.log(`[AutoUpdate] Found ${unupdated.length} unupdated match(es) from today:`);
    unupdated.forEach(m => {
      console.log(`  - ${m.home_team} vs ${m.away_team} (status: ${m.status}, started: ${new Date(m.date).toLocaleTimeString()})`);
    });
  }
  
  return unupdated;
}

/**
 * Check if we should do a late-night sweep (between 10 PM and 2 AM)
 * This catches any matches that were missed during the day
 */
function shouldDoLateNightSweep(): boolean {
  const now = new Date();
  const hour = now.getUTCHours();
  
  // Run sweep between 22:00 and 02:00 UTC (typical end of match day)
  return hour >= 22 || hour <= 2;
}

/**
 * Check if we should do a daily catch-up sweep (between 03:00 and 05:00 UTC)
 * Uses cache_metadata to ensure we only run once per day
 */
async function shouldDoDailyCatchUp(): Promise<boolean> {
  const now = new Date();
  const hour = now.getUTCHours();
  
  if (hour < 3 || hour > 5) return false;
  
  const { data } = await supabase
    .from("cache_metadata")
    .select("last_updated")
    .eq("key", "daily_catchup")
    .maybeSingle();
  
  if (!data?.last_updated) return true;
  
  const lastUpdated = new Date(data.last_updated);
  return now.getTime() - lastUpdated.getTime() > 20 * 60 * 60 * 1000;
}

async function markDailyCatchUp() {
  await supabase
    .from("cache_metadata")
    .upsert({
      key: "daily_catchup",
      last_updated: new Date().toISOString(),
      data_count: 0,
    }, { onConflict: "key" });
}

// Schedule: Run every 5 minutes - but ONLY does work when matches finish
// Uses fixtures calendar: checks fixtures table first, exits immediately if no matches
// This is efficient because:
// - Super quick database query (checks fixtures calendar)
// - Only scrapes when matches are detected (100 min after match start)
// - Late-night sweep catches any missed updates
// - Exits in <1 second when no matches need updating (minimal cost)
export const handler = schedule("*/5 * * * *", async (event, context) => {
  console.log("[AutoUpdate] =========================================");
  console.log("[AutoUpdate] Checking fixtures calendar for updates...");
  console.log("[AutoUpdate] =========================================");
  const startTime = Date.now();

  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Step 1: Check fixtures calendar for matches that likely just finished
    let matchesToUpdate = await getMatchesToUpdate();

    // Step 1b: If no scheduled updates found, check for unupdated matches from today
    // This is a safety net to catch any missed updates
    if (matchesToUpdate.length === 0) {
      const unupdatedMatches = await getUnupdatedTodayMatches();
      if (unupdatedMatches.length > 0) {
        console.log(`[AutoUpdate] Found ${unupdatedMatches.length} unupdated matches from today - forcing update`);
        matchesToUpdate = unupdatedMatches;
      }
    }

    // Step 1c: Late-night sweep - always update during post-match hours
    const isLateNight = shouldDoLateNightSweep();
    let forceLateNightUpdate = false;
    
    if (matchesToUpdate.length === 0 && isLateNight) {
      // Check if there were any matches today at all
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      
      const { data: todayMatches } = await supabase
        .from("fixtures")
        .select("id, date, home_team, away_team, status")
        .gte("date", todayStart.toISOString())
        .lte("date", now.toISOString())
        .limit(1);
      
      if (todayMatches && todayMatches.length > 0) {
        console.log(`[AutoUpdate] Late-night sweep: Found matches from today, forcing update check`);
        forceLateNightUpdate = true;
      }
    }

    // Step 1d: Daily catch-up sweep - once per day after matchday
    let forceDailyCatchUp = false;
    if (matchesToUpdate.length === 0 && !forceLateNightUpdate) {
      const shouldCatchUp = await shouldDoDailyCatchUp();
      if (shouldCatchUp) {
        console.log("[AutoUpdate] Daily catch-up sweep: forcing update check");
        forceDailyCatchUp = true;
      }
    }
    
    if (matchesToUpdate.length === 0 && !forceLateNightUpdate && !forceDailyCatchUp) {
      // Show upcoming matches for visibility
      await getUpcomingMatches();
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`[AutoUpdate] No matches to update. Exited in ${duration}s (minimal cost).`);
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "No matches to update - checked fixtures calendar",
          matchesChecked: 0,
          resultsUpdated: 0,
          standingsUpdated: 0,
          duration: `${duration}s`,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    if (matchesToUpdate.length > 0) {
      console.log(`[AutoUpdate] Found ${matchesToUpdate.length} matches that may have finished:`);
      matchesToUpdate.forEach(m => {
        console.log(`  - ${m.home_team} vs ${m.away_team} (${new Date(m.date).toLocaleString()})`);
      });
    } else if (forceLateNightUpdate) {
      console.log(`[AutoUpdate] Running late-night sweep to ensure all results are captured`);
    } else if (forceDailyCatchUp) {
      console.log(`[AutoUpdate] Running daily catch-up sweep to ensure all results are captured`);
    }

    // Step 2: Fetch results from Rezultati.com
    let results: MatchResult[] = [];
    let scrapeAttempts = 0;
    const maxAttempts = 3;
    
    // Retry logic for scraping
    while (scrapeAttempts < maxAttempts) {
      try {
        scrapeAttempts++;
        results = await fetchResults();
        if (results.length > 0) {
          console.log(`[AutoUpdate] Successfully scraped ${results.length} results (attempt ${scrapeAttempts})`);
          break;
        }
        console.log(`[AutoUpdate] Scrape attempt ${scrapeAttempts} returned 0 results, retrying...`);
        // Wait 2 seconds before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (scrapeError) {
        console.error(`[AutoUpdate] Scrape attempt ${scrapeAttempts} failed:`, scrapeError);
        if (scrapeAttempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Step 3: Update database with new results
    const updatedCount = await updateDatabase(results);

    // Step 4: Update standings whenever we have matches to update
    // This ensures standings are always in sync with results
    console.log("[AutoUpdate] Updating standings...");
    const standingsUpdated = await updateStandings();
    
    if (forceDailyCatchUp) {
      await markDailyCatchUp();
    }

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`[AutoUpdate] Completed in ${duration}s. Updated ${updatedCount} results and ${standingsUpdated} standings.`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Auto-update completed",
        matchesChecked: matchesToUpdate.length,
        resultsUpdated: updatedCount,
        standingsUpdated: standingsUpdated,
        scrapeAttempts,
        lateNightSweep: forceLateNightUpdate,
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("[AutoUpdate] Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
});
