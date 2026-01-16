import { Handler, schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

/**
 * Netlify Scheduled Function - Auto Update Results
 * 
 * Runs every 15 minutes to check for finished matches and update the database.
 * Uses fetch + cheerio instead of Puppeteer for Netlify compatibility.
 */

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const REZULTATI_URL = "https://www.rezultati.com/nogomet/engleska/premier-league/rezultati/";

interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  date: string;
  matchweek: number;
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
  
  // Process all elements in order
  $(".event__round, .event__match").each((_, el) => {
    const $el = $(el);
    
    // Check if this is a round header
    if ($el.hasClass("event__round")) {
      const roundText = $el.text();
      const roundMatch = roundText.match(/(\d+)\.\s*kolo/i);
      if (roundMatch) {
        currentMatchweek = parseInt(roundMatch[1]);
      }
      return;
    }
    
    // This is a match element
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
  
  console.log(`[AutoUpdate] Found ${results.length} results`);
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
  
  // Update cache metadata
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
 * Main handler
 */
const handler: Handler = async (event, context) => {
  console.log("[AutoUpdate] Starting scheduled update...");
  const startTime = Date.now();
  
  try {
    // Check if Supabase is configured
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }
    
    // Fetch results
    const results = await fetchResults();
    
    // Update database
    const updatedCount = await updateDatabase(results);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`[AutoUpdate] Completed in ${duration}s. Updated ${updatedCount} results.`);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Auto-update completed",
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

// Schedule: Run every 15 minutes
export const autoUpdate = schedule("*/15 * * * *", handler);

// Also export as default handler for manual triggering
export { handler };
