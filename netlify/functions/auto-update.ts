import { Handler, schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

/**
 * Netlify Scheduled Function - Smart Auto Update Results
 * 
 * Runs every 30 minutes but ONLY updates when there are matches
 * that started 90-150 minutes ago (likely just finished).
 * 
 * This is much more efficient than updating every 15 minutes blindly.
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const REZULTATI_URL = "https://www.rezultati.com/nogomet/engleska/premier-league/rezultati/";

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

/**
 * Check if there are any matches that likely just finished
 * (started 90-150 minutes ago and still marked as scheduled)
 */
async function getMatchesToUpdate(): Promise<ScheduledMatch[]> {
  const now = new Date();
  
  // Matches that started 90-150 minutes ago
  const windowStart = new Date(now.getTime() - CHECK_WINDOW_END_MS);
  const windowEnd = new Date(now.getTime() - CHECK_WINDOW_START_MS);
  
  console.log(`[AutoUpdate] Checking for matches between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);
  
  const { data, error } = await supabase
    .from("fixtures")
    .select("id, date, home_team, away_team, status")
    .eq("status", "scheduled")
    .gte("date", windowStart.toISOString())
    .lte("date", windowEnd.toISOString());
  
  if (error) {
    console.error("[AutoUpdate] Error fetching scheduled matches:", error);
    return [];
  }
  
  return data || [];
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
 * Main handler - Smart update logic
 */
const handler: Handler = async (event, context) => {
  console.log("[AutoUpdate] Checking if update is needed...");
  const startTime = Date.now();
  
  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    // Step 1: Check if there are matches that likely just finished
    const matchesToUpdate = await getMatchesToUpdate();
    
    if (matchesToUpdate.length === 0) {
      console.log("[AutoUpdate] No matches to update. Skipping scrape.");
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: true,
          message: "No matches to update at this time",
          matchesChecked: 0,
          resultsUpdated: 0,
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
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`[AutoUpdate] Completed in ${duration}s. Updated ${updatedCount} results.`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Auto-update completed",
        matchesChecked: matchesToUpdate.length,
        resultsUpdated: updatedCount,
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
};

// Schedule: Check every 30 minutes, but only scrape when matches need updating
export const autoUpdate = schedule("*/30 * * * *", handler);

export { handler };
