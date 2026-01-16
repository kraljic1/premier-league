import { NextResponse } from "next/server";
import { scrapeResults } from "@/lib/scrapers/results";
import { scrapeResultsFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { supabase, supabaseServer, FixtureRow } from "@/lib/supabase";
import { Fixture } from "@/lib/types";

export const revalidate = 1800; // 30 minutes

const CACHE_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds

// Type for cache metadata result
type CacheMetaResult = { last_updated: string } | null;

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

    // Build query
    let query = supabase
      .from('fixtures')
      .select('*')
      .eq('status', 'finished');
    
    if (matchweek !== null) {
      query = query.eq('matchweek', matchweek);
    }
    
    const [resultsResult, cacheMetaResult] = await Promise.all([
      query.order('date', { ascending: true }),
      supabase
        .from('cache_metadata')
        .select('last_updated')
        .eq('key', 'fixtures') // Use fixtures cache metadata since results come from fixtures
        .single()
    ]);

    const resultsData = resultsResult.data as FixtureRow[] | null;
    const dbError = resultsResult.error;
    const cacheMeta = cacheMetaResult.data as CacheMetaResult;

    if (dbError) {
      console.error("[Results API] Database error:", dbError);
    }

    // Check if data exists and is recent
    const lastUpdated = cacheMeta?.last_updated ? new Date(cacheMeta.last_updated) : null;
    const now = new Date();
    const isDataFresh = lastUpdated && (now.getTime() - lastUpdated.getTime()) < CACHE_DURATION;

    // If we have data in database (even if stale), return it immediately for fast response
    if (resultsData && resultsData.length > 0) {
      // Convert database format to app format
      const results: Fixture[] = resultsData.map(row => ({
        id: row.id,
        date: row.date,
        homeTeam: row.home_team,
        awayTeam: row.away_team,
        homeScore: row.home_score,
        awayScore: row.away_score,
        matchweek: row.matchweek,
        status: row.status as Fixture['status'],
        isDerby: row.is_derby
      }));

      // If data is fresh, return immediately
      if (isDataFresh) {
        console.log(`[Results API] Returning ${results.length} results from database (fresh)${matchweek ? ` for matchweek ${matchweek}` : ''}`);
        return NextResponse.json(results, {
          headers: {
            "X-Cache": "HIT",
            "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
          },
        });
      }

      // Data exists but is stale - return it immediately (fixtures API will refresh in background)
      console.log(`[Results API] Returning ${results.length} results from database (stale)${matchweek ? ` for matchweek ${matchweek}` : ''}`);
      return NextResponse.json(results, {
        headers: {
          "X-Cache": "STALE",
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
        console.log(`[Results API] Storing ${scrapedResults.length} results in database...`);

        const dbResults = scrapedResults.map(result => ({
          id: result.id,
          date: result.date,
          home_team: result.homeTeam,
          away_team: result.awayTeam,
          home_score: result.homeScore,
          away_score: result.awayScore,
          matchweek: result.matchweek,
          status: 'finished' as const, // Results are always finished matches
          is_derby: result.isDerby || false
        }));

        // Upsert results
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

      return NextResponse.json(scrapedResults, {
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

        const results: Fixture[] = resultsData.map(row => ({
          id: row.id,
          date: row.date,
          homeTeam: row.home_team,
          awayTeam: row.away_team,
          homeScore: row.home_score,
          awayScore: row.away_score,
          matchweek: row.matchweek,
          status: row.status as Fixture['status'],
          isDerby: row.is_derby
        }));

        return NextResponse.json(results, {
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
