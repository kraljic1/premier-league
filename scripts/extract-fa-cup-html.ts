/**
 * Extract FA Cup fixtures/results from TheSportsDB HTML page.
 * Saves to results/fa-cup-2025.csv
 */

import fs from "fs";
import path from "path";

const INPUT_PATH = path.join(__dirname, "../results/fa-cup.html");
const OUTPUT_PATH = path.join(__dirname, "../results/fa-cup-2025.csv");

type ParsedRow = {
  date: string;
  homeTeam: string;
  awayTeam: string;
  result: string;
  roundNumber: number;
};

const SLUG_NAME_OVERRIDES: Record<string, string> = {
  "brighton-and-hove-albion": "Brighton & Hove Albion",
  "manchester-united": "Manchester United",
  "manchester-city": "Manchester City",
  "newcastle-united": "Newcastle United",
  "west-ham-united": "West Ham United",
  "west-bromwich-albion": "West Bromwich Albion",
  "queens-park-rangers": "Queens Park Rangers",
  "ipswich-town": "Ipswich Town",
  "leeds-united": "Leeds United",
  "tottenham-hotspur": "Tottenham Hotspur",
  "wolverhampton-wanderers": "Wolverhampton Wanderers",
  "nottingham-forest": "Nottingham Forest",
};

const MONTH_INDEX: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function toTitleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeSlugName(slug: string): string {
  if (SLUG_NAME_OVERRIDES[slug]) {
    return SLUG_NAME_OVERRIDES[slug];
  }
  const base = slug.replace(/-/g, " ");
  return toTitleCase(base);
}

function guessYear(monthIndex: number): number {
  const now = new Date();
  const currentMonth = now.getMonth();
  if (monthIndex >= 7 && currentMonth <= 6) {
    return now.getFullYear() - 1;
  }
  return now.getFullYear();
}

function formatDate(day: number, monthIndex: number, timeText: string): string {
  const year = guessYear(monthIndex);
  const [timePart, meridiem] = timeText.toLowerCase().split(/(am|pm)/);
  const [hoursRaw, minutesRaw] = timePart.split(":").map((value) => parseInt(value, 10));
  if (!hoursRaw || !minutesRaw || !meridiem) {
    return `${String(day).padStart(2, "0")}/${String(monthIndex + 1).padStart(2, "0")}/${year} 12:00`;
  }

  let hours = hoursRaw % 12;
  if (meridiem === "pm") {
    hours += 12;
  }

  return `${String(day).padStart(2, "0")}/${String(monthIndex + 1).padStart(2, "0")}/${year} ${String(hours).padStart(2, "0")}:${String(minutesRaw).padStart(2, "0")}`;
}

function extractSection(content: string, startMarker: string, endMarker: string): string {
  const startIndex = content.indexOf(startMarker);
  if (startIndex === -1) return "";
  const endIndex = content.indexOf(endMarker, startIndex);
  if (endIndex === -1) return content.slice(startIndex);
  return content.slice(startIndex, endIndex);
}

function extractRows(section: string, isResults: boolean): ParsedRow[] {
  const rows = section.split("</tr>");
  const extracted: ParsedRow[] = [];
  let roundCounter = 1;

  for (const row of rows) {
    const dateMatch = row.match(/\b(\d{1,2})\s([A-Za-z]{3})\b/);
    if (!dateMatch) continue;

    const day = parseInt(dateMatch[1], 10);
    const monthText = dateMatch[2];
    const monthIndex = MONTH_INDEX[monthText];
    if (monthIndex === undefined) continue;

    const slugMatch = row.match(/\/event\/\d+-([^']+)'/);
    if (!slugMatch) continue;
    const slug = slugMatch[1];
    const [homeSlug, awaySlug] = slug.split("-vs-");
    if (!homeSlug || !awaySlug) continue;
    const homeTeam = normalizeSlugName(homeSlug);
    const awayTeam = normalizeSlugName(awaySlug);

    let result = "";
    if (isResults) {
      const scoreMatch = row.match(/\b\d+\s*-\s*\d+\b/);
      result = scoreMatch ? normalizeWhitespace(scoreMatch[0]) : "";
    } else {
      const timeMatch = row.match(/\b\d{1,2}:\d{2}(?:am|pm)\b/i);
      const timeText = timeMatch ? timeMatch[0] : "12:00pm";
      result = "";
      const date = formatDate(day, monthIndex, timeText);
      extracted.push({
        date,
        homeTeam,
        awayTeam,
        result,
        roundNumber: roundCounter,
      });
      continue;
    }

    const date = formatDate(day, monthIndex, "12:00pm");
    extracted.push({
      date,
      homeTeam,
      awayTeam,
      result,
      roundNumber: roundCounter,
    });
  }

  return extracted;
}

function main() {
  if (!fs.existsSync(INPUT_PATH)) {
    console.error("Missing input HTML:", INPUT_PATH);
    process.exit(1);
  }

  const html = fs.readFileSync(INPUT_PATH, "utf-8");
  const tableSection = extractSection(html, "<table width='100%'>", "</table>");
  const upcomingSection = extractSection(tableSection, "<b>Upcoming</b>", "<b>Results</b>");
  const resultsSection = extractSection(tableSection, "<b>Results</b>", "</table>");

  const upcomingRows = extractRows(upcomingSection, false);
  const resultRows = extractRows(resultsSection, true);
  const allRows = [...upcomingRows, ...resultRows];

  if (allRows.length === 0) {
    console.error("No fixtures found in HTML.");
    process.exit(1);
  }

  const header = "Match Number,Round Number,Date,Location,Home Team,Away Team,Result";
  const csvLines = allRows.map((row, index) => {
    const matchNumber = index + 1;
    const roundNumber = row.roundNumber;
    const date = row.date;
    const location = "";
    const homeTeam = row.homeTeam;
    const awayTeam = row.awayTeam;
    const result = row.result;
    return `${matchNumber},${roundNumber},${date},${location},"${homeTeam}","${awayTeam}",${result}`;
  });

  fs.writeFileSync(OUTPUT_PATH, `${header}\n${csvLines.join("\n")}\n`, "utf-8");
  console.log(`Saved ${allRows.length} FA Cup fixtures to ${OUTPUT_PATH}`);
}

main();
