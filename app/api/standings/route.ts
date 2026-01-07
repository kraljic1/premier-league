import { NextResponse } from "next/server";
import { scrapeStandings } from "@/lib/scrapers/standings";
import { supabase, supabaseServer, StandingRow } from "@/lib/supabase";
import { Standing } from "@/lib/types";

export const revalidate = 1800; // 30 minutes

const CACHE_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds

// Type for cache metadata result
type CacheMetaResult = { last_updated: string } | null;

export async function GET() {
  try {
    // Check database and cache metadata in parallel
    console.log("[Standings API] Checking database for standings...");

    const [standingsResult, cacheMetaResult] = await Promise.all([
      supabase
        .from('standings')
        .select('*')
        .eq('season', '2025')
        .order('position', { ascending: true }),
      supabase
        .from('cache_metadata')
        .select('last_updated')
        .eq('key', 'standings')
        .single()
    ]);

    const standingsData = standingsResult.data as StandingRow[] | null;
    const dbError = standingsResult.error;
    const cacheMeta = cacheMetaResult.data as CacheMetaResult;

    if (dbError) {
      console.error("[Standings API] Database error:", dbError);
    }

    // Check if data exists and is recent
    if (standingsData && standingsData.length > 0) {
      const lastUpdated = cacheMeta?.last_updated ? new Date(cacheMeta.last_updated) : null;
      const now = new Date();
      const isDataFresh = lastUpdated && (now.getTime() - lastUpdated.getTime()) < CACHE_DURATION;

      if (isDataFresh) {
        console.log(`[Standings API] Returning ${standingsData.length} standings from database (fresh)`);

        // Convert database format to app format
        const standings: Standing[] = standingsData.map(row => ({
          position: row.position,
          club: row.club,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goals_for,
          goalsAgainst: row.goals_against,
          goalDifference: row.goal_difference,
          points: row.points,
          form: row.form
        }));

        return NextResponse.json(standings, {
          headers: {
            "X-Cache": "HIT",
          },
        });
      }
    }

    // Data is stale or doesn't exist, scrape fresh data
    console.log("[Standings API] Data is stale or missing. Scraping fresh standings...");
    try {
      const scrapedStandings = await scrapeStandings();

      if (scrapedStandings.length > 0) {
        // Store in database
        console.log(`[Standings API] Storing ${scrapedStandings.length} standings in database...`);

        const dbStandings = scrapedStandings.map(standing => ({
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

        // Delete existing standings for this season and insert new ones
        const { error: deleteError } = await supabaseServer
          .from('standings')
          .delete()
          .eq('season', '2025');

        if (deleteError) {
          console.error("[Standings API] Error deleting old standings:", deleteError);
        }

        const { error: insertError } = await supabaseServer
          .from('standings')
          .insert(dbStandings);

        if (insertError) {
          console.error("[Standings API] Error storing standings:", insertError);
        } else {
          // Update cache metadata
          await supabaseServer
            .from('cache_metadata')
            .upsert({
              key: 'standings',
              last_updated: new Date().toISOString(),
              data_count: scrapedStandings.length
            }, { onConflict: 'key' });
        }
      }

      return NextResponse.json(scrapedStandings, {
        headers: {
          "X-Cache": "MISS-SCRAPED",
        },
      });
    } catch (scrapeError) {
      console.error("[Standings API] Scraping failed:", scrapeError);

      // If scraping fails but we have database data, return it
      if (standingsData && standingsData.length > 0) {
        console.log(`[Standings API] Returning ${standingsData.length} standings from database (fallback)`);

        const standings: Standing[] = standingsData.map(row => ({
          position: row.position,
          club: row.club,
          played: row.played,
          won: row.won,
          drawn: row.drawn,
          lost: row.lost,
          goalsFor: row.goals_for,
          goalsAgainst: row.goals_against,
          goalDifference: row.goal_difference,
          points: row.points,
          form: row.form
        }));

        return NextResponse.json(standings, {
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
    console.error("Error fetching standings:", error);
    return NextResponse.json(
      { error: "Failed to fetch standings" },
      { status: 500 }
    );
  }
}

