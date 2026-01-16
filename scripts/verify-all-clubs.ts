import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";
import { CLUBS } from "../lib/clubs";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyAllClubs() {
  console.log("Verifying all clubs in 2025/26 season...\n");

  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching fixtures:", error);
    return;
  }

  console.log(`Total fixtures in database: ${fixtures?.length || 0}\n`);
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  let allOk = true;

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

    const status = futureFixtures.length > 0 ? "✓" : "✗";
    
    if (futureFixtures.length === 0) {
      allOk = false;
    }

    console.log(`${status} ${clubName}: ${clubFixtures.length} total, ${futureFixtures.length} future`);
  });

  console.log("\n" + (allOk ? "✓ All clubs have fixtures!" : "✗ Some clubs are missing fixtures"));
}

verifyAllClubs().catch(console.error);
