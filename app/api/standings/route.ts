import { NextResponse } from "next/server";
import { scrapeStandings } from "@/lib/scrapers/standings";
import { supabase, supabaseServer, StandingRow } from "@/lib/supabase";
import { Standing } from "@/lib/types";

export const revalidate = 1800; // 30 minutes

const CACHE_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds

// Type for cache metadata result
type CacheMetaResult = { last_updated: string } | null;

/**
 * Background refresh function - scrapes and stores standings without blocking the response
 */
async function refreshStandingsInBackground() {
  try {
    console.log("[Standings API] Background refresh started...");
    
    const scrapedStandings = await scrapeStandings();
    console.log(`[Standings API] Background refresh: Successfully scraped ${scrapedStandings.length} standings`);

    if (scrapedStandings.length > 0) {
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

      // Delete existing standings and insert new ones
      await supabaseServer.from('standings').delete().eq('season', '2025');
      const { error: insertError } = await supabaseServer
        .from('standings')
        .insert(dbStandings);

      if (insertError) {
        console.error("[Standings API] Background refresh: Error storing standings:", insertError);
      } else {
        await supabaseServer
          .from('cache_metadata')
          .upsert({
            key: 'standings',
            last_updated: new Date().toISOString(),
            data_count: scrapedStandings.length
          }, { onConflict: 'key' });
        
        console.log("[Standings API] Background refresh: Successfully updated database");
      }
    }
  } catch (error) {
    console.error("[Standings API] Background refresh: Unexpected error:", error);
  }
}

export async function GET() {
  try {
    // Check database and cache metadata in parallel
    console.log("[Standings API] Checking database for standings...");

    const [standingsResult, cacheMetaResult] = await Promise.all([
      supabaseServer
        .from('standings')
        .select('*')
        .eq('season', '2025')
        .order('position', { ascending: true }),
      supabaseServer
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

    // Log database count for debugging
    console.log(`[Standings API] Database returned ${standingsData?.length || 0} standings for season 2025`);

    // Check if data exists and is recent
    const lastUpdated = cacheMeta?.last_updated ? new Date(cacheMeta.last_updated) : null;
    const now = new Date();
    const isDataFresh = lastUpdated && (now.getTime() - lastUpdated.getTime()) < CACHE_DURATION;

    // If we have data in database (even if stale), return it immediately for fast response
    // Then refresh in background if stale
    if (standingsData && standingsData.length > 0) {
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

      // If data is fresh, return immediately
      if (isDataFresh) {
        console.log(`[Standings API] Returning ${standings.length} standings from database (fresh)`);
        return NextResponse.json(standings, {
          headers: {
            "X-Cache": "HIT",
            "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
          },
        });
      }

      // Data exists but is stale - return it immediately and refresh in background
      console.log(`[Standings API] Returning ${standings.length} standings from database (stale, refreshing in background)`);
      
      // Start background refresh (don't await - return immediately)
      refreshStandingsInBackground().catch(err => {
        console.error("[Standings API] Background refresh error:", err);
      });

      return NextResponse.json(standings, {
        headers: {
          "X-Cache": "STALE-BACKGROUND-REFRESH",
          "Cache-Control": "public, s-maxage=0, stale-while-revalidate=3600",
        },
      });
    }

    // No data in database - must scrape (this will be slower)
    console.log("[Standings API] No data in database. Scraping fresh standings...");
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
          // Continue and return scraped data even if database storage fails
          console.log("[Standings API] Returning scraped standings despite database error");
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
          "Cache-Control": "public, s-maxage=1500, stale-while-revalidate=3600",
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

      // TEMPORARY: Try scraping one more time and return results even if database storage fails
      console.log("[Standings API] Attempting emergency scrape...");
      try {
        const emergencyStandings = await scrapeStandings();
        if (emergencyStandings.length > 0) {
          console.log(`[Standings API] Emergency scrape successful: ${emergencyStandings.length} standings`);
          return NextResponse.json(emergencyStandings, {
            headers: {
              "X-Cache": "EMERGENCY-SCRAPE",
            },
          });
        }
      } catch (emergencyError) {
        console.error("[Standings API] Emergency scrape also failed:", emergencyError);
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

