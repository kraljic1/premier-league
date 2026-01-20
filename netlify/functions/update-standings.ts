import { Handler } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";
import { normalizeClubName } from "../../lib/utils/club-name-utils";

/**
 * Netlify Function - Update Standings
 * 
 * Scrapes standings from Rezultati.com (works in serverless) and stores in database
 * Can be called manually or scheduled
 */

const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] || "";
const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] || "";

const supabase = createClient(supabaseUrl, supabaseKey);

const REZULTATI_STANDINGS_URL = "https://www.rezultati.com/nogomet/engleska/premier-league/tablica/";

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
 * Normalize team name to match database format
 */
function normalizeTeamName(name: string): string {
  return normalizeClubName(name);
}

/**
 * Scrape standings from Rezultati.com
 */
async function scrapeStandings(): Promise<Standing[]> {
  console.log("[UpdateStandings] Fetching standings from Rezultati.com...");

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

  // Rezultati.com uses table structure for standings
  $("table tbody tr, .table__row").each((index, row) => {
    const $row = $(row);

    // Skip header rows
    if ($row.find("th").length > 0) return;

    // Extract position
    const positionText = $row.find("td:first-child, .table__cell:first-child").text().trim();
    const position = parseInt(positionText) || index + 1;

    // Extract team name
    const teamCell = $row.find("td:nth-child(2), .table__cell:nth-child(2)");
    let club = teamCell.text().trim().replace(/\d+$/, "").trim();
    club = normalizeTeamName(club);

    if (!club || club.length < 3) return;

    // Extract stats - try multiple column orders
    const cells = $row.find("td, .table__cell");
    const cellTexts = cells.map((_, el) => $(el).text().trim()).get();

    // Common order: Position, Team, Played, Won, Drawn, Lost, GF, GA, GD, Points
    const played = parseInt(cellTexts[2] || "0") || 0;
    const won = parseInt(cellTexts[3] || "0") || 0;
    const drawn = parseInt(cellTexts[4] || "0") || 0;
    const lost = parseInt(cellTexts[5] || "0") || 0;
    const goalsFor = parseInt(cellTexts[6] || "0") || 0;
    const goalsAgainst = parseInt(cellTexts[7] || "0") || 0;
    const goalDifference = parseInt(cellTexts[8] || "0") || (goalsFor - goalsAgainst);
    const points = parseInt(cellTexts[cellTexts.length - 1] || "0") || 0;

    // Extract form (last 5-6 results)
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
      form = form.slice(0, 6); // Limit to last 6
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

  console.log(`[UpdateStandings] Scraped ${standings.length} standings`);

  // If we didn't get enough, try alternative selector
  if (standings.length < 15) {
    console.log("[UpdateStandings] Trying alternative selectors...");
    // Try different table structure
    $(".standings-table tbody tr, [class*='standings'] tbody tr").each((index, row) => {
      const $row = $(row);
      if ($row.find("th").length > 0) return;

      const cells = $row.find("td");
      if (cells.length < 8) return;

      const position = parseInt($(cells[0]).text().trim()) || index + 1;
      const club = normalizeTeamName($(cells[1]).text().trim());
      const played = parseInt($(cells[2]).text().trim()) || 0;
      const won = parseInt($(cells[3]).text().trim()) || 0;
      const drawn = parseInt($(cells[4]).text().trim()) || 0;
      const lost = parseInt($(cells[5]).text().trim()) || 0;
      const goalsFor = parseInt($(cells[6]).text().trim()) || 0;
      const goalsAgainst = parseInt($(cells[7]).text().trim()) || 0;
      const goalDifference = goalsFor - goalsAgainst;
      const points = parseInt($(cells[cells.length - 1]).text().trim()) || 0;

      if (club && club.length >= 3) {
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
          form: "",
        });
      }
    });
  }

  return standings.slice(0, 20); // Ensure max 20 teams
}

/**
 * Store standings in database
 */
async function storeStandings(standings: Standing[]): Promise<void> {
  if (standings.length === 0) {
    console.log("[UpdateStandings] No standings to store");
    return;
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
    console.error("[UpdateStandings] Error deleting old standings:", deleteError);
  }

  // Insert new standings
  const { error: insertError } = await supabase.from("standings").insert(dbStandings);

  if (insertError) {
    console.error("[UpdateStandings] Error inserting standings:", insertError);
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

  console.log(`[UpdateStandings] Successfully stored ${standings.length} standings`);
}

export const handler: Handler = async (event, context) => {
  console.log("[UpdateStandings] Function invoked");

  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    // Scrape standings
    const standings = await scrapeStandings();

    if (standings.length === 0) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          success: false,
          message: "No standings scraped",
        }),
      };
    }

    // Store in database
    await storeStandings(standings);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Updated ${standings.length} standings`,
        standings: standings.slice(0, 5), // Return sample
      }),
    };
  } catch (error) {
    console.error("[UpdateStandings] Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
