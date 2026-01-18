import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { supabaseServer } from "@/lib/supabase";
import { scrapeFixturesFromOneFootball, scrapeResultsFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { scrapeStandings } from "@/lib/scrapers/standings";
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
    
    // Scrape all data in parallel
    const [fixturesResult, resultsResult, standingsResult] = await Promise.allSettled([
      scrapeFixturesFromOneFootball(),
      scrapeResultsFromOneFootball(),
      scrapeStandings(),
    ]);
    
    let fixturesCount = 0;
    let resultsCount = 0;
    let standingsCount = 0;
    const errors: string[] = [];
    
    // Process fixtures
    if (fixturesResult.status === "fulfilled" && fixturesResult.value.length > 0) {
      const fixtures = fixturesResult.value;
      const dbFixtures = fixtures.map((f: Fixture) => ({
        id: f.id,
        date: f.date,
        home_team: f.homeTeam,
        away_team: f.awayTeam,
        home_score: f.homeScore,
        away_score: f.awayScore,
        matchweek: f.matchweek,
        status: f.status,
        is_derby: f.isDerby || false
      }));
      
      const { error } = await supabaseServer
        .from('fixtures')
        .upsert(dbFixtures, { onConflict: 'id' });
      
      if (error) {
        console.error("[ForceUpdate] Error storing fixtures:", error);
        errors.push("fixtures");
      } else {
        fixturesCount = fixtures.length;
        await supabaseServer
          .from('cache_metadata')
          .upsert({ key: 'fixtures', last_updated: new Date().toISOString(), data_count: fixturesCount }, { onConflict: 'key' });
      }
    } else if (fixturesResult.status === "rejected") {
      console.error("[ForceUpdate] Fixtures scrape failed:", fixturesResult.reason);
      errors.push("fixtures");
    }
    
    // Process results
    if (resultsResult.status === "fulfilled" && resultsResult.value.length > 0) {
      const results = resultsResult.value;
      const dbResults = results.map((r: Fixture) => ({
        id: r.id,
        date: r.date,
        home_team: r.homeTeam,
        away_team: r.awayTeam,
        home_score: r.homeScore,
        away_score: r.awayScore,
        matchweek: r.matchweek,
        status: 'finished' as const,
        is_derby: r.isDerby || false
      }));
      
      const { error } = await supabaseServer
        .from('fixtures')
        .upsert(dbResults, { onConflict: 'id' });
      
      if (error) {
        console.error("[ForceUpdate] Error storing results:", error);
        errors.push("results");
      } else {
        resultsCount = results.length;
      }
    } else if (resultsResult.status === "rejected") {
      console.error("[ForceUpdate] Results scrape failed:", resultsResult.reason);
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
