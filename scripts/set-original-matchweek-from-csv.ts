import { config } from "dotenv";
import { resolve } from "path";
import * as fs from "fs";
import * as path from "path";
import { createClient } from "@supabase/supabase-js";
import { seasonYearToShortFormat } from "../lib/utils/season-utils";
import { normalizeClubName } from "../lib/utils/club-name-utils";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SEASON_FILES: Record<string, string> = {
  "2020/21": "epl-2020-with-rounds.csv",
  "2021/22": "epl-2021-with-rounds.csv",
  "2022/23": "epl-2022-with-rounds.csv",
  "2023/24": "epl-2023-with-rounds.csv",
  "2024/25": "epl-2024-with-rounds.csv",
  "2025/2026": "epl-2025-with-rounds.csv",
};

function normalizeTeamName(name: string): string {
  const decoded = name.replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  return normalizeClubName(decoded);
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function getArgValue(flag: string): string | null {
  const index = process.argv.findIndex((arg) => arg === flag);
  if (index === -1) return null;
  return process.argv[index + 1] || null;
}

async function run() {
  const runAll = process.argv.includes("--all");
  const seasonArg = getArgValue("--season");
  if (!runAll && !seasonArg) {
    console.error(
      'Usage: npx tsx "scripts/set-original-matchweek-from-csv.ts" --season 2020/21\n' +
        '   or: npx tsx "scripts/set-original-matchweek-from-csv.ts" --all'
    );
    process.exit(1);
  }

  const fileArg = getArgValue("--file");

  const seasonsToProcess = runAll
    ? Object.keys(SEASON_FILES)
    : [
        seasonArg!.includes("/")
          ? seasonArg!
          : seasonYearToShortFormat(seasonArg!),
      ];

  const results: Array<{ season: string; updated: number; missing: number }> = [];

  for (const season of seasonsToProcess) {
    const fileName = fileArg || SEASON_FILES[season];
    if (!fileName) {
      console.error(`No CSV file configured for season ${season}`);
      process.exit(1);
    }

    const updated = await updateSeason(season, fileName);
    results.push(updated);
  }

  if (results.length > 1) {
    console.log("\nSummary:");
    results.forEach((result) => {
      console.log(
        `  ${result.season}: updated ${result.updated}, missing ${result.missing}`
      );
    });
  }
}

async function updateSeason(season: string, fileName: string) {
  const filePath = path.join(__dirname, "../results", fileName);
  if (!fs.existsSync(filePath)) {
    console.error(`CSV file not found: ${filePath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    console.error("CSV file is empty or missing data rows");
    process.exit(1);
  }

  const header = parseCsvLine(lines[0]);
  const roundIndex = header.indexOf("Round Number");
  const homeIndex = header.indexOf("Home Team");
  const awayIndex = header.indexOf("Away Team");

  if (roundIndex === -1 || homeIndex === -1 || awayIndex === -1) {
    console.error("CSV does not contain Round Number / Home Team / Away Team columns");
    process.exit(1);
  }

  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("id,home_team,away_team")
    .eq("season", season);

  if (error || !fixtures) {
    console.error("Failed to fetch fixtures:", error);
    process.exit(1);
  }

  const fixtureMap = new Map<string, string>();
  fixtures.forEach((fixture) => {
    const key = `${normalizeTeamName(fixture.home_team)}__${normalizeTeamName(fixture.away_team)}`;
    fixtureMap.set(key, fixture.id);
  });

  const updates: Array<{ id: string; original_matchweek: number }> = [];
  const missingKeys: string[] = [];

  for (let i = 1; i < lines.length; i += 1) {
    const values = parseCsvLine(lines[i]);
    const roundValue = values[roundIndex];
    const homeTeam = normalizeTeamName(values[homeIndex] || "");
    const awayTeam = normalizeTeamName(values[awayIndex] || "");
    const roundNumber = parseInt(roundValue || "0", 10);

    if (!homeTeam || !awayTeam || Number.isNaN(roundNumber)) continue;

    const key = `${homeTeam}__${awayTeam}`;
    const fixtureId = fixtureMap.get(key);
    if (!fixtureId) {
      missingKeys.push(key);
      continue;
    }

    updates.push({ id: fixtureId, original_matchweek: roundNumber });
  }

  const batchSize = 50;
  let updated = 0;

  for (let i = 0; i < updates.length; i += batchSize) {
    const batch = updates.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((updateRow) =>
        supabase
          .from("fixtures")
          .update({ original_matchweek: updateRow.original_matchweek })
          .eq("id", updateRow.id)
      )
    );

    const failed = results.find((result) => result.error);
    if (failed?.error) {
      console.error("Update failed:", failed.error);
      process.exit(1);
    }

    updated += batch.length;
  }

  console.log(`Season ${season}: updated ${updated} fixtures with original_matchweek`);
  if (missingKeys.length > 0) {
    console.log(`Missing fixtures in DB: ${missingKeys.length}`);
    missingKeys.slice(0, 10).forEach((key) => console.log(`  - ${key}`));
  }
  return { season, updated, missing: missingKeys.length };
}

run().catch((error) => {
  console.error("Failed to set original_matchweek:", error);
  process.exit(1);
});
