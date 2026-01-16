import { NextRequest, NextResponse } from "next/server";
import { scrapeHistoricalSeason } from "@/lib/scrapers/sofascore-historical";
import { createClient } from "@supabase/supabase-js";
import { Fixture } from "@/lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/historical-season
 * Scrapes and stores historical season data from SofaScore
 * 
 * Body: { seasonYear: number } - e.g., { seasonYear: 2024 }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { seasonYear } = body;

    if (!seasonYear || typeof seasonYear !== "number") {
      return NextResponse.json(
        { error: "seasonYear is required and must be a number" },
        { status: 400 }
      );
    }

    // Validate season year (should be between 2015 and current year)
    const currentYear = new Date().getFullYear();
    if (seasonYear < 2015 || seasonYear > currentYear) {
      return NextResponse.json(
        { error: `seasonYear must be between 2015 and ${currentYear}` },
        { status: 400 }
      );
    }

    console.log(`[Historical Season API] Starting scrape for season ${seasonYear}/${seasonYear + 1}...`);

    // Scrape historical season
    const scrapedFixtures = await scrapeHistoricalSeason(seasonYear);

    if (scrapedFixtures.length === 0) {
      return NextResponse.json(
        { error: "No fixtures scraped. The scraper may need updating." },
        { status: 500 }
      );
    }

    const season = `${seasonYear}/${seasonYear + 1}`;

    // Store in database
    console.log(`[Historical Season API] Storing ${scrapedFixtures.length} fixtures for season ${season}...`);

    const dbFixtures = scrapedFixtures.map((fixture) => ({
      id: fixture.id,
      date: fixture.date,
      home_team: fixture.homeTeam,
      away_team: fixture.awayTeam,
      home_score: fixture.homeScore,
      away_score: fixture.awayScore,
      matchweek: fixture.matchweek,
      status: fixture.status,
      is_derby: fixture.isDerby || false,
      season: season,
    }));

    // Upsert fixtures (update if exists, insert if not)
    const { error: insertError } = await supabaseServer
      .from("fixtures")
      .upsert(dbFixtures, { onConflict: "id" });

    if (insertError) {
      console.error("[Historical Season API] Error storing fixtures:", insertError);
      return NextResponse.json(
        { error: "Failed to store fixtures in database", details: insertError.message },
        { status: 500 }
      );
    }

    console.log(`[Historical Season API] Successfully stored ${scrapedFixtures.length} fixtures for season ${season}`);

    return NextResponse.json({
      success: true,
      season: season,
      fixturesCount: scrapedFixtures.length,
      message: `Successfully scraped and stored ${scrapedFixtures.length} fixtures for season ${season}`,
    });
  } catch (error: any) {
    console.error("[Historical Season API] Error:", error);
    return NextResponse.json(
      { error: "Failed to scrape historical season", details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/historical-season
 * Returns historical season data for a specific season
 * 
 * Query params: seasonYear (number) - e.g., ?seasonYear=2024
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const seasonYear = searchParams.get("seasonYear");

    if (!seasonYear) {
      return NextResponse.json(
        { error: "seasonYear query parameter is required" },
        { status: 400 }
      );
    }

    const season = `${seasonYear}/${parseInt(seasonYear) + 1}`;

    // Fetch fixtures for this season from database
    const { data: fixturesData, error: fetchError } = await supabaseServer
      .from("fixtures")
      .select("*")
      .eq("season", season)
      .eq("status", "finished")
      .order("matchweek", { ascending: true })
      .order("date", { ascending: true });

    if (fetchError) {
      console.error("[Historical Season API] Error fetching fixtures:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch fixtures", details: fetchError.message },
        { status: 500 }
      );
    }

    // Convert database format to Fixture format
    const fixtures: Fixture[] = (fixturesData || []).map((f) => ({
      id: f.id,
      date: f.date,
      homeTeam: f.home_team,
      awayTeam: f.away_team,
      homeScore: f.home_score,
      awayScore: f.away_score,
      matchweek: f.matchweek,
      status: f.status,
      isDerby: f.is_derby || false,
      season: f.season,
    }));

    return NextResponse.json({
      season: season,
      fixtures: fixtures,
      count: fixtures.length,
    });
  } catch (error: any) {
    console.error("[Historical Season API] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch historical season", details: error.message },
      { status: 500 }
    );
  }
}
