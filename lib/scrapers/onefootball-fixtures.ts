/**
 * Improved fixtures scraper based on Premier League API approach
 * Uses OneFootball.com instead of official Premier League website
 * Simpler HTML structure, no Puppeteer needed - just HTTP + Cheerio
 * 
 * Based on: https://github.com/tarun7r/Premier-League-API
 */

import axios from 'axios';
import * as cheerio from 'cheerio';
import { Fixture } from '../types';
import { isDerby } from '../clubs';

const ONEFOOTBALL_BASE_URL = 'https://onefootball.com/en/competition/premier-league-9';

/**
 * Scrapes all fixtures from OneFootball.com for the entire season (matchweeks 1-38)
 * OneFootball embeds match data in JSON within __NEXT_DATA__ script tag
 * This is more reliable than HTML parsing and gets ALL fixtures
 */
export async function scrapeFixturesFromOneFootball(): Promise<Fixture[]> {
  try {
    console.log('[OneFootball] Fetching fixtures from OneFootball.com...');
    
    const allFixtures: Fixture[] = [];
    const seenFixtureIds = new Set<string>();

    // OneFootball shows fixtures grouped by date/matchweek
    // We'll fetch the main fixtures page which contains JSON data with all matches
    const response = await axios.get(`${ONEFOOTBALL_BASE_URL}/fixtures`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    
    // Extract JSON data from __NEXT_DATA__ script tag
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (!nextDataScript) {
      throw new Error('Could not find __NEXT_DATA__ script tag');
    }

    const nextData = JSON.parse(nextDataScript);
    
    // Navigate through the nested structure to find match cards
    // Structure: props.pageProps.containers[].fullWidth.component.contentType.matchCardsListsAppender.lists[].matchCards[]
    const containers = nextData?.props?.pageProps?.containers || [];
    
    for (const container of containers) {
      if (container?.type?.fullWidth?.component?.contentType?.matchCardsListsAppender) {
        const matchCardsAppender = container.type.fullWidth.component.contentType.matchCardsListsAppender;
        const lists = matchCardsAppender.lists || [];
        
        for (const list of lists) {
          const matchCards = list.matchCards || [];
          
          for (const matchCard of matchCards) {
            try {
              const homeTeam = matchCard.homeTeam?.name || '';
              const awayTeam = matchCard.awayTeam?.name || '';
              const kickoff = matchCard.kickoff; // ISO date string
              const homeScore = matchCard.homeTeam?.score ? parseInt(matchCard.homeTeam.score) : null;
              const awayScore = matchCard.awayTeam?.score ? parseInt(matchCard.awayTeam.score) : null;
              const period = matchCard.period; // 1 = PreMatch, 11 = FullTime
              const timePeriod = matchCard.timePeriod || '';
              
              if (!homeTeam || !awayTeam || !kickoff) {
                continue;
              }

              // Determine status based on period and scores
              let status: 'scheduled' | 'live' | 'finished' = 'scheduled';
              if (period === 11 || timePeriod.toLowerCase().includes('full time')) {
                status = 'finished';
              } else if (period > 1 && period < 11 || timePeriod.toLowerCase().includes('live')) {
                status = 'live';
              } else if (homeScore !== null && awayScore !== null) {
                status = 'finished';
              }

              // Parse date from ISO string
              const date = new Date(kickoff);
              
              // Calculate matchweek based on date
              // Premier League season typically starts in August
              const seasonStart = new Date(date.getFullYear(), 7, 1); // August 1st
              if (date < seasonStart) {
                // If date is before August, it's likely from previous season
                seasonStart.setFullYear(seasonStart.getFullYear() - 1);
              }
              const daysDiff = Math.floor((date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
              const matchweek = Math.max(1, Math.min(38, Math.ceil((daysDiff + 1) / 7)));

              // Clean team names
              const cleanedHomeTeam = cleanTeamName(homeTeam);
              const cleanedAwayTeam = cleanTeamName(awayTeam);

              // Validate
              if (!cleanedHomeTeam || !cleanedAwayTeam || cleanedHomeTeam.length < 3 || cleanedAwayTeam.length < 3) {
                continue;
              }

              // Create fixture ID
              const dateOnly = date.toISOString().split('T')[0];
              const fixtureId = `${cleanedHomeTeam.toLowerCase().replace(/\s+/g, '-')}-${cleanedAwayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}`;
              
              if (seenFixtureIds.has(fixtureId)) {
                continue; // Skip duplicates
              }
              seenFixtureIds.add(fixtureId);

              const fixture: Fixture = {
                id: fixtureId,
                date: date.toISOString(),
                homeTeam: cleanedHomeTeam,
                awayTeam: cleanedAwayTeam,
                homeScore,
                awayScore,
                matchweek,
                status,
                isDerby: isDerby(cleanedHomeTeam, cleanedAwayTeam),
              };

              allFixtures.push(fixture);
            } catch (error) {
              console.error('[OneFootball] Error parsing match card:', error);
            }
          }
        }
      }
    }

    // If we didn't get enough fixtures from JSON, fall back to HTML parsing
    if (allFixtures.length < 10) {
      console.warn('[OneFootball] Got few fixtures from JSON, trying HTML parsing...');
      const htmlFixtures = await scrapeFixturesFromHTML($);
      for (const fixture of htmlFixtures) {
        if (!seenFixtureIds.has(fixture.id)) {
          allFixtures.push(fixture);
          seenFixtureIds.add(fixture.id);
        }
      }
    }

    console.log(`[OneFootball] Successfully scraped ${allFixtures.length} fixtures`);
    return allFixtures.sort((a, b) => {
      // Sort by matchweek, then by date
      if (a.matchweek !== b.matchweek) {
        return a.matchweek - b.matchweek;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  } catch (error) {
    console.error('[OneFootball] Error scraping fixtures:', error);
    throw error;
  }
}

/**
 * Fallback: Scrape fixtures from HTML if JSON parsing fails
 */
async function scrapeFixturesFromHTML($: ReturnType<typeof cheerio.load>): Promise<Fixture[]> {
  const fixtures: Fixture[] = [];
  const matchCards = $('a.MatchCard_matchCard__iOv4G');

  matchCards.each((index, element) => {
    try {
      const $card = $(element);
      const cardText = $card.text().replace(/\s+/g, ' ').trim();
      
      let homeTeam = '';
      let awayTeam = '';
      let date: Date | null = null;
      let homeScore: number | null = null;
      let awayScore: number | null = null;
      let status: 'scheduled' | 'live' | 'finished' = 'scheduled';
      let matchweek = 1;

      // Extract teams
      const teamNameElements = $card.find('[class*="team-name"], [class*="TeamName"], p, span');
      if (teamNameElements.length >= 2) {
        homeTeam = teamNameElements.eq(0).text().trim();
        awayTeam = teamNameElements.eq(1).text().trim();
      }

      if (!homeTeam || !awayTeam) {
        const vsMatch = cardText.match(/([A-Z][a-zA-Z\s]+?)\s+(?:vs|v\.?|–|-)\s+([A-Z][a-zA-Z\s]+?)(?:\s+\d|\s+FT|\s+LIVE)/i);
        if (vsMatch) {
          homeTeam = vsMatch[1].trim();
          awayTeam = vsMatch[2].trim();
        }
      }

      // Extract date
      const dateMatch1 = cardText.match(/(\d{1,2})\/(\d{1,2})\s+(\d{1,2}):(\d{2})/);
      if (dateMatch1) {
        const day = parseInt(dateMatch1[1]);
        const month = parseInt(dateMatch1[2]) - 1;
        const hour = parseInt(dateMatch1[3]);
        const minute = parseInt(dateMatch1[4]);
        const now = new Date();
        let year = now.getFullYear();
        if (month < now.getMonth() || (month === now.getMonth() && day < now.getDate())) {
          year = year + 1;
        }
        date = new Date(year, month, day, hour, minute);
      }

      // Extract score
      const scoreMatch = cardText.match(/(\d{1,2})\s*[-:]\s*(\d{1,2})/);
      if (scoreMatch) {
        homeScore = parseInt(scoreMatch[1]);
        awayScore = parseInt(scoreMatch[2]);
        status = 'finished';
      }

      // Calculate matchweek
      if (date) {
        const seasonStart = new Date(date.getFullYear(), 7, 1);
        if (date < seasonStart) {
          seasonStart.setFullYear(seasonStart.getFullYear() - 1);
        }
        const daysDiff = Math.floor((date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
        matchweek = Math.max(1, Math.min(38, Math.ceil((daysDiff + 1) / 7)));
      }

      homeTeam = cleanTeamName(homeTeam);
      awayTeam = cleanTeamName(awayTeam);

      if (!homeTeam || !awayTeam || homeTeam.length < 3 || awayTeam.length < 3) {
        return;
      }

      const dateOnly = date ? date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      const fixtureId = `${homeTeam.toLowerCase().replace(/\s+/g, '-')}-${awayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}`;

      fixtures.push({
        id: fixtureId,
        date: date ? date.toISOString() : new Date().toISOString(),
        homeTeam,
        awayTeam,
        homeScore,
        awayScore,
        matchweek,
        status,
        isDerby: isDerby(homeTeam, awayTeam),
      });
    } catch (error) {
      // Skip errors
    }
  });

  return fixtures;
}

/**
 * Cleans team name by removing duplicates and extra whitespace
 */
function cleanTeamName(name: string): string {
  if (!name) return '';
  
  // Remove extra whitespace
  name = name.trim().replace(/\s+/g, ' ');
  
  // Remove duplicate words (same logic as our improved function)
  const words = name.split(/\s+/);
  const cleaned: string[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i].trim();
    if (!word) continue;
    
    // Check if this word is a duplicate
    const isDuplicate = cleaned.some(prevWord => {
      const prevLower = prevWord.toLowerCase();
      const wordLower = word.toLowerCase();
      return prevLower === wordLower || 
             (prevLower.includes(wordLower) && wordLower.length >= 3) ||
             (wordLower.includes(prevLower) && prevLower.length >= 3);
    });
    
    if (!isDuplicate) {
      cleaned.push(word);
    }
  }
  
  return cleaned.join(' ').trim();
}

/**
 * Scrapes results (finished matches) from OneFootball.com
 * OneFootball has a dedicated results page with all finished matches
 */
export async function scrapeResultsFromOneFootball(): Promise<Fixture[]> {
  try {
    console.log('[OneFootball] Fetching results from OneFootball.com...');
    
    const response = await axios.get(`${ONEFOOTBALL_BASE_URL}/results`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const allResults: Fixture[] = [];
    const seenFixtureIds = new Set<string>();

    // Extract JSON data from __NEXT_DATA__ script tag (same as fixtures)
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (!nextDataScript) {
      throw new Error('Could not find __NEXT_DATA__ script tag');
    }

    const nextData = JSON.parse(nextDataScript);
    
    // Navigate through the nested structure to find match cards
    const containers = nextData?.props?.pageProps?.containers || [];
    
    for (const container of containers) {
      if (container?.type?.fullWidth?.component?.contentType?.matchCardsListsAppender) {
        const matchCardsAppender = container.type.fullWidth.component.contentType.matchCardsListsAppender;
        const lists = matchCardsAppender.lists || [];
        
        for (const list of lists) {
          const matchCards = list.matchCards || [];
          
          for (const matchCard of matchCards) {
            try {
              const homeTeam = matchCard.homeTeam?.name || '';
              const awayTeam = matchCard.awayTeam?.name || '';
              const kickoff = matchCard.kickoff; // ISO date string
              const homeScore = matchCard.homeTeam?.score ? parseInt(matchCard.homeTeam.score) : null;
              const awayScore = matchCard.awayTeam?.score ? parseInt(matchCard.awayTeam.score) : null;
              const period = matchCard.period; // 1 = PreMatch, 11 = FullTime
              const timePeriod = matchCard.timePeriod || '';
              
              // Only include finished matches (results must have scores and be finished)
              if (!homeTeam || !awayTeam || !kickoff || homeScore === null || awayScore === null) {
                continue;
              }

              // Only include finished matches
              if (period !== 11 && !timePeriod.toLowerCase().includes('full time')) {
                continue; // Skip scheduled/live matches
              }

              // Parse date from ISO string
              const date = new Date(kickoff);
              
              // Calculate matchweek based on date
              const seasonStart = new Date(date.getFullYear(), 7, 1); // August 1st
              if (date < seasonStart) {
                seasonStart.setFullYear(seasonStart.getFullYear() - 1);
              }
              const daysDiff = Math.floor((date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
              const matchweek = Math.max(1, Math.min(38, Math.ceil((daysDiff + 1) / 7)));

              // Clean team names
              const cleanedHomeTeam = cleanTeamName(homeTeam);
              const cleanedAwayTeam = cleanTeamName(awayTeam);

              // Validate
              if (!cleanedHomeTeam || !cleanedAwayTeam || cleanedHomeTeam.length < 3 || cleanedAwayTeam.length < 3) {
                continue;
              }

              // Create fixture ID
              const dateOnly = date.toISOString().split('T')[0];
              const fixtureId = `${cleanedHomeTeam.toLowerCase().replace(/\s+/g, '-')}-${cleanedAwayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}`;
              
              if (seenFixtureIds.has(fixtureId)) {
                continue; // Skip duplicates
              }
              seenFixtureIds.add(fixtureId);

              const fixture: Fixture = {
                id: fixtureId,
                date: date.toISOString(),
                homeTeam: cleanedHomeTeam,
                awayTeam: cleanedAwayTeam,
                homeScore,
                awayScore,
                matchweek,
                status: 'finished',
                isDerby: isDerby(cleanedHomeTeam, cleanedAwayTeam),
              };

              allResults.push(fixture);
            } catch (error) {
              console.error('[OneFootball] Error parsing result card:', error);
            }
          }
        }
      }
    }

    console.log(`[OneFootball] Successfully scraped ${allResults.length} results`);
    return allResults.sort((a, b) => {
      // Sort by matchweek, then by date
      if (a.matchweek !== b.matchweek) {
        return a.matchweek - b.matchweek;
      }
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  } catch (error) {
    console.error('[OneFootball] Error scraping results:', error);
    throw error;
  }
}

/**
 * Scrapes standings from OneFootball.com
 * Simpler than official Premier League site
 */
export async function scrapeStandingsFromOneFootball() {
  try {
    console.log('[OneFootball] Fetching standings from OneFootball.com...');
    
    const response = await axios.get(`${ONEFOOTBALL_BASE_URL}/table`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const standings: any[] = [];

    // Find all standings rows
    const rows = $('li.Standing_standings__row__5sdZG');

    rows.each((index, element) => {
      const $row = $(element);
      
      const positionEl = $row.find('div.Standing_standings__cell__5Kd0W').first();
      const teamEl = $row.find('p.Standing_standings__teamName__psv61');
      const stats = $row.find('div.Standing_standings__cell__5Kd0W');

      if (positionEl.length && teamEl.length && stats.length >= 7) {
        const position = parseInt(positionEl.text().trim()) || index + 1;
        const team = cleanTeamName(teamEl.text().trim());
        const played = parseInt(stats.eq(2).text().trim()) || 0;
        const won = parseInt(stats.eq(3).text().trim()) || 0;
        const drawn = parseInt(stats.eq(4).text().trim()) || 0;
        const lost = parseInt(stats.eq(5).text().trim()) || 0;
        const goalDifference = parseInt(stats.eq(6).text().trim()) || 0;
        const points = parseInt(stats.eq(7).text().trim()) || 0;

        standings.push({
          position,
          club: team,
          played,
          won,
          drawn,
          lost,
          goalsFor: 0, // OneFootball might not show this separately
          goalsAgainst: 0,
          goalDifference,
          points,
          form: '', // Would need to extract from another source
        });
      }
    });

    console.log(`[OneFootball] Successfully scraped ${standings.length} standings`);
    return standings;
  } catch (error) {
    console.error('[OneFootball] Error scraping standings:', error);
    throw error;
  }
}

