import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Fixture } from "@/lib/types";

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseServer = createClient(supabaseUrl, supabaseServiceKey);

/**
 * POST /api/historical-season
 * Historical data is imported via CSV files using scripts/import-csv-results.ts
 * This endpoint is kept for API compatibility but scraping is no longer supported.
 * 
 * Body: { seasonYear: number } - e.g., { seasonYear: 2024 }
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    { 
      error: "Historical season scraping is no longer supported. Please use the CSV import script: scripts/import-csv-results.ts",
      message: "Historical data should be imported using CSV files via the import script."
    },
    { status: 410 } // 410 Gone - indicates the resource is no longer available
  );
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

    // Use short season format to match import script (e.g., "2024/25" not "2024/2025")
    const nextYear = (parseInt(seasonYear) + 1).toString().slice(-2);
    const season = `${seasonYear}/${nextYear}`;

    console.log(`[Historical Season API] Fetching season: ${season} (from year param: ${seasonYear})`);

    // Fetch fixtures for this season from database
    const { data: fixturesData, error: fetchError } = await supabaseServer
      .from("fixtures")
      .select("*")
      .eq("season", season)
      .eq("status", "finished")
      .order("matchweek", { ascending: true })
      .order("date", { ascending: true });

    console.log(`[Historical Season API] Found ${fixturesData?.length || 0} fixtures for season ${season}`);

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
