import { Handler, schedule } from "@netlify/functions";
import { createClient } from "@supabase/supabase-js";

/**
 * Daily Scheduler Function
 * 
 * Runs once daily to analyze fixtures calendar and schedule update times
 * - Finds all upcoming matches in the next 7 days
 * - Calculates when each match will finish (start + 120 minutes)
 * - Stores scheduled update times in database
 * - Update function checks these times instead of running blindly
 */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

const supabase = createClient(supabaseUrl, supabaseKey);

interface ScheduledUpdate {
  match_id: string;
  update_time: string; // When to run the update (match start + 120 min)
  home_team: string;
  away_team: string;
  match_start: string;
}

/**
 * Create or update scheduled_updates table if it doesn't exist
 */
async function ensureScheduledUpdatesTable() {
  // Check if table exists by trying to query it
  const { error } = await supabase
    .from("scheduled_updates")
    .select("match_id")
    .limit(1);

  if (error) {
    console.log("[ScheduleUpdates] Table doesn't exist - will be created on first insert");
    // Table will be created automatically by Supabase on first insert
    // Or you can run this migration manually:
    /*
    CREATE TABLE IF NOT EXISTS scheduled_updates (
      match_id VARCHAR(100) PRIMARY KEY,
      update_time TIMESTAMP WITH TIME ZONE NOT NULL,
      home_team VARCHAR(100) NOT NULL,
      away_team VARCHAR(100) NOT NULL,
      match_start TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_scheduled_updates_time ON scheduled_updates(update_time);
    */
  }
}

/**
 * Find all upcoming matches and calculate update times
 */
async function scheduleUpdates(): Promise<number> {
  const now = new Date();
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  console.log(`[ScheduleUpdates] Finding matches between ${now.toISOString()} and ${next7Days.toISOString()}`);

  // Get all scheduled matches in the next 7 days
  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("id, date, home_team, away_team, status")
    .eq("status", "scheduled")
    .gte("date", now.toISOString())
    .lte("date", next7Days.toISOString())
    .order("date", { ascending: true });

  if (error) {
    console.error("[ScheduleUpdates] Error fetching fixtures:", error);
    throw error;
  }

  if (!fixtures || fixtures.length === 0) {
    console.log("[ScheduleUpdates] No upcoming matches found");
    return 0;
  }

  console.log(`[ScheduleUpdates] Found ${fixtures.length} upcoming matches`);

  // Calculate update times (match start + 120 minutes)
  const scheduledUpdates: ScheduledUpdate[] = fixtures.map((fixture) => {
    const matchStart = new Date(fixture.date);
    const updateTime = new Date(matchStart.getTime() + 120 * 60 * 1000); // +120 minutes

    return {
      match_id: fixture.id,
      update_time: updateTime.toISOString(),
      home_team: fixture.home_team,
      away_team: fixture.away_team,
      match_start: fixture.date,
    };
  });

  // Clear old scheduled updates
  await supabase.from("scheduled_updates").delete().lt("update_time", now.toISOString());

  // Insert new scheduled updates
  const { error: insertError } = await supabase
    .from("scheduled_updates")
    .upsert(scheduledUpdates, {
      onConflict: "match_id",
      ignoreDuplicates: false,
    });

  if (insertError) {
    console.error("[ScheduleUpdates] Error inserting scheduled updates:", insertError);
    throw insertError;
  }

  console.log(`[ScheduleUpdates] Scheduled ${scheduledUpdates.length} updates:`);
  scheduledUpdates.slice(0, 5).forEach((update) => {
    const updateTime = new Date(update.update_time);
    console.log(
      `  - ${update.home_team} vs ${update.away_team}: Update at ${updateTime.toLocaleString()}`
    );
  });
  if (scheduledUpdates.length > 5) {
    console.log(`  ... and ${scheduledUpdates.length - 5} more`);
  }

  return scheduledUpdates.length;
}

// Run once daily at 2 AM UTC (to schedule updates for the day)
export const handler = schedule("0 2 * * *", async (event, context) => {
  console.log("[ScheduleUpdates] =========================================");
  console.log("[ScheduleUpdates] Daily scheduler started");
  console.log("[ScheduleUpdates] =========================================");
  const startTime = Date.now();

  try {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    await ensureScheduledUpdatesTable();

    const scheduledCount = await scheduleUpdates();

    const duration = Math.round((Date.now() - startTime) / 1000);

    console.log(`[ScheduleUpdates] Completed in ${duration}s. Scheduled ${scheduledCount} updates.`);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: `Scheduled ${scheduledCount} updates`,
        scheduledCount,
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("[ScheduleUpdates] Error:", error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
});
