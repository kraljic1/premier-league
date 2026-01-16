import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUpcomingMatchweeks() {
  console.log("Fixing matchweek numbers for scheduled fixtures...");

  // Get all scheduled fixtures
  const { data: scheduledFixtures, error: fetchError } = await supabase
    .from("fixtures")
    .select("*")
    .eq("status", "scheduled")
    .order("date", { ascending: true });

  if (fetchError) {
    console.error("Error fetching scheduled fixtures:", fetchError);
    return;
  }

  if (!scheduledFixtures || scheduledFixtures.length === 0) {
    console.log("No scheduled fixtures found");
    return;
  }

  console.log(`Found ${scheduledFixtures.length} scheduled fixtures`);

  // Group by current matchweek to see the distribution
  const byMatchweek = scheduledFixtures.reduce((acc: any, fixture: any) => {
    acc[fixture.matchweek] = (acc[fixture.matchweek] || 0) + 1;
    return acc;
  }, {});

  console.log("Current distribution:", byMatchweek);

  // Get the highest matchweek from finished matches
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

  // Update scheduled fixtures to continue from the last finished matchweek
  const updates: any[] = [];
  const matchweekOffset = lastFinishedMatchweek; // Add this offset to current matchweek numbers

  for (const fixture of scheduledFixtures) {
    const newMatchweek = fixture.matchweek + matchweekOffset;
    updates.push({
      id: fixture.id,
      matchweek: newMatchweek,
    });
  }

  console.log(`\nUpdating ${updates.length} fixtures...`);
  console.log(`Matchweek mapping:`);
  const oldToNew = [...new Set(scheduledFixtures.map((f: any) => f.matchweek))].sort((a, b) => a - b);
  oldToNew.forEach((old) => {
    console.log(`  ${old} → ${old + matchweekOffset}`);
  });

  // Update in batches
  for (const update of updates) {
    const { error: updateError } = await supabase
      .from("fixtures")
      .update({ matchweek: update.matchweek })
      .eq("id", update.id);

    if (updateError) {
      console.error(`Error updating fixture ${update.id}:`, updateError);
    }
  }

  console.log("\n✅ Matchweek numbers updated successfully!");

  // Verify the update
  const { data: updatedFixtures, error: verifyError } = await supabase
    .from("fixtures")
    .select("matchweek")
    .eq("status", "scheduled")
    .order("matchweek", { ascending: true });

  if (!verifyError && updatedFixtures) {
    const newByMatchweek = updatedFixtures.reduce((acc: any, fixture: any) => {
      acc[fixture.matchweek] = (acc[fixture.matchweek] || 0) + 1;
      return acc;
    }, {});
    console.log("New distribution:", newByMatchweek);
  }
}

fixUpcomingMatchweeks().catch(console.error);
