import { NextResponse } from "next/server";
import { scrapeFixtures } from "@/lib/scrapers/fixtures";
import { scrapeFixturesFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { supabase, supabaseServer } from "@/lib/supabase";
import { Fixture } from "@/lib/types";

export const revalidate = 1800; // 30 minutes

const CACHE_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds

export async function GET() {
  try {
    // Check database and cache metadata in parallel
    console.log("[Fixtures API] Checking database for fixtures...");

    const [fixturesResult, cacheMetaResult] = await Promise.all([
      supabase
        .from('fixtures')
        .select('*')
        .order('date', { ascending: true }),
      supabase
        .from('cache_metadata')
        .select('last_updated')
        .eq('key', 'fixtures')
        .single()
    ]);

    const { data: fixturesData, error: dbError } = fixturesResult;
    const { data: cacheMeta } = cacheMetaResult as { data: { last_updated: string } | null };

    if (dbError) {
      console.error("[Fixtures API] Database error:", dbError);
    }

    // Check if data exists and is recent (within cache duration)
    if (fixturesData && fixturesData.length > 0) {
      const lastUpdated = cacheMeta?.last_updated ? new Date(cacheMeta.last_updated) : null;
      const now = new Date();
      const isDataFresh = lastUpdated && (now.getTime() - lastUpdated.getTime()) < CACHE_DURATION;

      if (isDataFresh) {
        console.log(`[Fixtures API] Returning ${fixturesData.length} fixtures from database (fresh)`);

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

        return NextResponse.json(fixtures, {
          headers: {
            "X-Cache": "HIT",
          },
        });
      }
    }

    // Data is stale or doesn't exist, scrape fresh data
    console.log("[Fixtures API] Data is stale or missing. Scraping fresh fixtures...");
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
        console.log(`[Fixtures API] Storing ${scrapedFixtures.length} fixtures in database...`);

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

      return NextResponse.json(scrapedFixtures, {
        headers: {
          "X-Cache": "MISS-SCRAPED",
          "X-Source": scrapeSource,
        },
      });
    } catch (scrapeError) {
      console.error("[Fixtures API] Scraping failed:", scrapeError);

      // If scraping fails but we have database data, return it
      if (fixturesData && fixturesData.length > 0) {
        console.log(`[Fixtures API] Returning ${fixturesData.length} fixtures from database (fallback)`);

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

