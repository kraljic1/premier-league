/**
 * Cleanup script to fix old fixture IDs that included matchweek
 * 
 * The old ID format was: homeTeam-awayTeam-date-matchweek
 * The new ID format is: homeTeam-awayTeam-date
 * 
 * This script:
 * 1. Finds all fixtures with old ID format (containing 4 hyphens + matchweek)
 * 2. Creates new records with the correct ID format
 * 3. Merges data from duplicates (preferring finished status and scores)
 * 4. Deletes old records
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface FixtureRow {
  id: string;
  date: string;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  matchweek: number;
  status: "scheduled" | "live" | "finished";
  is_derby: boolean;
}

/**
 * Generates the new ID format (without matchweek)
 */
function generateNewId(homeTeam: string, awayTeam: string, date: string): string {
  const dateOnly = date.split("T")[0];
  return `${homeTeam.toLowerCase().replace(/\s+/g, "-")}-${awayTeam.toLowerCase().replace(/\s+/g, "-")}-${dateOnly}`;
}

/**
 * Checks if an ID has the old format (with matchweek at the end)
 */
function hasOldIdFormat(id: string): boolean {
  // Old format: team1-team2-YYYY-MM-DD-matchweek
  // New format: team1-team2-YYYY-MM-DD
  // Check if the last segment is a number (matchweek)
  const parts = id.split("-");
  if (parts.length < 5) return false;
  
  const lastPart = parts[parts.length - 1];
  const matchweek = parseInt(lastPart);
  
  // If last part is a number between 1-38, it's likely the old format
  return !isNaN(matchweek) && matchweek >= 1 && matchweek <= 38;
}

async function cleanupFixtureIds() {
  console.log("Starting fixture ID cleanup...\n");

  // Fetch all fixtures
  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("*")
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching fixtures:", error);
    return;
  }

  if (!fixtures || fixtures.length === 0) {
    console.log("No fixtures found in database");
    return;
  }

  console.log(`Found ${fixtures.length} total fixtures\n`);

  // Group fixtures by their new ID (without matchweek)
  const groupedByNewId = new Map<string, FixtureRow[]>();

  for (const fixture of fixtures as FixtureRow[]) {
    const newId = generateNewId(fixture.home_team, fixture.away_team, fixture.date);
    
    if (!groupedByNewId.has(newId)) {
      groupedByNewId.set(newId, []);
    }
    groupedByNewId.get(newId)!.push(fixture);
  }

  // Find groups with duplicates or old IDs
  const toUpdate: { oldIds: string[]; newRecord: FixtureRow }[] = [];
  let duplicatesFound = 0;
  let oldFormatFound = 0;

  for (const [newId, group] of groupedByNewId) {
    // Check if any fixture in the group has an old ID format
    const hasOldFormat = group.some(f => hasOldIdFormat(f.id));
    const hasDuplicates = group.length > 1;

    if (!hasOldFormat && !hasDuplicates) {
      continue; // This group is fine
    }

    if (hasDuplicates) {
      duplicatesFound++;
      console.log(`\nDuplicate found for: ${newId}`);
      for (const f of group) {
        console.log(`  - ID: ${f.id}, Status: ${f.status}, Score: ${f.home_score ?? "?"}-${f.away_score ?? "?"}`);
      }
    }

    if (hasOldFormat && !hasDuplicates) {
      oldFormatFound++;
    }

    // Merge: prefer finished status and scores
    const merged = group.reduce((best, current) => {
      // Prefer finished status
      if (current.status === "finished" && best.status !== "finished") {
        return { ...current, id: newId };
      }
      // Prefer records with scores
      if (current.home_score !== null && best.home_score === null) {
        return { ...current, id: newId };
      }
      // Prefer live over scheduled
      if (current.status === "live" && best.status === "scheduled") {
        return { ...current, id: newId };
      }
      return best;
    }, { ...group[0], id: newId });

    toUpdate.push({
      oldIds: group.map(f => f.id),
      newRecord: merged,
    });
  }

  console.log(`\n--- Summary ---`);
  console.log(`Total fixtures: ${fixtures.length}`);
  console.log(`Duplicates found: ${duplicatesFound}`);
  console.log(`Old format IDs (non-duplicate): ${oldFormatFound}`);
  console.log(`Records to update: ${toUpdate.length}`);

  if (toUpdate.length === 0) {
    console.log("\nNo cleanup needed!");
    return;
  }

  // Confirm before proceeding
  console.log("\nProceeding with cleanup...\n");

  let updated = 0;
  let deleted = 0;
  let errors = 0;

  for (const { oldIds, newRecord } of toUpdate) {
    try {
      // Check if the new ID already exists (and is not one of the old IDs)
      const newIdExists = oldIds.includes(newRecord.id);

      if (!newIdExists) {
        // Insert the new record
        const { error: insertError } = await supabase
          .from("fixtures")
          .insert({
            id: newRecord.id,
            date: newRecord.date,
            home_team: newRecord.home_team,
            away_team: newRecord.away_team,
            home_score: newRecord.home_score,
            away_score: newRecord.away_score,
            matchweek: newRecord.matchweek,
            status: newRecord.status,
            is_derby: newRecord.is_derby,
          });

        if (insertError) {
          // If it's a unique constraint violation, try upsert instead
          if (insertError.code === "23505") {
            const { error: upsertError } = await supabase
              .from("fixtures")
              .upsert({
                id: newRecord.id,
                date: newRecord.date,
                home_team: newRecord.home_team,
                away_team: newRecord.away_team,
                home_score: newRecord.home_score,
                away_score: newRecord.away_score,
                matchweek: newRecord.matchweek,
                status: newRecord.status,
                is_derby: newRecord.is_derby,
              }, { onConflict: "id" });

            if (upsertError) {
              console.error(`Error upserting ${newRecord.id}:`, upsertError);
              errors++;
              continue;
            }
          } else {
            console.error(`Error inserting ${newRecord.id}:`, insertError);
            errors++;
            continue;
          }
        }
        updated++;
      }

      // Delete old records (except if one of them is the new ID)
      for (const oldId of oldIds) {
        if (oldId !== newRecord.id) {
          const { error: deleteError } = await supabase
            .from("fixtures")
            .delete()
            .eq("id", oldId);

          if (deleteError) {
            console.error(`Error deleting ${oldId}:`, deleteError);
            errors++;
          } else {
            deleted++;
            console.log(`  Deleted: ${oldId}`);
          }
        }
      }

      if (!newIdExists) {
        console.log(`  Created: ${newRecord.id} (${newRecord.status})`);
      }
    } catch (err) {
      console.error(`Error processing ${newRecord.id}:`, err);
      errors++;
    }
  }

  console.log(`\n--- Cleanup Complete ---`);
  console.log(`Records created: ${updated}`);
  console.log(`Records deleted: ${deleted}`);
  console.log(`Errors: ${errors}`);
}

// Run the cleanup
cleanupFixtureIds().catch(console.error);
