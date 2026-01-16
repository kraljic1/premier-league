import { createClient } from "@supabase/supabase-js";
import { scrapeAllFixturesFromRezultati } from "../lib/scrapers/rezultati-fixtures";
import { Fixture } from "../lib/types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchAllRemainingFixtures() {
  console.log("=== Fetching All Remaining Fixtures for 2025/26 Season ===\n");

  try {
    // Step 1: Get the last finished matchweek from database
    console.log("Step 1: Checking last finished matchweek...");
    const { data: finishedFixtures, error: finishedError } = await supabase
      .from("fixtures")
      .select("matchweek")
      .eq("status", "finished")
      .order("matchweek", { ascending: false })
      .limit(1);

    if (finishedError) {
      console.error("Error fetching finished fixtures:", finishedError);
      return;
    }

    const lastFinishedMatchweek = finishedFixtures?.[0]?.matchweek || 0;
    console.log(`Last finished matchweek: ${lastFinishedMatchweek}`);

    // Step 2: Get current scheduled fixtures count
    const { data: currentScheduled, error: currentError } = await supabase
      .from("fixtures")
      .select("matchweek")
      .eq("status", "scheduled");

    if (currentError) {
      console.error("Error fetching current scheduled fixtures:", currentError);
      return;
    }

    console.log(`Current scheduled fixtures in database: ${currentScheduled?.length || 0}`);
    
    const scheduledMatchweeks = currentScheduled
      ? [...new Set(currentScheduled.map((f: any) => f.matchweek))].sort((a, b) => a - b)
      : [];
    
    if (scheduledMatchweeks.length > 0) {
      console.log(`Scheduled matchweeks: ${scheduledMatchweeks.join(", ")}`);
    }

    // Step 3: Scrape all fixtures from Rezultati.com
    console.log("\nStep 2: Scraping all fixtures from Rezultati.com...");
    console.log("This will click 'Show more' button repeatedly to load all matches...\n");

    const scrapedFixtures = await scrapeAllFixturesFromRezultati();

    if (!scrapedFixtures || scrapedFixtures.length === 0) {
      console.error("No fixtures scraped. Exiting.");
      return;
    }

    console.log(`\nSuccessfully scraped ${scrapedFixtures.length} fixtures`);

    // Step 4: Filter for scheduled matches only
    const scheduledFixtures = scrapedFixtures.filter(f => f.status === "scheduled");
    console.log(`Scheduled fixtures: ${scheduledFixtures.length}`);

    // Step 5: Use scraped matchweek numbers (Rezultati.com already provides correct numbers)
    console.log("\nStep 3: Using scraped matchweek numbers...");
    
    const correctedFixtures = scheduledFixtures;
    
    // Display matchweek distribution
    const matchweekDist = correctedFixtures.reduce((acc: Record<number, number>, f) => {
      acc[f.matchweek] = (acc[f.matchweek] || 0) + 1;
      return acc;
    }, {});
    
    const matchweeks = Object.keys(matchweekDist).map(Number).sort((a, b) => a - b);
    console.log(`Matchweeks ${matchweeks[0]} - ${matchweeks[matchweeks.length - 1]}: ${correctedFixtures.length} fixtures`);
    
    // Show first few matchweeks as examples
    matchweeks.slice(0, 5).forEach(mw => {
      const mwFixtures = correctedFixtures.filter(f => f.matchweek === mw);
      if (mwFixtures.length > 0) {
        console.log(`  Matchweek ${mw}: ${mwFixtures.length} matches (${new Date(mwFixtures[0].date).toLocaleDateString()})`);
      }
    });
    
    if (matchweeks.length > 5) {
      console.log(`  ... and ${matchweeks.length - 5} more matchweeks`);
    }

    // Step 6: Store in database
    console.log("\nStep 4: Storing fixtures in database...");

    const dbFixtures = correctedFixtures.map(fixture => {
      const dateOnly = new Date(fixture.date).toISOString().split("T")[0];
      const id = `${fixture.homeTeam.toLowerCase().replace(/\s+/g, "-")}-${fixture.awayTeam.toLowerCase().replace(/\s+/g, "-")}-${dateOnly}-${fixture.matchweek}`;
      
      return {
        id,
        date: fixture.date,
        home_team: fixture.homeTeam,
        away_team: fixture.awayTeam,
        home_score: fixture.homeScore,
        away_score: fixture.awayScore,
        matchweek: fixture.matchweek,
        status: fixture.status,
        is_derby: fixture.isDerby || false,
      };
    });

    // Upsert in batches to avoid timeout
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < dbFixtures.length; i += batchSize) {
      const batch = dbFixtures.slice(i, i + batchSize);
      
      const { error: insertError } = await supabase
        .from("fixtures")
        .upsert(batch, {
          onConflict: "home_team,away_team,date",
          ignoreDuplicates: false,
        });

      if (insertError) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, insertError);
      } else {
        totalInserted += batch.length;
        console.log(`  Inserted batch ${i / batchSize + 1}: ${batch.length} fixtures`);
      }
    }

    // Step 7: Update cache metadata
    await supabase
      .from("cache_metadata")
      .upsert({
        key: "fixtures",
        last_updated: new Date().toISOString(),
        data_count: dbFixtures.length,
      }, { onConflict: "key" });

    console.log(`\n✅ Successfully stored ${totalInserted} fixtures in database!`);

    // Step 8: Verify
    console.log("\nStep 5: Verifying...");
    const { data: verifyScheduled, error: verifyError } = await supabase
      .from("fixtures")
      .select("matchweek")
      .eq("status", "scheduled");

    if (!verifyError && verifyScheduled) {
      const matchweeksAfter = [...new Set(verifyScheduled.map((f: any) => f.matchweek))].sort((a, b) => a - b);
      console.log(`Scheduled fixtures now: ${verifyScheduled.length}`);
      console.log(`Matchweeks: ${matchweeksAfter.join(", ")}`);
      console.log(`Range: MW ${matchweeksAfter[0]} - MW ${matchweeksAfter[matchweeksAfter.length - 1]}`);
    }

  } catch (error) {
    console.error("Error:", error);
  } finally {
    // Close browser if it was opened
    try {
      const { closeBrowser } = await import("../lib/scrapers/browser");
      await closeBrowser();
    } catch (e) {
      // Browser might not be open
    }
  }
}

fetchAllRemainingFixtures().catch(console.error);
