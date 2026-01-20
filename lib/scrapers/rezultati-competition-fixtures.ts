import { Fixture } from "../types";
import { isDerby } from "../clubs";
import { scrapePage } from "./browser";

export type CompetitionSource = {
  id: string;
  competition: string;
  url: string;
};

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

function normalizeTeamName(name: string): string {
  const cleaned = name.trim().replace(/\d+$/, "").replace(/\s+/g, " ");
  return TEAM_NAME_MAPPINGS[cleaned] || cleaned;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  const ddmmTime = dateStr.match(/(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})/);
  if (ddmmTime) {
    const day = parseInt(ddmmTime[1], 10);
    const month = parseInt(ddmmTime[2], 10) - 1;
    const hour = parseInt(ddmmTime[3], 10);
    const minute = parseInt(ddmmTime[4], 10);
    const year = month >= 7 ? 2025 : 2026;
    const date = new Date(year, month, day, hour, minute);
    return isNaN(date.getTime()) ? null : date;
  }

  const ddmmyyyy = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1], 10);
    const month = parseInt(ddmmyyyy[2], 10) - 1;
    const year = parseInt(ddmmyyyy[3], 10);
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  }

  return null;
}

export async function scrapeCompetitionFixtures(
  source: CompetitionSource
): Promise<Fixture[]> {
  let page;

  try {
    console.log(`[Rezultati Fixtures] Loading ${source.competition} fixtures...`);
    page = await scrapePage(source.url, undefined, 30000);
    await page.setViewport({ width: 1920, height: 1080 });
    await new Promise((resolve) => setTimeout(resolve, 5000));

    // Load all fixtures by clicking "Show more" if present.
    const maxClicks = 20;
    for (let i = 0; i < maxClicks; i++) {
      const showMoreButton = await page.$('a.wclButtonLink, a[class*="wclButtonLink"]');
      if (!showMoreButton) break;
      const isVisible = await page.evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.height > 0 && rect.width > 0;
      }, showMoreButton);
      if (!isVisible) break;
      await page.evaluate((el) => el.scrollIntoView({ behavior: "smooth", block: "center" }), showMoreButton);
      await new Promise((resolve) => setTimeout(resolve, 500));
      await showMoreButton.click();
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }

    const rawData = await page.evaluate(() => {
      const matches: { homeTeam: string; awayTeam: string; dateStr: string; roundNumber: number | null }[] = [];
      let currentRound: number | null = null;
      const container =
        document.querySelector(".sportName.soccer") ||
        document.querySelector(".event--results") ||
        document.querySelector(".leagues--static") ||
        document.body;

      const allElements = container.querySelectorAll(".event__round, .event__match");
      allElements.forEach((el) => {
        if (el.classList.contains("event__round")) {
          const text = (el.textContent || "").trim();
          const roundMatch = text.match(/(\d+)\.\s*kolo|round\s*(\d+)/i);
          if (roundMatch) {
            currentRound = parseInt(roundMatch[1] || roundMatch[2], 10);
          }
          return;
        }

        if (!el.classList.contains("event__match")) return;
        const homeEl =
          el.querySelector(".event__participant--home") ||
          el.querySelector("[class*='homeParticipant']");
        const awayEl =
          el.querySelector(".event__participant--away") ||
          el.querySelector("[class*='awayParticipant']");
        const timeEl = el.querySelector(".event__time");

        const homeTeam = homeEl ? (homeEl.textContent || "").trim() : "";
        const awayTeam = awayEl ? (awayEl.textContent || "").trim() : "";
        const dateStr = timeEl ? (timeEl.textContent || "").trim() : "";

        if (homeTeam && awayTeam) {
          matches.push({
            homeTeam,
            awayTeam,
            dateStr,
            roundNumber: currentRound,
          });
        }
      });

      return matches;
    });

    const fixtures: Fixture[] = [];
    const seenIds = new Set<string>();

    for (const match of rawData) {
      const parsedDate = parseDate(match.dateStr);
      if (!parsedDate) continue;
      const homeTeam = normalizeTeamName(match.homeTeam);
      const awayTeam = normalizeTeamName(match.awayTeam);
      if (!homeTeam || !awayTeam) continue;

      const dateOnly = parsedDate.toISOString().split("T")[0];
      const fixtureId = `${homeTeam.toLowerCase().replace(/\s+/g, "-")}-${awayTeam
        .toLowerCase()
        .replace(/\s+/g, "-")}-${dateOnly}`;
      if (seenIds.has(fixtureId)) continue;
      seenIds.add(fixtureId);

      fixtures.push({
        id: fixtureId,
        date: parsedDate.toISOString(),
        homeTeam,
        awayTeam,
        homeScore: null,
        awayScore: null,
        matchweek: match.roundNumber || 1,
        status: "scheduled",
        isDerby: isDerby(homeTeam, awayTeam),
        competition: source.competition,
      });
    }

    return fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    console.error(`[Rezultati Fixtures] Error for ${source.competition}:`, error);
    throw error;
  } finally {
    if (page) await page.close();
  }
}
