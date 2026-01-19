/**
 * Import cup fixtures for English clubs from CSV sources.
 *
 * Usage: npx tsx scripts/import-cup-fixtures.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase";
import { CLUBS } from "../lib/clubs";
import { getCurrentSeasonFull } from "../lib/utils/season-utils";

config({ path: resolve(__dirname, "../.env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabaseServer = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEAM_NAME_MAPPINGS: Record<string, string> = {
  "Man United": "Manchester United",
  "Man Utd": "Manchester United",
  "Man City": "Manchester City",
  Tottenham: "Tottenham Hotspur",
  Spurs: "Tottenham Hotspur",
  Brighton: "Brighton & Hove Albion",
  Wolves: "Wolverhampton Wanderers",
  "West Ham": "West Ham United",
  Newcastle: "Newcastle United",
  Forest: "Nottingham Forest",
  "Nott'm Forest": "Nottingham Forest",
};

const SOURCES = [
  {
    id: "champions-league",
    competition: "UEFA Champions League",
    url: "https://fixturedownload.com/download/champions-league-2025",
  },
  {
    id: "europa-league",
    competition: "UEFA Europa League",
    url: "https://fixturedownload.com/download/europa-league-2025",
  },
  {
    id: "conference-league",
    competition: "UEFA Conference League",
    url: "https://fixturedownload.com/download/conference-league-2025",
  },
  {
    id: "fa-cup",
    competition: "FA Cup",
    filePath: "results/fa-cup-2025.csv",
  },
  {
    id: "carabao-cup",
    competition: "Carabao Cup",
    filePath: process.env.CARABAO_CSV_PATH || "results/carabao-cup.csv",
  },
];

type ParsedFixture = {
  date: Date;
  homeTeam: string;
  awayTeam: string;
  roundNumber: number | null;
  homeScore: number | null;
  awayScore: number | null;
};

function normalizeTeamName(name: string): string {
  const trimmed = name.trim();
  return TEAM_NAME_MAPPINGS[trimmed] || trimmed;
}

function parseDate(dateStr: string): Date | null {
  const trimmed = dateStr.trim();
  if (!trimmed) return null;

  const [datePart, timePart] = trimmed.split(" ");
  const [day, month, year] = datePart.split("/").map((value) => parseInt(value, 10));
  if (!day || !month || !year) return null;

  const [hours, minutes] = (timePart || "12:00").split(":").map((value) => parseInt(value, 10));
  return new Date(year, month - 1, day, hours || 12, minutes || 0);
}

function parseScore(result: string): { homeScore: number; awayScore: number } | null {
  const match = result.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (!match) return null;
  return { homeScore: parseInt(match[1], 10), awayScore: parseInt(match[2], 10) };
}

function parseCsvRows(content: string): string[][] {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && char === ",") {
      row.push(current.trim());
      current = "";
      continue;
    }
    if (!inQuotes && char === "\n") {
      row.push(current.trim());
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      current = "";
      continue;
    }
    if (char !== "\r") current += char;
  }

  if (current.length || row.length) {
    row.push(current.trim());
    if (row.some((cell) => cell.length > 0)) rows.push(row);
  }

  return rows;
}

function findHeaderIndex(headers: string[], keys: string[]): number | null {
  const normalized = headers.map((header) => header.toLowerCase());
  for (const key of keys) {
    const index = normalized.findIndex((header) => header === key || header.includes(key));
    if (index >= 0) return index;
  }
  return null;
}

async function loadSourceContent(source: typeof SOURCES[number]): Promise<string | null> {
  if (source.url) {
    const response = await fetch(source.url);
    if (!response.ok) return null;
    return await response.text();
  }
  if (source.filePath && fs.existsSync(source.filePath)) {
    return fs.readFileSync(source.filePath, "utf-8");
  }
  return null;
}

async function getEnglishClubSet(season: string): Promise<Set<string>> {
  const { data, error } = await supabaseServer
    .from("standings")
    .select("club")
    .eq("season", season);

  if (!error && data && data.length > 0) {
    return new Set(data.map((row) => row.club));
  }

  return new Set(Object.values(CLUBS).map((club) => club.name));
}

function buildFixtureId(competition: string, homeTeam: string, awayTeam: string, date: Date) {
  const dateKey = date.toISOString();
  return `${competition}-${homeTeam}-${awayTeam}-${dateKey}`;
}

async function importSource(source: typeof SOURCES[number], clubSet: Set<string>, season: string) {
  const content = await loadSourceContent(source);
  if (!content) {
    console.log(`⚠️  Skipping ${source.competition} (missing CSV)`);
    return 0;
  }

  const rows = parseCsvRows(content);
  if (rows.length < 2) {
    console.log(`⚠️  No rows for ${source.competition}`);
    return 0;
  }

  const headers = rows[0];
  const homeIndex = findHeaderIndex(headers, ["home team", "home"]);
  const awayIndex = findHeaderIndex(headers, ["away team", "away"]);
  const dateIndex = findHeaderIndex(headers, ["date"]);
  const resultIndex = findHeaderIndex(headers, ["result", "score"]);
  const roundIndex = findHeaderIndex(headers, ["round number", "round"]);

  if (homeIndex === null || awayIndex === null || dateIndex === null) {
    console.log(`⚠️  Missing required columns for ${source.competition}`);
    return 0;
  }

  const fixtures: ParsedFixture[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const homeTeamRaw = row[homeIndex] || "";
    const awayTeamRaw = row[awayIndex] || "";
    const dateStr = row[dateIndex] || "";
    const resultStr = resultIndex !== null ? row[resultIndex] || "" : "";
    const roundStr = roundIndex !== null ? row[roundIndex] || "" : "";

    const homeTeam = normalizeTeamName(homeTeamRaw);
    const awayTeam = normalizeTeamName(awayTeamRaw);
    const date = parseDate(dateStr);
    if (!homeTeam || !awayTeam || !date) continue;

    const score = resultStr ? parseScore(resultStr) : null;
    const roundNumber = roundStr ? parseInt(roundStr, 10) : null;

    fixtures.push({
      date,
      homeTeam,
      awayTeam,
      roundNumber: Number.isNaN(roundNumber) ? null : roundNumber,
      homeScore: score ? score.homeScore : null,
      awayScore: score ? score.awayScore : null,
    });
  }

  const filteredFixtures = fixtures.filter(
    (fixture) => clubSet.has(fixture.homeTeam) || clubSet.has(fixture.awayTeam)
  );

  if (filteredFixtures.length === 0) {
    console.log(`⚠️  No English club fixtures for ${source.competition}`);
    return 0;
  }

  const payload = filteredFixtures.map((fixture) => ({
    id: buildFixtureId(source.competition, fixture.homeTeam, fixture.awayTeam, fixture.date),
    date: fixture.date.toISOString(),
    home_team: fixture.homeTeam,
    away_team: fixture.awayTeam,
    home_score: fixture.homeScore,
    away_score: fixture.awayScore,
    matchweek: fixture.roundNumber || 1,
    status: (fixture.homeScore !== null && fixture.awayScore !== null ? "finished" : "scheduled") as "scheduled" | "live" | "finished",
    is_derby: false,
    season,
    competition: source.competition,
    competition_round: fixture.roundNumber ? `Round ${fixture.roundNumber}` : null,
  }));

  const { error } = await supabaseServer.from("fixtures").upsert(payload, { onConflict: "id" });
  if (error) {
    console.error(`❌ Failed to save ${source.competition}:`, error.message);
    return 0;
  }

  console.log(`✅ Imported ${payload.length} fixtures for ${source.competition}`);
  return payload.length;
}

async function main() {
  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing Supabase environment variables.");
    process.exit(1);
  }

  const season = getCurrentSeasonFull();
  const clubSet = await getEnglishClubSet(season);
  let total = 0;

  for (const source of SOURCES) {
    total += await importSource(source, clubSet, season);
  }

  console.log(`\n🏁 Total imported fixtures: ${total}`);
}

main().catch((error) => {
  console.error("💥 Fatal error:", error);
  process.exit(1);
});
