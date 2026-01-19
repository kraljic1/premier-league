import { Fixture } from '../types';
import { isDerby } from '../clubs';
import { scrapePage, closeBrowser } from './browser';

const REZULTATI_URL = 'https://www.rezultati.com/nogomet/engleska/premier-league/rezultati';

/**
 * Team name mappings - maps various name variants to canonical database names
 */
const TEAM_NAME_MAPPINGS: Record<string, string> = {
  // Arsenal
  "arsenal": "Arsenal",
  "arsenal fc": "Arsenal",

  // Aston Villa
  "aston villa": "Aston Villa",
  "aston villa fc": "Aston Villa",

  // Bournemouth
  "bournemouth": "Bournemouth",
  "afc bournemouth": "Bournemouth",

  // Brentford
  "brentford": "Brentford",
  "brentford fc": "Brentford",

  // Brighton
  "brighton": "Brighton & Hove Albion",
  "brighton & hove albion": "Brighton & Hove Albion",
  "brighton and hove albion": "Brighton & Hove Albion",
  "brighton hove albion": "Brighton & Hove Albion",

  // Chelsea
  "chelsea": "Chelsea",
  "chelsea fc": "Chelsea",

  // Crystal Palace
  "crystal palace": "Crystal Palace",
  "crystal palace fc": "Crystal Palace",

  // Everton
  "everton": "Everton",
  "everton fc": "Everton",

  // Fulham
  "fulham": "Fulham",
  "fulham fc": "Fulham",

  // Ipswich Town
  "ipswich": "Ipswich Town",
  "ipswich town": "Ipswich Town",

  // Leicester City
  "leicester": "Leicester City",
  "leicester city": "Leicester City",

  // Liverpool
  "liverpool": "Liverpool",
  "liverpool fc": "Liverpool",

  // Manchester City
  "manchester city": "Manchester City",
  "man city": "Manchester City",
  "man. city": "Manchester City",

  // Manchester United
  "manchester united": "Manchester United",
  "manchester utd": "Manchester United",
  "man united": "Manchester United",
  "man utd": "Manchester United",
  "man. utd": "Manchester United",

  // Newcastle United
  "newcastle": "Newcastle United",
  "newcastle united": "Newcastle United",
  "newcastle utd": "Newcastle United",

  // Nottingham Forest
  "nottingham forest": "Nottingham Forest",
  "nott'm forest": "Nottingham Forest",
  "nottingham": "Nottingham Forest",
  "nottm forest": "Nottingham Forest",

  // Southampton
  "southampton": "Southampton",
  "southampton fc": "Southampton",

  // Tottenham
  "tottenham": "Tottenham Hotspur",
  "tottenham hotspur": "Tottenham Hotspur",
  "spurs": "Tottenham Hotspur",

  // West Ham
  "west ham": "West Ham United",
  "west ham united": "West Ham United",
  "west ham utd": "West Ham United",

  // Wolves
  "wolves": "Wolverhampton Wanderers",
  "wolverhampton": "Wolverhampton Wanderers",
  "wolverhampton wanderers": "Wolverhampton Wanderers",
};

/**
 * Parse date string from Rezultati.com format
 */
function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // DD.MM. HH:mm format (no year)
  const ddmmTime = dateStr.match(/(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})/);
  if (ddmmTime) {
    const day = parseInt(ddmmTime[1]);
    const month = parseInt(ddmmTime[2]) - 1;
    const hour = parseInt(ddmmTime[3]);
    const minute = parseInt(ddmmTime[4]);
    const currentYear = month >= 7 ? 2025 : 2026;
    const date = new Date(currentYear, month, day, hour, minute);
    if (!isNaN(date.getTime())) return date;
  }

  // DD.MM.YYYY format
  const ddmmyyyy = dateStr.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (ddmmyyyy) {
    const day = parseInt(ddmmyyyy[1]);
    const month = parseInt(ddmmyyyy[2]) - 1;
    const year = parseInt(ddmmyyyy[3]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }

  return null;
}

/**
 * Normalize team name for comparison - maps aliases to canonical names
 */
function normalizeTeamName(name: string): string {
  const cleaned = name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\d+$/, '')
    .trim();

  return TEAM_NAME_MAPPINGS[cleaned] || name;
}

/**
 * Scrape recent results from Rezultati.com using Puppeteer
 * This is the API version that can be called by Netlify functions
 */
export async function scrapeRecentResults(): Promise<Fixture[]> {
  let page;

  try {
    console.log('[ScraperAPI] Fetching recent results from Rezultati.com...');
    page = await scrapePage(REZULTATI_URL, undefined, 30000);

    // Set viewport for proper rendering
    await page.setViewport({ width: 1920, height: 1080 });

    // Wait for page to load fully
    await new Promise(resolve => setTimeout(resolve, 5000));

    try {
      await page.waitForSelector('.event__match', { timeout: 15000 });
      console.log('[ScraperAPI] Found match elements');
    } catch (e) {
      console.log('[ScraperAPI] Waiting for elements... trying alternative selectors');
      // Try alternative selectors
      try {
        await page.waitForSelector('[class*="event__match"]', { timeout: 10000 });
        console.log('[ScraperAPI] Found elements with alternative selector');
      } catch (e2) {
        console.log('[ScraperAPI] Could not find match elements - website may have changed');
      }
    }

    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract results (without clicking "show more" - just visible matches)
    const rawData = await page.evaluate(() => {
      var matches: any[] = [];
      var debug: string[] = [];

      var container = document.querySelector('.sportName.soccer');
      if (!container) {
        container = document.querySelector('.event--results') || document.body;
        debug.push('Using fallback container');
      }

      var allElements = container.querySelectorAll('.event__round, .event__match');
      debug.push('Found ' + allElements.length + ' elements');

      var currentMatchweek = 0;
      var matchweeksFound: number[] = [];

      for (var i = 0; i < allElements.length; i++) {
        var el = allElements[i];

        if (el.classList.contains('event__round')) {
          var roundText = el.textContent || '';
          var roundMatch = roundText.match(/(\d+)\.\s*kolo/i);
          if (roundMatch) {
            currentMatchweek = parseInt(roundMatch[1]);
            matchweeksFound.push(currentMatchweek);
          }
          continue;
        }

        if (!el.classList.contains('event__match')) continue;

        // Try multiple selector patterns (updated for current Rezultati.com structure)
        var homeEl = el.querySelector('.event__homeParticipant') ||
                     el.querySelector('.event__participant--home') ||
                     el.querySelector('[class*="homeParticipant"]') ||
                     el.querySelector('[class*="participant--home"]');
        var awayEl = el.querySelector('.event__awayParticipant') ||
                     el.querySelector('.event__participant--away') ||
                     el.querySelector('[class*="awayParticipant"]') ||
                     el.querySelector('[class*="participant--away"]');
        var homeScoreEl = el.querySelector('.event__score--home') ||
                          el.querySelector('[class*="score--home"]');
        var awayScoreEl = el.querySelector('.event__score--away') ||
                          el.querySelector('[class*="score--away"]');
        var timeEl = el.querySelector('.event__time') ||
                     el.querySelector('[class*="time"]');

        var homeTeam = homeEl ? (homeEl.textContent || '').trim() : '';
        var awayTeam = awayEl ? (awayEl.textContent || '').trim() : '';
        homeTeam = homeTeam.replace(/\d+$/, '').trim();
        awayTeam = awayTeam.replace(/\d+$/, '').trim();

        var homeScore = homeScoreEl ? parseInt((homeScoreEl.textContent || '').trim()) : NaN;
        var awayScore = awayScoreEl ? parseInt((awayScoreEl.textContent || '').trim()) : NaN;
        var dateStr = timeEl ? (timeEl.textContent || '').trim() : '';

        if (homeTeam && awayTeam && !isNaN(homeScore) && !isNaN(awayScore)) {
          matches.push({
            homeTeam,
            awayTeam,
            homeScore,
            awayScore,
            dateStr,
            matchweek: currentMatchweek || 22
          });
        }
      }

      if (matchweeksFound.length > 0) {
        debug.push('Matchweeks: ' + matchweeksFound[0] + ' to ' + matchweeksFound[matchweeksFound.length - 1]);
      }

      return { matches, debug };
    });

    // Log debug info
    if (rawData.debug) {
      rawData.debug.forEach((d: string) => console.log(`[ScraperAPI] ${d}`));
    }

    const matches = rawData.matches || [];
    console.log(`[ScraperAPI] Found ${matches.length} recent results`);

    const results: Fixture[] = [];
    const seenIds = new Set<string>();

    for (const match of matches) {
      const parsedDate = parseDate(match.dateStr);
      if (!parsedDate) continue;

      // Normalize team names to canonical database format
      const homeTeam = normalizeTeamName(match.homeTeam);
      const awayTeam = normalizeTeamName(match.awayTeam);

      if (homeTeam.length < 3 || awayTeam.length < 3) continue;

      const dateOnly = parsedDate.toISOString().split('T')[0];
      const fixtureId = `${homeTeam.toLowerCase().replace(/\s+/g, '-')}-${awayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}`;

      if (seenIds.has(fixtureId)) continue;
      seenIds.add(fixtureId);

      results.push({
        id: fixtureId,
        date: parsedDate.toISOString(),
        homeTeam,
        awayTeam,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        matchweek: match.matchweek,
        status: 'finished',
        isDerby: isDerby(homeTeam, awayTeam),
      });
    }

    console.log(`[ScraperAPI] Returning ${results.length} processed fixtures`);
    return results;

  } catch (error) {
    console.error(`[ScraperAPI] Error scraping results:`, error);
    throw error;
  } finally {
    if (page) await page.close();
    // Note: We don't close the browser here since it might be reused
  }
}