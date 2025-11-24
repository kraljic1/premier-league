import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { scrapeFixtures } from "@/lib/scrapers/fixtures";
import { scrapeResults } from "@/lib/scrapers/results";
import { scrapeFixturesFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { scrapeResultsFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";
import { scrapeStandings } from "@/lib/scrapers/standings";
import { scrapeScorers } from "@/lib/scrapers/scorers";
import { supabase, supabaseServer } from "@/lib/supabase";
import { Fixture } from "@/lib/types";

export async function POST() {
  try {
    console.log("[Refresh] Starting data refresh at", new Date().toISOString());
    
    // Trigger scraping for all endpoints using separate scrapers
    // Use OneFootball scrapers first (faster, more reliable), fallback to official site
    const [fixtures, results, standings, scorers] = await Promise.allSettled([
      (async () => {
        try {
          console.log("[Refresh] Attempting to scrape fixtures from OneFootball...");
          return await scrapeFixturesFromOneFootball();
        } catch (error) {
          console.warn("[Refresh] OneFootball fixtures failed, using official site:", error);
          return await scrapeFixtures();
        }
      })(),
      (async () => {
        try {
          console.log("[Refresh] Attempting to scrape results from OneFootball...");
          return await scrapeResultsFromOneFootball();
        } catch (error) {
          console.warn("[Refresh] OneFootball results failed, using official site:", error);
          return await scrapeResults();
        }
      })(),
      scrapeStandings(),
      scrapeScorers(),
    ]);
    
    const refreshResults = {
      fixtures: fixtures.status === "fulfilled" ? fixtures.value.length : 0,
      results: results.status === "fulfilled" ? results.value.length : 0,
      standings: standings.status === "fulfilled" ? standings.value.length : 0,
      scorers: scorers.status === "fulfilled" ? scorers.value.length : 0,
      errors: {
        fixtures: fixtures.status === "rejected" ? fixtures.reason?.message : null,
        results: results.status === "rejected" ? results.reason?.message : null,
        standings: standings.status === "rejected" ? standings.reason?.message : null,
        scorers: scorers.status === "rejected" ? scorers.reason?.message : null,
      },
    };

    // Store scraped data in Supabase database
    console.log("[Refresh] Storing data in database...");

    // Store fixtures (all matches: scheduled, live, finished)
    if (fixtures.status === "fulfilled") {
      const fixturesData = fixtures.value as Fixture[];
      console.log(`[Refresh] Storing ${fixturesData.length} fixtures...`);

      const dbFixtures = fixturesData.map(fixture => ({
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

      const { error: fixturesError } = await supabaseServer
        .from('fixtures')
        .upsert(dbFixtures, { onConflict: 'id' });

      if (fixturesError) {
        console.error("[Refresh] Error storing fixtures:", fixturesError);
      } else {
        // Update cache metadata
        await supabaseServer
          .from('cache_metadata')
          .upsert({
            key: 'fixtures',
            last_updated: new Date().toISOString(),
            data_count: fixturesData.length
          }, { onConflict: 'key' });
      }
    }

    // Store results (finished matches only)
    if (results.status === "fulfilled") {
      const resultsData = results.value as Fixture[];
      console.log(`[Refresh] Storing ${resultsData.length} results...`);

      const dbResults = resultsData.map(result => ({
        id: result.id,
        date: result.date,
        home_team: result.homeTeam,
        away_team: result.awayTeam,
        home_score: result.homeScore,
        away_score: result.awayScore,
        matchweek: result.matchweek,
        status: 'finished', // Results are always finished
        is_derby: result.isDerby || false
      }));

      const { error: resultsError } = await supabaseServer
        .from('fixtures')
        .upsert(dbResults, { onConflict: 'id' });

      if (resultsError) {
        console.error("[Refresh] Error storing results:", resultsError);
      }
    }

    // Store standings
    if (standings.status === "fulfilled") {
      const standingsData = standings.value;
      console.log(`[Refresh] Storing ${standingsData.length} standings...`);

      const dbStandings = standingsData.map(standing => ({
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
      const { error: standingsError } = await supabaseServer
        .from('standings')
        .insert(dbStandings);

      if (standingsError) {
        console.error("[Refresh] Error storing standings:", standingsError);
      } else {
        // Update cache metadata
        await supabaseServer
          .from('cache_metadata')
          .upsert({
            key: 'standings',
            last_updated: new Date().toISOString(),
            data_count: standingsData.length
          }, { onConflict: 'key' });
      }
    }

    // Store scorers
    if (scorers.status === "fulfilled") {
      const scorersData = scorers.value;
      console.log(`[Refresh] Storing ${scorersData.length} scorers...`);

      const dbScorers = scorersData.map(scorer => ({
        name: scorer.name,
        club: scorer.club,
        goals: scorer.goals,
        assists: scorer.assists,
        season: '2025'
      }));

      // Delete existing scorers and insert new ones
      await supabaseServer.from('scorers').delete().eq('season', '2025');
      const { error: scorersError } = await supabaseServer
        .from('scorers')
        .insert(dbScorers);

      if (scorersError) {
        console.error("[Refresh] Error storing scorers:", scorersError);
      } else {
        // Update cache metadata
        await supabaseServer
          .from('cache_metadata')
          .upsert({
            key: 'scorers',
            last_updated: new Date().toISOString(),
            data_count: scorersData.length
          }, { onConflict: 'key' });
      }
    }
    
    // Revalidate Next.js cache paths
    revalidatePath("/api/fixtures");
    revalidatePath("/api/results");
    revalidatePath("/api/standings");
    revalidatePath("/api/scorers");
    revalidatePath("/");
    revalidatePath("/fixtures");
    revalidatePath("/results");
    revalidatePath("/standings");
    revalidatePath("/top-scorers");
    
    console.log("[Refresh] Data refresh completed:", refreshResults);
    
    return NextResponse.json({
      success: true,
      message: "Data refreshed and stored in database",
      results: refreshResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Refresh] Error refreshing data:", error);
    return NextResponse.json(
      { error: "Failed to refresh data", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

