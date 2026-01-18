/**
 * Simple HTTP-based Rezultati.com results scraper
 * No Puppeteer needed - just axios + cheerio
 * URL: https://www.rezultati.com/nogomet/engleska/premier-league/rezultati/
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Fixture } from '../types';
import { isDerby } from '../clubs';

const REZULTATI_URL = 'https://www.rezultati.com/nogomet/engleska/premier-league/rezultati/';

/**
 * Clean team name for consistency
 */
function cleanTeamName(name: string): string {
  if (!name) return '';

  // Remove extra whitespace
  name = name.trim().replace(/\s+/g, ' ');

  // Common team name mappings
  const TEAM_MAPPINGS: Record<string, string> = {
    'Man Utd': 'Manchester United',
    'Man City': 'Manchester City',
    'Newcastle': 'Newcastle United',
    'West Ham': 'West Ham United',
    'Wolves': 'Wolverhampton Wanderers',
    'Brighton': 'Brighton & Hove Albion',
    'Tottenham': 'Tottenham Hotspur',
    'Leeds': 'Leeds United',
    'Norwich': 'Norwich City',
    'Watford': 'Watford',
    'Bournemouth': 'Bournemouth',
    'Southampton': 'Southampton',
    'Burnley': 'Burnley',
    'Fulham': 'Fulham',
    'Brentford': 'Brentford',
    'Crystal Palace': 'Crystal Palace',
    'Everton': 'Everton',
    'Leicester': 'Leicester City',
    'Ipswich': 'Ipswich Town',
    'Aston Villa': 'Aston Villa',
    'Liverpool': 'Liverpool',
    'Chelsea': 'Chelsea',
    'Arsenal': 'Arsenal',
    'Nottingham': 'Nottingham Forest',
    'Sheffield Utd': 'Sheffield United',
  };

  return TEAM_MAPPINGS[name] || name;
}

/**
 * Parse date from Rezultati format
 */
function parseRezultatiDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Format: "17.01. 15:00" (DD.MM. HH:mm)
  const match = dateStr.match(/(\d{1,2})\.(\d{1,2})\.\s*(\d{1,2}):(\d{2})/);
  if (!match) return null;

  const day = parseInt(match[1]);
  const month = parseInt(match[2]) - 1; // JS months are 0-based
  const hour = parseInt(match[3]);
  const minute = parseInt(match[4]);

  // Determine year: if month is Aug-Dec (7-11), it's 2025, otherwise 2026
  const year = month >= 7 ? 2025 : 2026;

  const date = new Date(year, month, day, hour, minute);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Calculate matchweek from date
 */
function calculateMatchweek(date: Date): number {
  // Season starts August 17, 2025
  const seasonStart = new Date(2025, 7, 17); // August 17
  const daysDiff = Math.floor((date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(38, Math.floor(daysDiff / 7) + 1));
}

/**
 * Scrape results from Rezultati.com using simple HTTP request
 */
export async function scrapeResultsFromRezultati(): Promise<Fixture[]> {
  try {
    console.log('[Rezultati] Fetching results from Rezultati.com...');

    const response = await axios.get(REZULTATI_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const results: Fixture[] = [];
    const seenIds = new Set<string>();

    // Find all match rows - Rezultati.com uses table structure
    $('table tbody tr').each((index, element) => {
      try {
        const $row = $(element);

        // Skip header rows or rows without match data
        if ($row.find('td').length < 4) return;

        const $cells = $row.find('td');

        // Extract date/time
        const dateTimeText = $cells.eq(0).text().trim();
        const date = parseRezultatiDate(dateTimeText);
        if (!date) return;

        // Extract teams and score
        const matchText = $cells.eq(1).text().trim();
        const scoreMatch = matchText.match(/^(.+?)\s*-\s*(.+?)\s+(\d+):(\d+)/);

        if (!scoreMatch) return;

        const homeTeamRaw = scoreMatch[1].trim();
        const awayTeamRaw = scoreMatch[2].trim();
        const homeScore = parseInt(scoreMatch[3]);
        const awayScore = parseInt(scoreMatch[4]);

        const homeTeam = cleanTeamName(homeTeamRaw);
        const awayTeam = cleanTeamName(awayTeamRaw);

        if (!homeTeam || !awayTeam || homeTeam.length < 3 || awayTeam.length < 3) {
          return;
        }

        // Create fixture ID (without matchweek to ensure fixtures and results match)
        const dateStr = date.toISOString().split('T')[0];
        const matchweek = calculateMatchweek(date);
        const fixtureId = `${homeTeam.toLowerCase().replace(/\s+/g, '-')}-${awayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateStr}`;

        if (seenIds.has(fixtureId)) return;
        seenIds.add(fixtureId);

        const fixture: Fixture = {
          id: fixtureId,
          date: date.toISOString(),
          homeTeam,
          awayTeam,
          homeScore,
          awayScore,
          matchweek,
          status: 'finished',
          isDerby: isDerby(homeTeam, awayTeam),
        };

        results.push(fixture);

      } catch (error) {
        // Skip individual row errors
      }
    });

    console.log(`[Rezultati] Successfully scraped ${results.length} results`);
    return results;

  } catch (error) {
    console.error('[Rezultati] Error scraping results:', error);
    throw error;
  }
}