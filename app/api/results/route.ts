import { NextResponse } from "next/server";
import { scrapeResults } from "@/lib/scrapers/results";
import { supabase } from "@/lib/supabase";
import { Fixture } from "@/lib/types";

export const revalidate = 1800; // 30 minutes

const CACHE_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds

export async function GET() {
  try {
    // Check database for finished fixtures
    console.log("[Results API] Checking database for finished matches...");

    const { data: resultsData, error: dbError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('status', 'finished')
      .order('date', { ascending: true });

    if (dbError) {
      console.error("[Results API] Database error:", dbError);
    }

    // Check if data exists and is recent
    if (resultsData && resultsData.length > 0) {
      // Check cache metadata for last update time
      const { data: cacheMeta } = await supabase
        .from('cache_metadata')
        .select('last_updated')
        .eq('key', 'fixtures') // Use fixtures cache metadata since results come from fixtures
        .single();

      const lastUpdated = cacheMeta?.last_updated ? new Date(cacheMeta.last_updated) : null;
      const now = new Date();
      const isDataFresh = lastUpdated && (now.getTime() - lastUpdated.getTime()) < CACHE_DURATION;

      if (isDataFresh) {
        console.log(`[Results API] Returning ${resultsData.length} results from database (fresh)`);

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

        return NextResponse.json(results, {
          headers: {
            "X-Cache": "HIT",
          },
        });
      }
    }

    // Data is stale or doesn't exist, scrape fresh results
    console.log("[Results API] Data is stale or missing. Scraping fresh results...");
    try {
      const scrapedResults = await scrapeResults();

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
          status: 'finished', // Results are always finished matches
          is_derby: result.isDerby || false
        }));

        // Upsert results
        const { error: insertError } = await supabase
          .from('fixtures')
          .upsert(dbResults, { onConflict: 'id' });

        if (insertError) {
          console.error("[Results API] Error storing results:", insertError);
        } else {
          // Update cache metadata
          await supabase
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
