import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMatchweeks() {
  console.log("Checking matchweeks in database...\n");

  // Get scheduled fixtures
  const { data: scheduledFixtures, error: scheduledError } = await supabase
    .from("fixtures")
    .select("matchweek, date, home_team, away_team, status")
    .eq("status", "scheduled")
    .order("matchweek", { ascending: true })
    .order("date", { ascending: true });

  if (scheduledError) {
    console.error("Error fetching scheduled fixtures:", scheduledError);
    return;
  }

  console.log("=== SCHEDULED FIXTURES ===");
  console.log(`Total: ${scheduledFixtures?.length || 0}\n`);

  const byMatchweek = scheduledFixtures?.reduce((acc: any, fixture: any) => {
    if (!acc[fixture.matchweek]) {
      acc[fixture.matchweek] = [];
    }
    acc[fixture.matchweek].push(fixture);
    return acc;
  }, {});

  Object.keys(byMatchweek || {}).sort((a, b) => parseInt(a) - parseInt(b)).forEach((mw) => {
    const fixtures = byMatchweek[mw];
    console.log(`Matchweek ${mw}: ${fixtures.length} matches`);
    fixtures.slice(0, 2).forEach((f: any) => {
      console.log(`  - ${f.home_team} vs ${f.away_team} (${new Date(f.date).toLocaleString()})`);
    });
    if (fixtures.length > 2) {
      console.log(`  ... and ${fixtures.length - 2} more`);
    }
    console.log();
  });

  // Get finished fixtures
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

  console.log(`Last finished matchweek: ${finishedFixtures?.[0]?.matchweek || 0}`);
}

checkMatchweeks().catch(console.error);
