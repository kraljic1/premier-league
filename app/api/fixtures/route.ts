import { NextResponse } from "next/server";
import { scrapeFixtures } from "@/lib/scrapers/fixtures";
import { scrapeFixturesFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { supabase, supabaseServer, FixtureRow } from "@/lib/supabase";
import { Fixture } from "@/lib/types";

export const revalidate = 1800; // 30 minutes

const CACHE_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds

// Type for cache metadata result
type CacheMetaResult = { last_updated: string } | null;

/**
 * Background refresh function - scrapes and stores fixtures without blocking the response
 */
async function refreshFixturesInBackground() {
  try {
    // Check if Supabase is configured before trying to store data
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

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
        is_derby: fixture.isDerby || false
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

export async function GET() {
  try {
    // Check if Supabase is configured
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // Declare fixturesData outside the if-else block so it's accessible throughout the function
    let fixturesData: FixtureRow[] | null = null;

    if (!supabaseUrl || !supabaseKey || supabaseUrl === 'https://placeholder.supabase.co') {
      console.warn('[Fixtures API] Supabase not configured, falling back to scraping');
      // Skip to scraping logic below
    } else {
      // Check database and cache metadata in parallel
      console.log("[Fixtures API] Checking database for fixtures...");

      const [fixturesResult, cacheMetaResult] = await Promise.all([
        supabaseServer
          .from('fixtures')
          .select('*')
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
        const fixtures: Fixture[] = fixturesData.map(row => ({
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
          console.log(`[Fixtures API] Returning ${fixtures.length} fixtures from database (fresh)`);
          return NextResponse.json(fixtures, {
            headers: {
              "X-Cache": "HIT",
              "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
            },
          });
        }

        // Data exists but is stale - return it immediately and refresh in background
        console.log(`[Fixtures API] Returning ${fixtures.length} fixtures from database (stale, refreshing in background)`);

        // Start background refresh (don't await - return immediately)
        refreshFixturesInBackground().catch(err => {
          console.error("[Fixtures API] Background refresh error:", err);
        });

        return NextResponse.json(fixtures, {
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
          is_derby: fixture.isDerby || false
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

      // After upserting, fetch ALL fixtures from database (including previously stored ones)
      // This ensures we return all fixtures, not just the ones we just scraped
      const { data: allFixturesData, error: fetchError } = await supabaseServer
        .from('fixtures')
        .select('*')
        .order('date', { ascending: true });

      if (fetchError) {
        console.error("[Fixtures API] Error fetching all fixtures after upsert:", fetchError);
        // Fallback to returning scraped fixtures if fetch fails
        return NextResponse.json(scrapedFixtures, {
          headers: {
            "X-Cache": "MISS-SCRAPED",
            "X-Source": scrapeSource,
            "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
          },
        });
      }

      // Convert database format to app format
      const allFixtures: Fixture[] = (allFixturesData || []).map(row => ({
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

      const finishedCount = allFixtures.filter(f => f.status === 'finished').length;
      const upcomingCount = allFixtures.filter(f => f.status !== 'finished').length;
      console.log(`[Fixtures API] Returning ${allFixtures.length} total fixtures from database (${finishedCount} finished, ${upcomingCount} upcoming, ${scrapedFixtures.length} newly scraped)`);

      return NextResponse.json(allFixtures, {
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

        const fixtures: Fixture[] = fixturesData.map((row: FixtureRow) => ({
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

        return NextResponse.json(fixtures, {
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
    console.error("Error fetching fixtures:", error);
    return NextResponse.json(
      { error: "Failed to fetch fixtures" },
      { status: 500 }
    );
  }
}

