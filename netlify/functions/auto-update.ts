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
// Adding buffer for delays: check matches that started 120-180 minutes ago
const CHECK_WINDOW_START_MS = 120 * 60 * 1000;  // 120 minutes (match likely just finished)
const CHECK_WINDOW_END_MS = 180 * 60 * 1000;    // 180 minutes (3 hours max window)

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
 */
async function getMatchesToUpdate(): Promise<ScheduledMatch[]> {
  const now = new Date();
  
  // Check scheduled_updates table for updates that should run now
  // Allow 5 minute window: check if update_time is within last 5 minutes
  const timeWindowStart = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago
  const timeWindowEnd = new Date(now.getTime() + 1 * 60 * 1000); // 1 min in future
  
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
    const matchIds = scheduledUpdates.map(s => s.match_id);
    const { data: fixtures } = await supabase
      .from("fixtures")
      .select("id, date, home_team, away_team, status")
      .in("id", matchIds)
      .eq("status", "scheduled");
    
    return fixtures || [];
  }
  
  // Fallback: If scheduled_updates table doesn't exist or is empty, use old method
  console.log(`[AutoUpdate] No scheduled updates found, checking fixtures calendar (fallback)...`);
  
  const windowStart = new Date(now.getTime() - CHECK_WINDOW_END_MS); // 180 min ago
  const windowEnd = new Date(now.getTime() - CHECK_WINDOW_START_MS); // 120 min ago
  
  const { data, error } = await supabase
    .from("fixtures")
    .select("id, date, home_team, away_team, status")
    .eq("status", "scheduled")
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
 * Fetch and parse results from Rezultati.com
 */
async function fetchResults(): Promise<MatchResult[]> {
  console.log("[AutoUpdate] Fetching results from Rezultati.com...");
  
  const response = await fetch(REZULTATI_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    },
  });
  
  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
  }
  
  const html = await response.text();
  const $ = cheerio.load(html);
  
  const results: MatchResult[] = [];
  let currentMatchweek = 0;
  
  $(".event__round, .event__match").each((_, el) => {
    const $el = $(el);
    
    if ($el.hasClass("event__round")) {
      const roundText = $el.text();
      const roundMatch = roundText.match(/(\d+)\.\s*kolo/i);
      if (roundMatch) {
        currentMatchweek = parseInt(roundMatch[1]);
      }
      return;
    }
    
    if (!$el.hasClass("event__match")) return;
    
    const homeTeam = $el.find(".event__participant--home").text().trim().replace(/\d+$/, "").trim();
    const awayTeam = $el.find(".event__participant--away").text().trim().replace(/\d+$/, "").trim();
    const homeScoreText = $el.find(".event__score--home").text().trim();
    const awayScoreText = $el.find(".event__score--away").text().trim();
    const dateStr = $el.find(".event__time").text().trim();
    
    const homeScore = parseInt(homeScoreText);
    const awayScore = parseInt(awayScoreText);
    
    if (homeTeam && awayTeam && !isNaN(homeScore) && !isNaN(awayScore) && currentMatchweek > 0) {
      const parsedDate = parseDate(dateStr);
      if (parsedDate) {
        results.push({
          homeTeam,
          awayTeam,
          homeScore,
          awayScore,
          date: parsedDate.toISOString(),
          matchweek: currentMatchweek,
        });
      }
    }
  });
  
  console.log(`[AutoUpdate] Found ${results.length} results from scraper`);
  return results;
}

/**
 * Normalize team name to match database format
 */
function normalizeTeamName(name: string): string {
  const mappings: Record<string, string> = {
    "manchester city": "Man City",
    "manchester united": "Man Utd",
    "tottenham hotspur": "Tottenham",
    "brighton & hove albion": "Brighton",
    "west ham united": "West Ham",
    "wolverhampton wanderers": "Wolves",
    "nottingham forest": "Nott'm Forest",
    "afc bournemouth": "Bournemouth",
  };
  const normalized = name.toLowerCase().trim();
  return mappings[normalized] || name;
}

/**
 * Scrape standings from Rezultati.com
 */
async function scrapeStandings(): Promise<Standing[]> {
  console.log("[AutoUpdate] Fetching standings from Rezultati.com...");

  const response = await fetch(REZULTATI_STANDINGS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch standings: ${response.status}`);
  }

  const html = await response.text();
  const $ = cheerio.load(html);
  const standings: Standing[] = [];

  // Try multiple table selectors
  $("table tbody tr, .table__row, .standings-table tbody tr").each((index, row) => {
    const $row = $(row);
    if ($row.find("th").length > 0) return;

    const cells = $row.find("td, .table__cell");
    if (cells.length < 8) return;

    const position = parseInt($(cells[0]).text().trim()) || index + 1;
    let club = $(cells[1]).text().trim().replace(/\d+$/, "").trim();
    club = normalizeTeamName(club);

    if (!club || club.length < 3) return;

    const played = parseInt($(cells[2]).text().trim()) || 0;
    const won = parseInt($(cells[3]).text().trim()) || 0;
    const drawn = parseInt($(cells[4]).text().trim()) || 0;
    const lost = parseInt($(cells[5]).text().trim()) || 0;
    const goalsFor = parseInt($(cells[6]).text().trim()) || 0;
    const goalsAgainst = parseInt($(cells[7]).text().trim()) || 0;
    const goalDifference = parseInt($(cells[8]).text().trim()) || goalsFor - goalsAgainst;
    const points = parseInt($(cells[cells.length - 1]).text().trim()) || 0;

    // Extract form
    const formCell = $row.find("[class*='form'], [class*='last']");
    let form = "";
    if (formCell.length > 0) {
      formCell.find("span, div").each((_, el) => {
        const className = $(el).attr("class") || "";
        const text = $(el).text().trim().toUpperCase();
        if (className.includes("win") || text === "W") form += "W";
        else if (className.includes("draw") || text === "D") form += "D";
        else if (className.includes("loss") || text === "L") form += "L";
      });
      form = form.slice(0, 6);
    }

    standings.push({
      position,
      club,
      played,
      won,
      drawn,
      lost,
      goalsFor,
      goalsAgainst,
      goalDifference,
      points,
      form,
    });
  });

  console.log(`[AutoUpdate] Scraped ${standings.length} standings`);
  return standings.slice(0, 20); // Ensure max 20 teams
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
 */
async function updateDatabase(results: MatchResult[]): Promise<number> {
  if (results.length === 0) return 0;
  
  const dbResults = results.map(result => {
    const dateOnly = new Date(result.date).toISOString().split("T")[0];
    const id = `${result.homeTeam.toLowerCase().replace(/\s+/g, "-")}-${result.awayTeam.toLowerCase().replace(/\s+/g, "-")}-${dateOnly}-${result.matchweek}`;
    
    return {
      id,
      date: result.date,
      home_team: result.homeTeam,
      away_team: result.awayTeam,
      home_score: result.homeScore,
      away_score: result.awayScore,
      matchweek: result.matchweek,
      status: "finished" as const,
      is_derby: isDerby(result.homeTeam, result.awayTeam),
    };
  });
  
  const { error } = await supabase
    .from("fixtures")
    .upsert(dbResults, {
      onConflict: "home_team,away_team,date",
      ignoreDuplicates: false,
    });
  
  if (error) {
    console.error("[AutoUpdate] Database error:", error);
    throw error;
  }
  
  await supabase
    .from("cache_metadata")
    .upsert({
      key: "last_auto_update",
      last_updated: new Date().toISOString(),
      data_count: results.length,
    }, { onConflict: "key" });
  
  return results.length;
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

// Schedule: Run every 5 minutes - but ONLY does work when matches finish
// Uses fixtures calendar: checks fixtures table first, exits immediately if no matches
// This is efficient because:
// - Super quick database query (checks fixtures calendar)
// - Only scrapes when matches are detected (120 min after match start)
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
    const matchesToUpdate = await getMatchesToUpdate();

    if (matchesToUpdate.length === 0) {
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

    console.log(`[AutoUpdate] Found ${matchesToUpdate.length} matches that may have finished:`);
    matchesToUpdate.forEach(m => {
      console.log(`  - ${m.home_team} vs ${m.away_team} (${new Date(m.date).toLocaleString()})`);
    });

    // Step 2: Fetch results from Rezultati.com
    const results = await fetchResults();

    // Step 3: Update database with new results
    const updatedCount = await updateDatabase(results);

    // Step 4: Update standings 120 minutes after matches begin
    // This ensures standings are updated whenever matches finish (120 min after start)
    console.log("[AutoUpdate] Updating standings (120 minutes after match start)...");
    const standingsUpdated = await updateStandings();

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
