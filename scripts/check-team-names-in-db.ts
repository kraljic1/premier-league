import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

// Load environment variables
config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTeamNames() {
  console.log("Checking all unique team names in database...\n");

  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("home_team, away_team");

  if (error) {
    console.error("Error fetching fixtures:", error);
    return;
  }

  // Collect all unique team names
  const teamNames = new Set<string>();
  
  fixtures?.forEach((f) => {
    if (f.home_team) teamNames.add(f.home_team);
    if (f.away_team) teamNames.add(f.away_team);
  });

  const sortedNames = Array.from(teamNames).sort();

  console.log(`Found ${sortedNames.length} unique team names:\n`);
  sortedNames.forEach((name, index) => {
    console.log(`${index + 1}. ${name}`);
  });
}

checkTeamNames().catch(console.error);
