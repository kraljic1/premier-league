import { NextResponse } from "next/server";
import { scrapeResults } from "@/lib/scrapers/results";
import { scrapeResultsFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { supabase, supabaseServer, FixtureRow } from "@/lib/supabase";
import { Fixture } from "@/lib/types";
import { isDerby } from "@/lib/clubs";
import { normalizeClubName } from "@/lib/utils/club-name-utils";
import {
  getCurrentSeasonFilter,
  getCurrentSeasonStartDate,
  getCurrentSeasonEndDate,
} from "@/lib/utils/season-utils";

// Force dynamic rendering since we use request.url
export const dynamic = 'force-dynamic';
export const revalidate = 1800; // 30 minutes

const CACHE_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds
const DEFAULT_COMPETITIONS = ["Premier League"];

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
      isDerby: isDerby(normalizedHomeTeam, normalizedAwayTeam),
    });
  }

  return normalized;
}

// Get current season values dynamically (auto-updates each year)
const CURRENT_SEASON_START = getCurrentSeasonStartDate();
const CURRENT_SEASON_END = getCurrentSeasonEndDate();
const SEASON_FILTER = getCurrentSeasonFilter();

export async function GET(request: Request) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const matchweekParam = searchParams.get('matchweek');
    const matchweek = matchweekParam ? parseInt(matchweekParam) : null;
    
    // Validate matchweek parameter
    if (matchweek !== null && (isNaN(matchweek) || matchweek < 1 || matchweek > 38)) {
      return NextResponse.json(
        { error: "Invalid matchweek parameter. Must be between 1 and 38." },
        { status: 400 }
      );
    }
    
    // Check database for finished fixtures and cache metadata in parallel
    console.log(`[Results API] Checking database for finished matches${matchweek ? ` (matchweek ${matchweek})` : ''}...`);

    let query = supabaseServer
      .from('fixtures')
      .select('*')
      .eq('status', 'finished')
      .or(SEASON_FILTER)
      .gte('date', CURRENT_SEASON_START.toISOString())
      .lte('date', CURRENT_SEASON_END.toISOString());
    
    if (matchweek !== null) {
      query = query.eq('matchweek', matchweek);
    }
    
    const [resultsResult, cacheMetaResult] = await Promise.all([
      query.order('date', { ascending: true }),
      supabaseServer
        .from('cache_metadata')
        .select('last_updated')
        .eq('key', 'fixtures') // Use fixtures cache metadata since results come from fixtures
        .single()
    ]);

    const resultsData = resultsResult.data as FixtureRow[] | null;
    const dbError = resultsResult.error;
    const cacheMeta = cacheMetaResult.data as CacheMetaResult;

    const competitionSet = new Set(DEFAULT_COMPETITIONS);

    // Log Supabase configuration for debugging
    const hasSupabaseUrl = !!process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const hasServiceRoleKey = !!process.env['SUPABASE_SERVICE_ROLE_KEY'];
    const hasAnonKey = !!process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
    console.log(`[Results API] Supabase config - URL: ${hasSupabaseUrl}, ServiceRoleKey: ${hasServiceRoleKey}, AnonKey: ${hasAnonKey}`);

    if (dbError) {
      console.error("[Results API] Database error:", dbError);
      console.error("[Results API] Error details:", JSON.stringify(dbError, null, 2));
    }

    // Log database count for debugging
    console.log(`[Results API] Database returned ${resultsData?.length || 0} finished fixtures${matchweek ? ` for matchweek ${matchweek}` : ''}`);
    
    // Log competition breakdown for debugging
    if (resultsData && resultsData.length > 0) {
      const competitionCounts = resultsData.reduce((acc, row) => {
        const comp = row.competition || 'null';
        acc[comp] = (acc[comp] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      console.log(`[Results API] Competition breakdown:`, JSON.stringify(competitionCounts));
    }
    
    if (!resultsData || resultsData.length === 0) {
      console.warn(`[Results API] No data in database! This will trigger scraping.`);
    }

    // Check if data exists and is recent
    const lastUpdated = cacheMeta?.last_updated ? new Date(cacheMeta.last_updated) : null;
    const now = new Date();
    const isDataFresh = lastUpdated && (now.getTime() - lastUpdated.getTime()) < CACHE_DURATION;

    // If we have data in database (even if stale), return it immediately for fast response
    if (resultsData && resultsData.length > 0) {
      // Convert database format to app format
      const results: Fixture[] = resultsData
        .filter((row) => competitionSet.has(normalizeCompetition(row.competition)))
        .map(row => ({
          id: row.id,
          date: row.date,
          homeTeam: row.home_team,
          awayTeam: row.away_team,
          homeScore: row.home_score,
          awayScore: row.away_score,
          matchweek: row.matchweek,
          originalMatchweek: row.original_matchweek ?? undefined,
          status: row.status as Fixture['status'],
          isDerby: row.is_derby,
          season: row.season || undefined,
          competition: normalizeCompetition(row.competition),
          competitionRound: row.competition_round
        }));
      const normalizedResults = normalizeAndDedupeFixtures(results);
      
      // Log filtering results
      console.log(`[Results API] After competition filter: ${results.length} results (from ${resultsData?.length || 0} total)`);
      console.log(`[Results API] After normalization/dedupe: ${normalizedResults.length} results`);

      // If data is fresh, return immediately
      if (isDataFresh) {
        console.log(`[Results API] Returning ${normalizedResults.length} results from database (fresh)${matchweek ? ` for matchweek ${matchweek}` : ''}`);
        return NextResponse.json(normalizedResults, {
          headers: {
            "X-Cache": "HIT",
            "X-DB-Count": String(resultsData?.length || 0),
            "X-Filtered-Count": String(normalizedResults.length),
            "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
          },
        });
      }

      // Data exists but is stale - return it immediately (fixtures API will refresh in background)
      console.log(`[Results API] Returning ${normalizedResults.length} results from database (stale)${matchweek ? ` for matchweek ${matchweek}` : ''}`);
      return NextResponse.json(normalizedResults, {
        headers: {
          "X-Cache": "STALE",
          "X-DB-Count": String(resultsData?.length || 0),
          "X-Filtered-Count": String(normalizedResults.length),
          "Cache-Control": "public, s-maxage=0, stale-while-revalidate=3600",
        },
      });
    }

    // No data in database - must scrape (this will be slower)
    console.log("[Results API] No data in database. Scraping fresh results...");
    try {
      // Try OneFootball first (simpler, faster, no Puppeteer needed)
      let scrapedResults: Fixture[] = [];
      let scrapeSource = 'unknown';
      
      try {
        console.log("[Results API] Attempting to scrape results from OneFootball...");
        scrapedResults = await scrapeResultsFromOneFootball();
        scrapeSource = 'onefootball';
        console.log(`[Results API] Successfully scraped ${scrapedResults.length} results from OneFootball`);
      } catch (onefootballError) {
        console.warn("[Results API] OneFootball scraping failed, falling back to official site:", onefootballError);
        // Fallback to official Premier League site scraper
        scrapedResults = await scrapeResults();
        scrapeSource = 'official-site';
        console.log(`[Results API] Successfully scraped ${scrapedResults.length} results from official site`);
      }

      if (scrapedResults.length > 0) {
        // Store in database (these will be marked as finished)
        console.log(`[Results API] Storing ${scrapedResults.length} scraped results in database...`);

        const dbResults = scrapedResults.map(result => ({
          id: result.id,
          date: result.date,
          home_team: result.homeTeam,
          away_team: result.awayTeam,
          home_score: result.homeScore,
          away_score: result.awayScore,
          matchweek: result.matchweek,
          status: 'finished' as const, // Results are always finished matches
          is_derby: result.isDerby || false,
          season: result.season || undefined,
          competition: "Premier League",
          competition_round: null
        }));

        // Upsert results (merge with existing data, don't replace)
        // Use server client to bypass RLS for server-side operations
        const { error: insertError } = await supabaseServer
          .from('fixtures')
          .upsert(dbResults, { onConflict: 'id' });

        if (insertError) {
          console.error("[Results API] Error storing results:", insertError);
        } else {
          // Update cache metadata
          await supabaseServer
            .from('cache_metadata')
            .upsert({
              key: 'fixtures',
              last_updated: new Date().toISOString(),
              data_count: scrapedResults.length
            }, { onConflict: 'key' });
        }
      }

      // After upserting, fetch ALL results from database (including previously stored ones)
      // This ensures we return all results, not just the ones we just scraped
      let allResultsQuery = supabaseServer
        .from('fixtures')
        .select('*')
        .eq('status', 'finished');
      
      if (matchweek !== null) {
        allResultsQuery = allResultsQuery.eq('matchweek', matchweek);
      }
      
      const { data: allResultsData, error: fetchError } = await allResultsQuery
        .order('date', { ascending: true });

      if (fetchError) {
        console.error("[Results API] Error fetching all results after upsert:", fetchError);
        // Fallback to returning scraped results if fetch fails
        const normalizedScrapedResults = normalizeAndDedupeFixtures(
          scrapedResults.map((result) => ({
            ...result,
            competition: "Premier League",
            competitionRound: null
          }))
        );

        return NextResponse.json(normalizedScrapedResults, {
          headers: {
            "X-Cache": "MISS-SCRAPED",
            "X-Source": scrapeSource,
            "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
          },
        });
      }

      // Convert database format to app format
      const allResults: Fixture[] = (allResultsData || [])
        .filter((row) => competitionSet.has(normalizeCompetition(row.competition)))
        .map(row => ({
          id: row.id,
          date: row.date,
          homeTeam: row.home_team,
          awayTeam: row.away_team,
          homeScore: row.home_score,
          awayScore: row.away_score,
          matchweek: row.matchweek,
          originalMatchweek: row.original_matchweek ?? undefined,
          status: row.status as Fixture['status'],
          isDerby: row.is_derby,
          season: row.season || undefined,
          competition: normalizeCompetition(row.competition),
          competitionRound: row.competition_round
        }));
      const normalizedAllResults = normalizeAndDedupeFixtures(allResults);

      console.log(`[Results API] Returning ${normalizedAllResults.length} total results from database (${scrapedResults.length} newly scraped)`);

      return NextResponse.json(normalizedAllResults, {
        headers: {
          "X-Cache": "MISS-SCRAPED",
          "X-Source": scrapeSource,
          "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
        },
      });
    } catch (scrapeError) {
      console.error("[Results API] Scraping failed:", scrapeError);

      // If scraping fails but we have database data, return it
      if (resultsData && resultsData.length > 0) {
        console.log(`[Results API] Returning ${resultsData.length} results from database (fallback)`);

        const results: Fixture[] = resultsData
          .filter((row) => competitionSet.has(normalizeCompetition(row.competition)))
          .map(row => ({
            id: row.id,
            date: row.date,
            homeTeam: row.home_team,
            awayTeam: row.away_team,
            homeScore: row.home_score,
            awayScore: row.away_score,
            matchweek: row.matchweek,
            originalMatchweek: row.original_matchweek ?? undefined,
            status: row.status as Fixture['status'],
            isDerby: row.is_derby,
            season: row.season || undefined,
            competition: normalizeCompetition(row.competition),
            competitionRound: row.competition_round
          }));
        const normalizedResults = normalizeAndDedupeFixtures(results);

        return NextResponse.json(normalizedResults, {
          headers: {
            "X-Cache": "FALLBACK",
          },
        });
      }

      return NextResponse.json([], {
        headers: {
          "X-Cache": "ERROR",
        },
      });
    }
  } catch (error) {
    console.error("Error fetching results:", error);
    return NextResponse.json(
      { error: "Failed to fetch results" },
      { status: 500 }
    );
  }
}
