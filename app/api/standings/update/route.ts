import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as cheerio from "cheerio";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabaseServer = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

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

async function scrapeStandingsFromRezultati(): Promise<Standing[]> {
  const response = await fetch(REZULTATI_STANDINGS_URL, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch: ${response.status}`);
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
  });

  return standings.slice(0, 20);
}

export async function POST() {
  try {
    console.log("[Standings Update] Manual update triggered");

    // Scrape standings
    const standings = await scrapeStandingsFromRezultati();

    if (standings.length === 0) {
      return NextResponse.json(
        { success: false, message: "No standings scraped" },
        { status: 400 }
      );
    }

    // Store in database
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

    // Delete existing
    await supabaseServer.from("standings").delete().eq("season", "2025");

    // Insert new
    const { error } = await supabaseServer.from("standings").insert(dbStandings);

    if (error) {
      console.error("[Standings Update] Database error:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Update cache metadata
    await supabaseServer.from("cache_metadata").upsert(
      {
        key: "standings",
        last_updated: new Date().toISOString(),
        data_count: standings.length,
      },
      { onConflict: "key" }
    );

    return NextResponse.json({
      success: true,
      message: `Updated ${standings.length} standings`,
      standings: standings.slice(0, 5),
    });
  } catch (error) {
    console.error("[Standings Update] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
