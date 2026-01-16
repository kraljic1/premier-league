import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { CLUBS } from "../lib/clubs";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFixturesPerClub() {
  console.log("Checking fixtures for all clubs...\n");

  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching fixtures:", error);
    return;
  }

  console.log(`Total fixtures in database: ${fixtures?.length || 0}\n`);

  // Get current date for filtering future fixtures
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  // Check each club
  Object.entries(CLUBS).forEach(([clubId, clubData]) => {
    const clubName = clubData.name;
    
    const clubFixtures = fixtures?.filter(
      (f) => f.home_team === clubName || f.away_team === clubName
    ) || [];
    
    const futureFixtures = clubFixtures.filter((f) => {
      const fixtureDate = new Date(f.date);
      fixtureDate.setHours(0, 0, 0, 0);
      return fixtureDate >= now;
    });

    console.log(`${clubName}:`);
    console.log(`  Total fixtures: ${clubFixtures.length}`);
    console.log(`  Future fixtures: ${futureFixtures.length}`);
    
    if (futureFixtures.length > 0) {
      console.log(`  Next 3 fixtures:`);
      futureFixtures.slice(0, 3).forEach((f) => {
        const isHome = f.home_team === clubName;
        const opponent = isHome ? f.away_team : f.home_team;
        const venue = isHome ? "(H)" : "(A)";
        console.log(`    MW${f.matchweek}: ${f.date.split('T')[0]} vs ${opponent} ${venue}`);
      });
    } else {
      console.log(`  ⚠️  NO FUTURE FIXTURES FOUND!`);
    }
    console.log("");
  });
}

checkFixturesPerClub().catch(console.error);
