import { NextRequest, NextResponse } from "next/server";
import { scrapeFixtures } from "@/lib/scrapers/fixtures";
import { scrapeFixturesFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { supabase, supabaseServer, FixtureRow } from "@/lib/supabase";
import { Fixture } from "@/lib/types";
import {
  logApiRequest,
  createSecureResponse,
  sanitizeError,
  validateEnvironment
} from "@/lib/security";
import { normalizeClubName } from "@/lib/utils/club-name-utils";
import {
  getCurrentSeasonFilter,
  getCurrentSeasonStartDate,
  getCurrentSeasonEndDate,
} from "@/lib/utils/season-utils";

export const revalidate = 1800; // 30 minutes

const CACHE_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds
const DEFAULT_COMPETITIONS = ["Premier League"];

// Get current season values dynamically (auto-updates each year)
const CURRENT_SEASON_START = getCurrentSeasonStartDate();
const CURRENT_SEASON_END = getCurrentSeasonEndDate();
const SEASON_FILTER = getCurrentSeasonFilter();

// Type for cache metadata result
type CacheMetaResult = { last_updated: string } | null;

function normalizeCompetition(competition: string | null | undefined): string {
  return competition || "Premier League";
}

function buildNormalizedFixtureId(
  homeTeam: string,
  awayTeam: string,
  date: string
): string {
  const dateOnly = date.split("T")[0];
  return `${homeTeam}-${awayTeam}-${dateOnly}`.toLowerCase().replace(/\s+/g, "-");
}

function normalizeAndDedupeFixtures(fixtures: Fixture[]): Fixture[] {
  const seen = new Set<string>();
  const normalized: Fixture[] = [];

  for (const fixture of fixtures) {
    const normalizedHomeTeam = normalizeClubName(fixture.homeTeam);
    const normalizedAwayTeam = normalizeClubName(fixture.awayTeam);
    const id = buildNormalizedFixtureId(
      normalizedHomeTeam,
      normalizedAwayTeam,
      fixture.date
    );

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);
    normalized.push({
      ...fixture,
      id,
      homeTeam: normalizedHomeTeam,
      awayTeam: normalizedAwayTeam,
    });
  }

  return normalized;
}

function parseCompetitions(request: NextRequest): string[] {
  const competitionsParam = request.nextUrl.searchParams.get("competitions");
  if (!competitionsParam) {
    return DEFAULT_COMPETITIONS;
  }

  const competitions = competitionsParam
    .split(",")
    .map((competition) => competition.trim())
    .filter(Boolean);

  return competitions.length > 0 ? competitions : DEFAULT_COMPETITIONS;
}

/**
 * Background refresh function - scrapes and stores fixtures without blocking the response
 */
async function refreshFixturesInBackground() {
  try {
    // Check if Supabase is configured before trying to store data
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.log("[Fixtures API] Background refresh: Supabase not configured, skipping database storage");
      return;
    }

    console.log("[Fixtures API] Background refresh started...");

    // Try OneFootball first (simpler, faster, no Puppeteer needed)
    let scrapedFixtures: Fixture[] = [];

    try {
      scrapedFixtures = await scrapeFixturesFromOneFootball();
      console.log(`[Fixtures API] Background refresh: Successfully scraped ${scrapedFixtures.length} fixtures from OneFootball`);
    } catch (onefootballError) {
      console.warn("[Fixtures API] Background refresh: OneFootball failed, trying official site:", onefootballError);
      scrapedFixtures = await scrapeFixtures();
      console.log(`[Fixtures API] Background refresh: Successfully scraped ${scrapedFixtures.length} fixtures from official site`);
    }

    if (scrapedFixtures.length > 0) {
      const dbFixtures = scrapedFixtures.map(fixture => ({
        id: fixture.id,
        date: fixture.date,
        home_team: fixture.homeTeam,
        away_team: fixture.awayTeam,
        home_score: fixture.homeScore,
        away_score: fixture.awayScore,
        matchweek: fixture.matchweek,
        status: fixture.status,
        is_derby: fixture.isDerby || false,
        season: fixture.season || undefined,
        competition: "Premier League",
        competition_round: null
      }));

      const { error: insertError } = await supabaseServer
        .from('fixtures')
        .upsert(dbFixtures, { onConflict: 'id' });

      if (insertError) {
        console.error("[Fixtures API] Background refresh: Error storing fixtures:", insertError);
      } else {
        await supabaseServer
          .from('cache_metadata')
          .upsert({
            key: 'fixtures',
            last_updated: new Date().toISOString(),
            data_count: scrapedFixtures.length
          }, { onConflict: 'key' });

        console.log("[Fixtures API] Background refresh: Successfully updated database");
      }
    }
  } catch (error) {
    console.error("[Fixtures API] Background refresh: Unexpected error:", error);
  }
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    const selectedCompetitions = parseCompetitions(request);
    const selectedCompetitionSet = new Set(selectedCompetitions);
    // Validate environment configuration
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      console.error("[Fixtures API] Missing environment variables:", envValidation.missing);
      const response = createSecureResponse(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
      logApiRequest(request, response, startTime, { error: "env_config" });
      return response;
    }

    // Check if Supabase is configured
    const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const supabaseKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    // Declare fixturesData outside the if-else block so it's accessible throughout the function
    let fixturesData: FixtureRow[] | null = null;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn('[Fixtures API] Supabase not configured, falling back to scraping');
      // Skip to scraping logic below
    } else {
      // Check database and cache metadata in parallel
      console.log("[Fixtures API] Checking database for fixtures...");

      // Filter for current season fixtures only

      const [fixturesResult, cacheMetaResult] = await Promise.all([
        supabaseServer
          .from('fixtures')
          .select('*')
          .or(SEASON_FILTER)
          .gte('date', CURRENT_SEASON_START.toISOString())
          .lte('date', CURRENT_SEASON_END.toISOString())
          .order('date', { ascending: true }),
        supabaseServer
          .from('cache_metadata')
          .select('last_updated')
          .eq('key', 'fixtures')
          .single()
      ]);

      fixturesData = fixturesResult.data as FixtureRow[] | null;
      const dbError = fixturesResult.error;
      const cacheMeta = cacheMetaResult.data as CacheMetaResult;

      if (dbError) {
        console.error("[Fixtures API] Database error:", dbError);
      }

      // Log database count for debugging
      const finishedCount = fixturesData?.filter(f => f.status === 'finished').length || 0;
      const upcomingCount = fixturesData?.filter(f => f.status !== 'finished').length || 0;
      console.log(`[Fixtures API] Database returned ${fixturesData?.length || 0} total fixtures (${finishedCount} finished, ${upcomingCount} upcoming)`);

      // Check if data exists and is recent (within cache duration)
      const lastUpdated = cacheMeta?.last_updated ? new Date(cacheMeta.last_updated) : null;
      const now = new Date();
      const isDataFresh = lastUpdated && (now.getTime() - lastUpdated.getTime()) < CACHE_DURATION;

      // If we have data in database (even if stale), return it immediately for fast response
      // Then refresh in background if stale
      if (fixturesData && fixturesData.length > 0) {
        // Convert database format to app format
        const fixtures: Fixture[] = fixturesData
          .filter((row) => selectedCompetitionSet.has(normalizeCompetition(row.competition)))
          .map(row => ({
          id: row.id,
          date: row.date,
          homeTeam: row.home_team,
          awayTeam: row.away_team,
          homeScore: row.home_score,
          awayScore: row.away_score,
          matchweek: row.matchweek,
          status: row.status as Fixture['status'],
          isDerby: row.is_derby,
          season: row.season || undefined,
          competition: normalizeCompetition(row.competition),
          competitionRound: row.competition_round
        }));
        const normalizedFixtures = normalizeAndDedupeFixtures(fixtures);

        // If data is fresh, return immediately
        if (isDataFresh) {
          console.log(`[Fixtures API] Returning ${normalizedFixtures.length} fixtures from database (fresh)`);
        return NextResponse.json(normalizedFixtures, {
            headers: {
              "X-Cache": "HIT",
              "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
            },
          });
        }

        // Data exists but is stale - return it immediately and refresh in background
        console.log(`[Fixtures API] Returning ${normalizedFixtures.length} fixtures from database (stale, refreshing in background)`);

        // Start background refresh (don't await - return immediately)
        refreshFixturesInBackground().catch(err => {
          console.error("[Fixtures API] Background refresh error:", err);
        });

        return NextResponse.json(normalizedFixtures, {
          headers: {
            "X-Cache": "STALE-BACKGROUND-REFRESH",
            "Cache-Control": "public, s-maxage=0, stale-while-revalidate=3600",
          },
        });
      }
    }

    // No data in database (or Supabase not configured) - must scrape (this will be slower)
    console.log("[Fixtures API] No data in database or Supabase not configured. Scraping fresh fixtures...");
    try {
      // Try OneFootball first (simpler, faster, no Puppeteer needed)
      let scrapedFixtures: Fixture[] = [];
      let scrapeSource = 'unknown';
      
      try {
        console.log("[Fixtures API] Attempting to scrape from OneFootball...");
        scrapedFixtures = await scrapeFixturesFromOneFootball();
        scrapeSource = 'onefootball';
        console.log(`[Fixtures API] Successfully scraped ${scrapedFixtures.length} fixtures from OneFootball`);
      } catch (onefootballError) {
        console.warn("[Fixtures API] OneFootball scraping failed, falling back to official site:", onefootballError);
        // Fallback to official Premier League site scraper
        scrapedFixtures = await scrapeFixtures();
        scrapeSource = 'official-site';
        console.log(`[Fixtures API] Successfully scraped ${scrapedFixtures.length} fixtures from official site`);
      }

      if (scrapedFixtures.length > 0) {
        // Store in database
        console.log(`[Fixtures API] Storing ${scrapedFixtures.length} scraped fixtures in database...`);

        // Prepare data for database insertion
        const dbFixtures = scrapedFixtures.map(fixture => ({
          id: fixture.id,
          date: fixture.date,
          home_team: fixture.homeTeam,
          away_team: fixture.awayTeam,
          home_score: fixture.homeScore,
          away_score: fixture.awayScore,
          matchweek: fixture.matchweek,
          status: fixture.status,
          is_derby: fixture.isDerby || false,
          season: fixture.season || undefined,
          competition: "Premier League",
          competition_round: null
        }));

        // Upsert fixtures (update if exists, insert if not)
        // Use server client to bypass RLS for server-side operations
        const { error: insertError } = await supabaseServer
          .from('fixtures')
          .upsert(dbFixtures, { onConflict: 'id' });

        if (insertError) {
          console.error("[Fixtures API] Error storing fixtures:", insertError);
        } else {
          // Update cache metadata
          await supabaseServer
            .from('cache_metadata')
            .upsert({
              key: 'fixtures',
              last_updated: new Date().toISOString(),
              data_count: scrapedFixtures.length
            }, { onConflict: 'key' });
        }
      }

      // After upserting, fetch ALL current season fixtures from database (including previously stored ones)
      // This ensures we return all current season fixtures, not just the ones we just scraped
      const { data: allFixturesData, error: fetchError } = await supabaseServer
        .from('fixtures')
        .select('*')
        .or(SEASON_FILTER)
        .gte('date', CURRENT_SEASON_START.toISOString())
        .lte('date', CURRENT_SEASON_END.toISOString())
        .order('date', { ascending: true });

      if (fetchError) {
        console.error("[Fixtures API] Error fetching all fixtures after upsert:", fetchError);
        // Fallback to returning scraped fixtures if fetch fails
        const normalizedScrapedFixtures = normalizeAndDedupeFixtures(
          scrapedFixtures.map((fixture) => ({
            ...fixture,
            competition: "Premier League",
            competitionRound: null
          }))
        );

        return NextResponse.json(normalizedScrapedFixtures, {
          headers: {
            "X-Cache": "MISS-SCRAPED",
            "X-Source": scrapeSource,
            "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
          },
        });
      }

      // Convert database format to app format
      const allFixtures: Fixture[] = (allFixturesData || [])
        .filter((row) => selectedCompetitionSet.has(normalizeCompetition(row.competition)))
        .map(row => ({
          id: row.id,
          date: row.date,
          homeTeam: row.home_team,
          awayTeam: row.away_team,
          homeScore: row.home_score,
          awayScore: row.away_score,
          matchweek: row.matchweek,
          status: row.status as Fixture['status'],
          isDerby: row.is_derby,
          season: row.season || undefined,
          competition: normalizeCompetition(row.competition),
          competitionRound: row.competition_round
        }));
      const normalizedAllFixtures = normalizeAndDedupeFixtures(allFixtures);

      const finishedCount = normalizedAllFixtures.filter(f => f.status === 'finished').length;
      const upcomingCount = normalizedAllFixtures.filter(f => f.status !== 'finished').length;
      console.log(`[Fixtures API] Returning ${normalizedAllFixtures.length} total fixtures from database (${finishedCount} finished, ${upcomingCount} upcoming, ${scrapedFixtures.length} newly scraped)`);

      return NextResponse.json(normalizedAllFixtures, {
        headers: {
          "X-Cache": "MISS-SCRAPED",
          "X-Source": scrapeSource,
          "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
        },
      });
    } catch (scrapeError) {
      console.error("[Fixtures API] Scraping failed:", scrapeError);

      // If scraping fails but we have database data, return it
      if (fixturesData && fixturesData.length > 0) {
        console.log(`[Fixtures API] Returning ${fixturesData.length} fixtures from database (fallback)`);

        const fixtures: Fixture[] = fixturesData
          .filter((row) => selectedCompetitionSet.has(normalizeCompetition(row.competition)))
          .map((row: FixtureRow) => ({
          id: row.id,
          date: row.date,
          homeTeam: row.home_team,
          awayTeam: row.away_team,
          homeScore: row.home_score,
          awayScore: row.away_score,
          matchweek: row.matchweek,
          status: row.status as Fixture['status'],
          isDerby: row.is_derby,
          season: row.season || undefined,
          competition: normalizeCompetition(row.competition),
          competitionRound: row.competition_round
        }));
        const normalizedFixtures = normalizeAndDedupeFixtures(fixtures);

        return NextResponse.json(normalizedFixtures, {
          headers: {
            "X-Cache": "FALLBACK",
          },
        });
      }

      return createSecureResponse([], {
        additionalHeaders: { "X-Cache": "ERROR" }
      });
    }
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    console.error("Error fetching fixtures:", error);

    const response = createSecureResponse(
      { error: "Failed to fetch fixtures" },
      { status: 500 }
    );

    logApiRequest(request, response, startTime, { error: "internal_error" });
    return response;
  }
}

