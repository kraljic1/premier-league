#!/usr/bin/env tsx

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as path from "path";

type Args = {
  home: string;
  away: string;
  date: string;
  homeScore: number;
  awayScore: number;
};

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const getValue = (flag: string): string | undefined => {
    const index = args.indexOf(flag);
    if (index === -1) return undefined;
    return args[index + 1];
  };

  const home = getValue("--home");
  const away = getValue("--away");
  const date = getValue("--date");
  const homeScore = getValue("--homeScore");
  const awayScore = getValue("--awayScore");

  if (!home || !away || !date || homeScore === undefined || awayScore === undefined) {
    throw new Error(
      "Usage: npx tsx scripts/manual-update-result.ts --home \"Home\" --away \"Away\" --date \"YYYY-MM-DD\" --homeScore 1 --awayScore 1"
    );
  }

  return {
    home,
    away,
    date,
    homeScore: Number(homeScore),
    awayScore: Number(awayScore),
  };
}

function normalizeName(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const match = trimmed.match(/^([^=]+)=(.*)$/);
        if (match) {
          const key = match[1].trim();
          let value = match[2].trim();
          if (
            (value.startsWith("\"") && value.endsWith("\"")) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
      }
    });
  }

  const { home, away, date, homeScore, awayScore } = parseArgs();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseServiceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const dateStart = `${date}T00:00:00.000Z`;
  const dateEnd = `${date}T23:59:59.999Z`;

  const { data: fixtures, error } = await supabase
    .from("fixtures")
    .select("id, home_team, away_team, date")
    .gte("date", dateStart)
    .lte("date", dateEnd);

  if (error) {
    throw new Error(`Failed to fetch fixtures: ${error.message}`);
  }

  const normalizedHome = normalizeName(home);
  const normalizedAway = normalizeName(away);

  const match = fixtures?.find((fixture) => {
    const fixtureHome = normalizeName(fixture.home_team);
    const fixtureAway = normalizeName(fixture.away_team);
    return fixtureHome === normalizedHome && fixtureAway === normalizedAway;
  });

  if (!match) {
    throw new Error(`No fixture found for ${home} vs ${away} on ${date}.`);
  }

  const { error: updateError } = await supabase
    .from("fixtures")
    .update({
      home_score: homeScore,
      away_score: awayScore,
      status: "finished",
    })
    .eq("id", match.id);

  if (updateError) {
    throw new Error(`Failed to update fixture: ${updateError.message}`);
  }

  console.log(`Updated ${home} ${homeScore}-${awayScore} ${away} on ${date}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
