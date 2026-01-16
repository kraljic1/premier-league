import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { scrapeFixtures } from "@/lib/scrapers/fixtures";
import { scrapeResults } from "@/lib/scrapers/results";
import { scrapeFixturesFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { scrapeResultsFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { scrapeStandings } from "@/lib/scrapers/standings";
import { supabase, supabaseServer } from "@/lib/supabase";
import { Fixture } from "@/lib/types";
import {
  authenticateRequest,
  validateRequestBody,
  validationSchemas,
  logApiRequest,
  createSecureResponse,
  sanitizeError,
  validateEnvironment
} from "@/lib/security";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Validate environment configuration
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      console.error("[Refresh] Missing environment variables:", envValidation.missing);
      const response = createSecureResponse(
        { error: "Service configuration error" },
        { status: 503 }
      );
      logApiRequest(request, response, startTime, { error: "env_config" });
      return response;
    }

    // Authenticate request (requires write access)
    const auth = authenticateRequest(request, 'write');
    if (!auth.success) {
      const response = createSecureResponse(
        { error: auth.error },
        { status: 401 }
      );
      logApiRequest(request, response, startTime, { error: "auth_failed" });
      return response;
    }

    // Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const validation = validateRequestBody(validationSchemas.refreshRequest, body);
    if (!validation.success) {
      const response = createSecureResponse(
        { error: validation.error },
        { status: 400 }
      );
      logApiRequest(request, response, startTime, { error: "validation_failed" });
      return response;
    }

    const { force, source, matchweek } = validation.data;

    console.log("[Refresh] Starting secure data refresh at", new Date().toISOString(), {
      force,
      source,
      matchweek,
      authenticated: true
    });

    // Trigger scraping for all endpoints using separate scrapers
    // Use OneFootball scrapers first (faster, more reliable), fallback to official site
    const [fixtures, results, standings] = await Promise.allSettled([
      (async () => {
        try {
          console.log("[Refresh] Attempting to scrape fixtures from OneFootball...");
          const data = await scrapeFixturesFromOneFootball();

          // Filter by matchweek if specified
          if (matchweek && Array.isArray(data)) {
            return data.filter(fixture => fixture.matchweek === matchweek);
          }

          return data;
        } catch (error) {
          console.warn("[Refresh] OneFootball fixtures failed, using official site:", sanitizeError(error));
          const fallbackData = await scrapeFixtures();

          // Filter by matchweek if specified
          if (matchweek && Array.isArray(fallbackData)) {
            return fallbackData.filter(fixture => fixture.matchweek === matchweek);
          }

          return fallbackData;
        }
      })(),
      (async () => {
        try {
          console.log("[Refresh] Attempting to scrape results from OneFootball...");
          const data = await scrapeResultsFromOneFootball();

          // Filter by matchweek if specified
          if (matchweek && Array.isArray(data)) {
            return data.filter(result => result.matchweek === matchweek);
          }

          return data;
        } catch (error) {
          console.warn("[Refresh] OneFootball results failed, using official site:", sanitizeError(error));
          const fallbackData = await scrapeResults();

          // Filter by matchweek if specified
          if (matchweek && Array.isArray(fallbackData)) {
            return fallbackData.filter(result => result.matchweek === matchweek);
          }

          return fallbackData;
        }
      })(),
      scrapeStandings(),
    ]);

    const refreshResults = {
      fixtures: fixtures.status === "fulfilled" ? fixtures.value.length : 0,
      results: results.status === "fulfilled" ? results.value.length : 0,
      standings: standings.status === "fulfilled" ? standings.value.length : 0,
      errors: {
        fixtures: fixtures.status === "rejected" ? "Scraping failed" : null,
        results: results.status === "rejected" ? "Scraping failed" : null,
        standings: standings.status === "rejected" ? "Scraping failed" : null,
      },
      filters: {
        matchweek: matchweek || null,
        source: source || 'auto'
      }
    };

    // Store scraped data in Supabase database
    console.log("[Refresh] Storing data in database...");

    // Store fixtures (all matches: scheduled, live, finished)
    if (fixtures.status === "fulfilled") {
      const fixturesData = fixtures.value as Fixture[];
      console.log(`[Refresh] Storing ${fixturesData.length} fixtures...`);

      const dbFixtures = fixturesData.map(fixture => ({
        id: fixture.id,
        date: fixture.date,
        home_team: fixture.homeTeam,
        away_team: fixture.awayTeam,
        home_score: fixture.homeScore,
        away_score: fixture.awayScore,
        matchweek: fixture.matchweek,
        status: fixture.status,
        is_derby: fixture.isDerby || false
      }));

      const { error: fixturesError } = await supabaseServer
        .from('fixtures')
        .upsert(dbFixtures, { onConflict: 'id' });

      if (fixturesError) {
        console.error("[Refresh] Error storing fixtures:", fixturesError);
      } else {
        // Update cache metadata
        await supabaseServer
          .from('cache_metadata')
          .upsert({
            key: 'fixtures',
            last_updated: new Date().toISOString(),
            data_count: fixturesData.length
          }, { onConflict: 'key' });
      }
    }

    // Store results (finished matches only)
    if (results.status === "fulfilled") {
      const resultsData = results.value as Fixture[];
      console.log(`[Refresh] Storing ${resultsData.length} results...`);

      const dbResults = resultsData.map(result => ({
        id: result.id,
        date: result.date,
        home_team: result.homeTeam,
        away_team: result.awayTeam,
        home_score: result.homeScore,
        away_score: result.awayScore,
        matchweek: result.matchweek,
        status: 'finished' as const, // Results are always finished
        is_derby: result.isDerby || false
      }));

      const { error: resultsError } = await supabaseServer
        .from('fixtures')
        .upsert(dbResults, { onConflict: 'id' });

      if (resultsError) {
        console.error("[Refresh] Error storing results:", resultsError);
      }
    }

    // Store standings
    if (standings.status === "fulfilled") {
      const standingsData = standings.value;
      console.log(`[Refresh] Storing ${standingsData.length} standings...`);

      const dbStandings = standingsData.map(standing => ({
        position: standing.position,
        club: standing.club,
        played: standing.played,
        won: standing.won,
        drawn: standing.drawn,
        lost: standing.lost,
        goals_for: standing.goalsFor,
        goals_against: standing.goalsAgainst,
        goal_difference: standing.goalDifference,
        points: standing.points,
        form: standing.form,
        season: '2025'
      }));

      // Delete existing standings and insert new ones
      await supabaseServer.from('standings').delete().eq('season', '2025');
      const { error: standingsError } = await supabaseServer
        .from('standings')
        .insert(dbStandings);

      if (standingsError) {
        console.error("[Refresh] Error storing standings:", standingsError);
      } else {
        // Update cache metadata
        await supabaseServer
          .from('cache_metadata')
          .upsert({
            key: 'standings',
            last_updated: new Date().toISOString(),
            data_count: standingsData.length
          }, { onConflict: 'key' });
      }
    }

    // Revalidate Next.js cache paths
    revalidatePath("/api/fixtures");
    revalidatePath("/api/results");
    revalidatePath("/api/standings");
    revalidatePath("/");
    revalidatePath("/fixtures");
    revalidatePath("/results");
    revalidatePath("/standings");

    console.log("[Refresh] Secure data refresh completed:", {
      ...refreshResults,
      timestamp: new Date().toISOString(),
      authenticated: true
    });

    const response = createSecureResponse({
      success: true,
      message: "Data refreshed and stored in database",
      results: refreshResults,
      timestamp: new Date().toISOString(),
    }, {
      cacheControl: 'no-cache, no-store, must-revalidate'
    });

    logApiRequest(request, response, startTime, {
      success: true,
      fixturesCount: refreshResults.fixtures,
      resultsCount: refreshResults.results
    });

    return response;
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    console.error("[Refresh] Error refreshing data:", error);

    const response = createSecureResponse(
      { error: "Failed to refresh data" },
      { status: 500, cacheControl: 'no-cache' }
    );

    logApiRequest(request, response, startTime, { error: "internal_error" });

    return response;
  }
}

