import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import {
  scrapeFixturesFromOneFootball,
  scrapeResultsFromOneFootball,
  scrapeStandingsFromOneFootball
} from "@/lib/scrapers/onefootball-fixtures";
import { scrapeFixtures } from "@/lib/scrapers/fixtures";
import { Fixture, Standing } from "@/lib/types";
import {
  logApiRequest,
  createSecureResponse,
  sanitizeError,
  validateEnvironment
} from "@/lib/security";

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * Force Update Endpoint
 * 
 * Immediately scrapes fresh data and updates the database.
 * No authentication required - meant to be called by client-side refresh button.
 * Rate limited to prevent abuse.
 */

// Simple in-memory rate limiting
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3;
const requestLog: Map<string, number[]> = new Map();

function isRateLimited(clientIp: string): boolean {
  const now = Date.now();
  const requests = requestLog.get(clientIp) || [];
  
  // Filter to only recent requests
  const recentRequests = requests.filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  requestLog.set(clientIp, recentRequests);
  
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  // Log this request
  recentRequests.push(now);
  requestLog.set(clientIp, recentRequests);
  return false;
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    // Validate environment
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      console.error("[ForceUpdate] Missing environment variables");
      return createSecureResponse(
        { error: "Service temporarily unavailable" },
        { status: 503 }
      );
    }
    
    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    if (isRateLimited(clientIp)) {
      console.log(`[ForceUpdate] Rate limited: ${clientIp}`);
      return createSecureResponse(
        { error: "Too many requests. Please wait a minute before trying again." },
        { status: 429 }
      );
    }
    
    console.log("[ForceUpdate] Starting forced data refresh...");

    // Test scraping directly
    console.log("[ForceUpdate] Testing fixture scraping...");
    const fixtures = await scrapeFixturesFromOneFootball();
    console.log(`[ForceUpdate] Scraped ${fixtures.length} fixtures`);

    // Scrape all data using OneFootball (now fixed)
    const [fixturesResult, resultsResult, standingsResult] = await Promise.allSettled([
      Promise.resolve(fixtures),
      scrapeResultsFromOneFootball(),
      scrapeStandingsFromOneFootball(),
    ]);
    
    let fixturesCount = 0;
    let resultsCount = 0;
    let standingsCount = 0;
    const errors: string[] = [];
    const dbErrors: any[] = [];
    
    // Process fixtures
    console.log(`[ForceUpdate] Fixtures result status: ${fixturesResult.status}`);
    if (fixturesResult.status === "fulfilled") {
      const fixtures = fixturesResult.value;
      console.log(`[ForceUpdate] Fixtures array length: ${fixtures.length}`);

      if (fixtures.length > 0) {
        console.log(`[ForceUpdate] Processing ${fixtures.length} fixtures`);
        const dbFixtures = fixtures.map((f: Fixture) => ({
          id: f.id,
          date: f.date,
          home_team: f.homeTeam,
          away_team: f.awayTeam,
          home_score: f.homeScore,
          away_score: f.awayScore,
          matchweek: f.matchweek,
          status: f.status,
          is_derby: f.isDerby || false,
          season: '2025/2026'
        }));

        console.log(`[ForceUpdate] First fixture:`, dbFixtures[0]);

        try {
          // Use individual updates/inserts instead of bulk upsert to avoid constraint issues
          let updatedCount = 0;
          for (const fixture of dbFixtures) {
            // Try to update first
            const { data: existing } = await supabaseServer
              .from('fixtures')
              .select('id')
              .eq('id', fixture.id)
              .single();

            if (existing) {
              // Update existing
              const { error } = await supabaseServer
                .from('fixtures')
                .update({
                  home_score: fixture.home_score,
                  away_score: fixture.away_score,
                  status: fixture.status,
                  matchweek: fixture.matchweek,
                  is_derby: fixture.is_derby,
                  season: fixture.season
                })
                .eq('id', fixture.id);

              if (error) {
                console.error(`[ForceUpdate] Error updating fixture ${fixture.id}:`, error);
              } else {
                updatedCount++;
              }
            } else {
              // Insert new
              const { error } = await supabaseServer
                .from('fixtures')
                .insert(fixture);

              if (error && !error.message.includes('duplicate key')) {
                console.error(`[ForceUpdate] Error inserting fixture ${fixture.id}:`, error);
              } else {
                updatedCount++;
              }
            }
          }

          fixturesCount = updatedCount;
          console.log(`[ForceUpdate] Successfully processed ${fixturesCount} fixtures`);
          await supabaseServer
            .from('cache_metadata')
            .upsert({ key: 'fixtures', last_updated: new Date().toISOString(), data_count: fixturesCount }, { onConflict: 'key' });

        } catch (dbError) {
          console.error("[ForceUpdate] Exception storing fixtures:", dbError);
          errors.push("fixtures");
          dbErrors.push({ type: "fixtures", exception: dbError instanceof Error ? dbError.message : String(dbError) });
        }
      } else {
        console.error("[ForceUpdate] Empty fixtures array");
        errors.push("fixtures");
      }
    } else {
      console.error("[ForceUpdate] Fixtures scraping rejected:", fixturesResult.reason);
      errors.push("fixtures");
    }
    
    // Process results
    console.log(`[ForceUpdate] Results result status: ${resultsResult.status}`);
    if (resultsResult.status === "fulfilled") {
      const results = resultsResult.value;
      console.log(`[ForceUpdate] Results array length: ${results.length}`);

      if (results.length > 0) {
        try {
          // Use individual updates/inserts instead of bulk upsert
          let updatedCount = 0;
          for (const result of results) {
            const dbResult = {
              id: result.id,
              date: result.date,
              home_team: result.homeTeam,
              away_team: result.awayTeam,
              home_score: result.homeScore,
              away_score: result.awayScore,
              matchweek: result.matchweek,
              status: 'finished' as const,
              is_derby: result.isDerby || false,
              season: '2025/2026'
            };

            // Try to update first
            const { data: existing } = await supabaseServer
              .from('fixtures')
              .select('id')
              .eq('id', dbResult.id)
              .single();

            if (existing) {
              // Update existing
              const { error } = await supabaseServer
                .from('fixtures')
                .update({
                  home_score: dbResult.home_score,
                  away_score: dbResult.away_score,
                  status: dbResult.status,
                  matchweek: dbResult.matchweek,
                  is_derby: dbResult.is_derby,
                  season: dbResult.season
                })
                .eq('id', dbResult.id);

              if (error) {
                console.error(`[ForceUpdate] Error updating result ${dbResult.id}:`, error);
              } else {
                updatedCount++;
              }
            } else {
              // Insert new
              const { error } = await supabaseServer
                .from('fixtures')
                .insert(dbResult);

              if (error && !error.message.includes('duplicate key')) {
                console.error(`[ForceUpdate] Error inserting result ${dbResult.id}:`, error);
              } else {
                updatedCount++;
              }
            }
          }

          resultsCount = updatedCount;
          console.log(`[ForceUpdate] Successfully processed ${resultsCount} results`);

        } catch (dbError) {
          console.error("[ForceUpdate] Exception storing results:", dbError);
          errors.push("results");
          dbErrors.push({ type: "results", exception: dbError instanceof Error ? dbError.message : String(dbError) });
        }
      } else {
        console.error("[ForceUpdate] Empty results array");
        errors.push("results");
      }
    } else {
      console.error("[ForceUpdate] Results scraping rejected:", resultsResult.reason);
      errors.push("results");
    }
    
    // Process standings
    if (standingsResult.status === "fulfilled" && standingsResult.value.length > 0) {
      const standings = standingsResult.value;
      const dbStandings = standings.map((s: Standing) => ({
        position: s.position,
        club: s.club,
        played: s.played,
        won: s.won,
        drawn: s.drawn,
        lost: s.lost,
        goals_for: s.goalsFor,
        goals_against: s.goalsAgainst,
        goal_difference: s.goalDifference,
        points: s.points,
        form: s.form,
        season: '2025'
      }));
      
      // Delete and insert for standings
      await supabaseServer.from('standings').delete().eq('season', '2025');
      const { error } = await supabaseServer.from('standings').insert(dbStandings);
      
      if (error) {
        console.error("[ForceUpdate] Error storing standings:", error);
        errors.push("standings");
      } else {
        standingsCount = standings.length;
        await supabaseServer
          .from('cache_metadata')
          .upsert({ key: 'standings', last_updated: new Date().toISOString(), data_count: standingsCount }, { onConflict: 'key' });
      }
    } else if (standingsResult.status === "rejected") {
      console.error("[ForceUpdate] Standings scrape failed:", standingsResult.reason);
      errors.push("standings");
    }
    
    // Revalidate Next.js cache
    revalidatePath("/api/fixtures");
    revalidatePath("/api/results");
    revalidatePath("/api/standings");
    revalidatePath("/");
    revalidatePath("/fixtures-results");
    revalidatePath("/standings");
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    console.log(`[ForceUpdate] Completed in ${duration}s - Fixtures: ${fixturesCount}, Results: ${resultsCount}, Standings: ${standingsCount}`);
    
    // Debug: return detailed status
    const debugInfo = {
      fixturesResultStatus: fixturesResult.status,
      fixturesResultLength: fixturesResult.status === 'fulfilled' ? fixturesResult.value.length : 0,
      resultsResultStatus: resultsResult.status,
      resultsResultLength: resultsResult.status === 'fulfilled' ? resultsResult.value.length : 0,
      standingsResultStatus: standingsResult.status,
      standingsResultLength: standingsResult.status === 'fulfilled' ? standingsResult.value.length : 0,
    };

    return createSecureResponse({
      success: errors.length === 0,
      message: errors.length === 0 ? "Data refreshed successfully" : "Data refreshed with some errors",
      fixturesUpdated: fixturesCount,
      resultsUpdated: resultsCount,
      standingsUpdated: standingsCount,
      errors: errors.length > 0 ? errors : undefined,
      duration: `${duration}s`,
      timestamp: new Date().toISOString(),
    });
    
  } catch (error) {
    const sanitizedError = sanitizeError(error);
    console.error("[ForceUpdate] Error:", error);
    
    return createSecureResponse(
      { error: "Failed to refresh data", details: sanitizedError },
      { status: 500 }
    );
  }
}
