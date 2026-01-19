import { Standing } from '../types';
import { scrapePage, closeBrowser } from './browser';

const REZULTATI_STANDINGS_URL = 'https://www.rezultati.com/nogomet/engleska/premier-league/tablica';

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
 * Normalize team name to canonical database format
 */
function normalizeTeamName(name: string): string {
  const normalized = name.toLowerCase().trim();
  return TEAM_NAME_MAPPINGS[normalized] || name;
}

/**
 * Scrape standings from Rezultati.com using Puppeteer
 * This is the API version that can be called by Netlify functions
 */
export async function scrapeStandings(): Promise<Standing[]> {
  let page;

  try {
    console.log('[StandingsAPI] Fetching standings from Rezultati.com...');
    page = await scrapePage(REZULTATI_STANDINGS_URL, undefined, 30000);

    // Set viewport for proper rendering
    await page.setViewport({ width: 1920, height: 1080 });

    // Wait for page to load fully
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Wait for table to load
    try {
      await page.waitForSelector('table', { timeout: 15000 });
      console.log('[StandingsAPI] Found standings table');
    } catch (e) {
      console.log('[StandingsAPI] Could not find standings table');
    }

    // Additional wait for dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Extract standings
    const rawData = await page.evaluate(() => {
      var standings: any[] = [];
      var debug: string[] = [];

      // Try multiple table selectors
      var table = document.querySelector('table');
      if (!table) {
        table = document.querySelector('[class*="table"]');
        debug.push('Using alternative table selector');
      }

      if (!table) {
        debug.push('No table found');
        return { standings, debug };
      }

      var rows = table.querySelectorAll('tbody tr');
      debug.push('Found ' + rows.length + ' rows in table');

      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        var cells = row.querySelectorAll('td');

        // Skip if not enough cells or if it's a header row
        if (cells.length < 8 || row.querySelector('th')) {
          continue;
        }

        var position = parseInt(cells[0].textContent?.trim() || '0') || i + 1;

        // Try multiple ways to get club name
        var clubName = '';
        var clubCell = cells[1];
        if (clubCell) {
          // Try to find text in links or spans
          var link = clubCell.querySelector('a');
          var span = clubCell.querySelector('span');
          var div = clubCell.querySelector('div');

          clubName = (link || span || div || clubCell).textContent?.trim() || '';
          clubName = clubName.replace(/\d+$/, '').trim();
        }

        var played = parseInt(cells[2].textContent?.trim() || '0');
        var won = parseInt(cells[3].textContent?.trim() || '0');
        var drawn = parseInt(cells[4].textContent?.trim() || '0');
        var lost = parseInt(cells[5].textContent?.trim() || '0');
        var goalsFor = parseInt(cells[6].textContent?.trim() || '0');

        var goalsAgainstText = cells[7].textContent?.trim() || '';
        var goalsAgainst = parseInt(goalsAgainstText);

        var goalDifference = parseInt(cells[8]?.textContent?.trim() || '0');
        var points = parseInt(cells[cells.length - 1].textContent?.trim() || '0');

        // Extract form if available
        var form = '';
        var formCell = row.querySelector('[class*="form"]') ||
                      row.querySelector('[class*="last"]') ||
                      row.querySelector('[class*="recent"]');

        if (formCell) {
          var resultElements = formCell.querySelectorAll('span, div, [class*="result"]');
          resultElements.forEach(function(el) {
            var className = el.className || '';
            var text = el.textContent?.trim().toUpperCase() || '';

            if (className.includes('win') || className.includes('victory') || text === 'W') form += 'W';
            else if (className.includes('draw') || text === 'D') form += 'D';
            else if (className.includes('loss') || className.includes('defeat') || text === 'L') form += 'L';
          });
          form = form.slice(0, 6);
        }

        if (clubName && clubName.length > 2) {
          standings.push({
            position,
            club: clubName,
            played,
            won,
            drawn,
            lost,
            goalsFor,
            goalsAgainst,
            goalDifference,
            points,
            form
          });
        }
      }

      return { standings, debug };
    });

    // Log debug info
    if (rawData.debug) {
      rawData.debug.forEach((d: string) => console.log(`[StandingsAPI] ${d}`));
    }

    const standings = rawData.standings || [];
    console.log(`[StandingsAPI] Found ${standings.length} standings entries`);

    // Normalize team names and create Standing objects
    const processedStandings: Standing[] = standings.map((standing: any) => ({
      position: standing.position,
      club: normalizeTeamName(standing.club),
      played: standing.played,
      won: standing.won,
      drawn: standing.drawn,
      lost: standing.lost,
      goalsFor: standing.goalsFor,
      goalsAgainst: standing.goalsAgainst,
      goalDifference: standing.goalDifference,
      points: standing.points,
      form: standing.form,
    }));

    console.log(`[StandingsAPI] Returning ${processedStandings.length} processed standings`);
    return processedStandings;

  } catch (error) {
    console.error(`[StandingsAPI] Error scraping standings:`, error);
    throw error;
  } finally {
    if (page) await page.close();
    // Note: We don't close the browser here since it might be reused
  }
}