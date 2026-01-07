import { NextResponse } from "next/server";
import { scrapeScorers } from "@/lib/scrapers/scorers";
import { supabase, supabaseServer } from "@/lib/supabase";
import { Scorer } from "@/lib/types";

export const revalidate = 1800; // 30 minutes

const CACHE_DURATION = 25 * 60 * 1000; // 25 minutes in milliseconds

export async function GET() {
  try {
    // Check database first
    console.log("[Scorers API] Checking database for scorers...");

    const { data: scorersData, error: dbError } = await supabase
      .from('scorers')
      .select('*')
      .eq('season', '2025')
      .order('goals', { ascending: false });

    if (dbError) {
      console.error("[Scorers API] Database error:", dbError);
    }

    // Check if data exists and is recent
    if (scorersData && scorersData.length > 0) {
      // Check cache metadata for last update time
      const { data: cacheMeta } = await supabase
        .from('cache_metadata')
        .select('last_updated')
        .eq('key', 'scorers')
        .single();

      const lastUpdated = cacheMeta?.last_updated ? new Date(cacheMeta.last_updated) : null;
      const now = new Date();
      const isDataFresh = lastUpdated && (now.getTime() - lastUpdated.getTime()) < CACHE_DURATION;

      if (isDataFresh) {
        console.log(`[Scorers API] Returning ${scorersData.length} scorers from database (fresh)`);

        // Convert database format to app format
        const scorers: Scorer[] = scorersData.map(row => ({
          name: row.name,
          club: row.club,
          goals: row.goals,
          assists: row.assists
        }));

        return NextResponse.json(scorers, {
          headers: {
            "X-Cache": "HIT",
          },
        });
      }
    }

    // Data is stale or doesn't exist, scrape fresh data
    console.log("[Scorers API] Data is stale or missing. Scraping fresh scorers...");
    try {
      const scrapedScorers = await scrapeScorers();

      if (scrapedScorers.length > 0) {
        // Store in database
        console.log(`[Scorers API] Storing ${scrapedScorers.length} scorers in database...`);

        const dbScorers = scrapedScorers.map(scorer => ({
          name: scorer.name,
          club: scorer.club,
          goals: scorer.goals,
          assists: scorer.assists,
          season: '2025'
        }));

        // Delete existing scorers for this season and insert new ones
        const { error: deleteError } = await supabaseServer
          .from('scorers')
          .delete()
          .eq('season', '2025');

        if (deleteError) {
          console.error("[Scorers API] Error deleting old scorers:", deleteError);
        }

        const { error: insertError } = await supabaseServer
          .from('scorers')
          .insert(dbScorers);

        if (insertError) {
          console.error("[Scorers API] Error storing scorers:", insertError);
        } else {
          // Update cache metadata
          await supabaseServer
            .from('cache_metadata')
            .upsert({
              key: 'scorers',
              last_updated: new Date().toISOString(),
              data_count: scrapedScorers.length
            }, { onConflict: 'key' });
        }
      }

      return NextResponse.json(scrapedScorers, {
        headers: {
          "X-Cache": "MISS-SCRAPED",
        },
      });
    } catch (scrapeError) {
      console.error("[Scorers API] Scraping failed:", scrapeError);

      // If scraping fails but we have database data, return it
      if (scorersData && scorersData.length > 0) {
        console.log(`[Scorers API] Returning ${scorersData.length} scorers from database (fallback)`);

        const scorers: Scorer[] = scorersData.map(row => ({
          name: row.name,
          club: row.club,
          goals: row.goals,
          assists: row.assists
        }));

        return NextResponse.json(scorers, {
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
    console.error("Error fetching scorers:", error);
    return NextResponse.json(
      { error: "Failed to fetch scorers" },
      { status: 500 }
    );
  }
}

