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
import { normalizeClubName } from '../utils/club-name-utils';

const ONEFOOTBALL_BASE_URL = 'https://onefootball.com/en/competition/premier-league-9';

/**
 * Corrects matchweek numbers based on finished matches.
 * If future matches have matchweek numbers that are <= the highest finished matchweek,
 * we need to adjust them based on date grouping.
 */
function correctMatchweekNumbers(fixtures: Fixture[]): Fixture[] {
  // Find the highest matchweek with finished matches
  const finishedMatches = fixtures.filter(f => f.status === "finished");
  
  if (finishedMatches.length === 0) {
    // No finished matches, can't correct - return as is
    return fixtures;
  }

  const finishedMatchweeks = finishedMatches.map(f => f.matchweek);
  const maxFinishedMatchweek = Math.max(...finishedMatchweeks);
  
  // Count matches per matchweek to see if maxFinishedMatchweek is complete
  const matchesInMaxWeek = finishedMatches.filter(f => f.matchweek === maxFinishedMatchweek).length;
  
  // If we have at least 8 matches in the highest week, consider it complete
  // Current matchweek would be maxFinishedMatchweek + 1
  const currentMatchweek = matchesInMaxWeek >= 8 ? maxFinishedMatchweek + 1 : maxFinishedMatchweek;
  
  // Group future matches by date to determine their actual matchweek
  const futureMatches = fixtures.filter(f => f.status === "scheduled" || f.status === "live");
  
  if (futureMatches.length === 0) {
    return fixtures;
  }

  // Sort future matches by date
  const sortedFuture = [...futureMatches].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Group matches by date ranges (matches within ~3 days are likely same matchweek)
  const dateGroups: Fixture[][] = [];
  let currentGroup: Fixture[] = [];
  let lastDate: Date | null = null;

  for (const match of sortedFuture) {
    const matchDate = new Date(match.date);
    
    if (!lastDate || matchDate.getTime() - lastDate.getTime() > 3 * 24 * 60 * 60 * 1000) {
      // New group (more than 3 days apart)
      if (currentGroup.length > 0) {
        dateGroups.push(currentGroup);
      }
      currentGroup = [match];
    } else {
      // Same group
      currentGroup.push(match);
    }
    lastDate = matchDate;
  }
  
  if (currentGroup.length > 0) {
    dateGroups.push(currentGroup);
  }

  // Assign matchweek numbers to future matches
  // Start from currentMatchweek and increment for each date group
  const correctedFixtures = fixtures.map(fixture => {
    // Only correct future matches
    if (fixture.status !== "scheduled" && fixture.status !== "live") {
      return fixture;
    }

    // Find which date group this match belongs to
    const groupIndex = dateGroups.findIndex(group => 
      group.some(m => m.id === fixture.id)
    );

    if (groupIndex === -1) {
      // Couldn't find group, check if matchweek is too low
      if (fixture.matchweek <= maxFinishedMatchweek) {
        console.warn(`[OneFootball] Future match ${fixture.homeTeam} vs ${fixture.awayTeam} has matchweek ${fixture.matchweek} but max finished is ${maxFinishedMatchweek}. Setting to ${currentMatchweek}`);
        return { ...fixture, matchweek: currentMatchweek };
      }
      return fixture;
    }

    // Calculate correct matchweek: currentMatchweek + groupIndex
    const correctMatchweek = currentMatchweek + groupIndex;
    
    // Only update if the stored matchweek is clearly wrong
    if (fixture.matchweek <= maxFinishedMatchweek || fixture.matchweek < correctMatchweek) {
      console.log(`[OneFootball] Correcting matchweek for ${fixture.homeTeam} vs ${fixture.awayTeam}: ${fixture.matchweek} -> ${correctMatchweek}`);
      return { ...fixture, matchweek: correctMatchweek };
    }

    return fixture;
  });

  return correctedFixtures;
}

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
    const matchDates: Date[] = [];

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

    // Check if OneFootball is blocking the request (Cloudflare or similar)
    const responseText = response.data.toLowerCase();
    // Temporarily disabled to test if this is causing the issue
    /*
    if (responseText.includes('access denied') ||
        responseText.includes('blocked') ||
        responseText.includes('cloudflare') ||
        responseText.includes('checking your browser') ||
        responseText.includes('ddos protection') ||
        responseText.includes('bot detection')) {
      throw new Error('OneFootball is blocking automated requests (Cloudflare protection)');
    }
    */

    // Extract JSON data from __NEXT_DATA__ script tag
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (!nextDataScript) {
      throw new Error('Could not find __NEXT_DATA__ script tag');
    }

    const nextData = JSON.parse(nextDataScript);
    
    // Navigate through the nested structure to find match cards
    // Structure: props.pageProps.containers[].type.fullWidth.component.contentType.$case === 'matchCardsListsAppender'
    const containers = nextData?.props?.pageProps?.containers || [];

    // First pass: collect all match dates to find season start
    for (const container of containers) {
      if (container?.type?.fullWidth?.component?.contentType?.$case === 'matchCardsListsAppender') {
        const matchCardsAppender = container.type.fullWidth.component.contentType.matchCardsListsAppender;
        const lists = matchCardsAppender.lists || [];
        
        for (const list of lists) {
          const matchCards = list.matchCards || [];
          
          for (const matchCard of matchCards) {
            try {
              const kickoff = matchCard.kickoff;
              if (kickoff) {
                const date = new Date(kickoff);
                if (!isNaN(date.getTime())) {
                  matchDates.push(date);
                }
              }
            } catch (error) {
              // Skip errors in first pass
            }
          }
        }
      }
    }
    
    // Find the earliest match date (season start)
    const seasonStartDate = matchDates.length > 0 
      ? new Date(Math.min(...matchDates.map(d => d.getTime())))
      : new Date(new Date().getFullYear(), 7, 17); // Fallback to August 17th (typical season start)
    
    console.log(`[OneFootball] Season start date: ${seasonStartDate.toISOString().split('T')[0]}`);
    
    // Second pass: process matches and extract matchweek from API data
    for (const container of containers) {
      if (container?.type?.fullWidth?.component?.contentType?.$case === 'matchCardsListsAppender') {
        const matchCardsAppender = container.type.fullWidth.component.contentType.matchCardsListsAppender;
        const lists = matchCardsAppender.lists || [];
        
        for (const list of lists) {
          // Try to extract matchweek from list metadata
          const listTitle = list.title || list.label || list.name || list.heading || '';
          const titleMatch = listTitle.match(/matchweek\s*(\d+)|matchday\s*(\d+)|round\s*(\d+)|mw\s*(\d+)|week\s*(\d+)/i);
          const listMatchweek = titleMatch 
            ? parseInt(titleMatch[1] || titleMatch[2] || titleMatch[3] || titleMatch[4] || titleMatch[5])
            : null;
          
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
              
              // Try to get matchweek from matchCard or list metadata, otherwise calculate from date
              const cardMatchweek = matchCard.matchweek || matchCard.matchday || matchCard.round || matchCard.matchWeek;
              let matchweek = cardMatchweek || listMatchweek;
              
              // If no matchweek from API, calculate from date
              if (!matchweek) {
                const daysDiff = Math.floor((date.getTime() - seasonStartDate.getTime()) / (1000 * 60 * 60 * 24));
                matchweek = Math.max(1, Math.min(38, Math.floor(daysDiff / 7) + 1));
              }

              // Clean team names
              const cleanedHomeTeam = cleanTeamName(homeTeam);
              const cleanedAwayTeam = cleanTeamName(awayTeam);

              // Validate
              if (!cleanedHomeTeam || !cleanedAwayTeam || cleanedHomeTeam.length < 3 || cleanedAwayTeam.length < 3) {
                continue;
              }

              // Create fixture ID (without matchweek to ensure fixtures and results match)
              // The unique identifier is: homeTeam + awayTeam + date
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

    // If we didn't get enough fixtures from JSON, try HTML parsing as fallback
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

    // Post-process: Correct matchweek numbers based on finished matches
    const correctedFixtures = correctMatchweekNumbers(allFixtures);
    
    console.log(`[OneFootball] Successfully scraped ${correctedFixtures.length} fixtures`);
    return correctedFixtures.sort((a: Fixture, b: Fixture) => {
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

  matchCards.each((_index: number, element: cheerio.Element) => {
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

      // Calculate matchweek (using improved calculation)
      if (date) {
        // Use August 17th as typical season start (more accurate than August 1st)
        const seasonStart = new Date(date.getFullYear(), 7, 17); // August 17th
        if (date < seasonStart) {
          seasonStart.setFullYear(seasonStart.getFullYear() - 1);
        }
        const daysDiff = Math.floor((date.getTime() - seasonStart.getTime()) / (1000 * 60 * 60 * 24));
        matchweek = Math.max(1, Math.min(38, Math.floor(daysDiff / 7) + 1));
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
 * Cleans team name by removing duplicates and extra whitespace,
 * then normalizes to canonical name
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
  
  const cleanedName = cleaned.join(' ').trim();
  if (!cleanedName) return '';

  return normalizeClubName(cleanedName);
}

/**
 * Scrapes results (finished matches) from OneFootball.com
 * OneFootball has a dedicated results page with all finished matches
 * Attempts to extract matchweek information from the API data structure
 */

/**
 * Fetches all results from OneFootball and organizes them by matchweek
 * Extracts matchweek information from list metadata or groups matches by date ranges
 */
async function fetchAllResultsFromOneFootball(): Promise<Map<number, Fixture[]>> {
  const resultsByMatchweek = new Map<number, Fixture[]>();
  
  try {
    const response = await axios.get(`${ONEFOOTBALL_BASE_URL}/results`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      timeout: 30000,
    });

    const $ = cheerio.load(response.data);
    const seenFixtureIds = new Set<string>();

    // Check if OneFootball is blocking the request (Cloudflare or similar)
    const responseText = response.data.toLowerCase();
    // Temporarily disabled to test if this is causing the issue
    /*
    if (responseText.includes('access denied') ||
        responseText.includes('blocked') ||
        responseText.includes('cloudflare') ||
        responseText.includes('checking your browser') ||
        responseText.includes('ddos protection') ||
        responseText.includes('bot detection')) {
      throw new Error('OneFootball is blocking automated requests (Cloudflare protection)');
    }
    */

    // Extract JSON data from __NEXT_DATA__ script tag
    const nextDataScript = $('#__NEXT_DATA__').html();
    if (!nextDataScript) {
      return resultsByMatchweek;
    }

    const nextData = JSON.parse(nextDataScript);
    const containers = nextData?.props?.pageProps?.containers || [];
    
    // First, collect all matches and try to identify matchweeks from list metadata
    for (const container of containers) {
      if (container?.type?.fullWidth?.component?.contentType?.$case === 'matchCardsListsAppender') {
        const matchCardsAppender = container.type.fullWidth.component.contentType.matchCardsListsAppender;
        const lists = matchCardsAppender.lists || [];
        
        for (const list of lists) {
          // Check if list has metadata indicating matchweek
          // Look in various possible fields
          const listTitle = list.title || list.label || list.name || list.heading || '';
          const listMetadata = list.metadata || {};
          const listData = list.data || {};
          
          // Try to extract matchweek from title/label
          const titleMatch = listTitle.match(/matchweek\s*(\d+)|matchday\s*(\d+)|round\s*(\d+)|mw\s*(\d+)|week\s*(\d+)/i);
          const listMatchweek = titleMatch 
            ? parseInt(titleMatch[1] || titleMatch[2] || titleMatch[3] || titleMatch[4] || titleMatch[5])
            : null;
          
          // Also check metadata fields
          const metadataMatchweek = listMetadata.matchweek || listMetadata.matchday || listMetadata.round || listData.matchweek || listData.matchday || listData.round;
          
          const finalListMatchweek = listMatchweek || metadataMatchweek || null;
          
          const matchCards = list.matchCards || [];
          
          for (const matchCard of matchCards) {
            try {
              const homeTeam = matchCard.homeTeam?.name || '';
              const awayTeam = matchCard.awayTeam?.name || '';
              const kickoff = matchCard.kickoff;
              const homeScore = matchCard.homeTeam?.score ? parseInt(matchCard.homeTeam.score) : null;
              const awayScore = matchCard.awayTeam?.score ? parseInt(matchCard.awayTeam.score) : null;
              const period = matchCard.period;
              const timePeriod = matchCard.timePeriod || '';
              
              // Check if matchCard itself has matchweek/round info
              const cardMatchweek = matchCard.matchweek || matchCard.matchday || matchCard.round || matchCard.matchWeek;
              
              // Basic validation
              if (!homeTeam || !awayTeam || !kickoff) {
                continue;
              }

              // Results must have scores
              if (homeScore === null || awayScore === null) {
                continue;
              }

              // Skip live matches
              const isLive = period > 1 && period < 11 && 
                            (timePeriod.toLowerCase().includes('live') || 
                             timePeriod.toLowerCase().includes('half time') ||
                             timePeriod.toLowerCase().includes('ht'));
              
              if (isLive) {
                continue;
              }

              const date = new Date(kickoff);
              if (isNaN(date.getTime())) {
                continue;
              }

              // Determine matchweek: prefer card-level, then list-level
              let finalMatchweek = cardMatchweek || finalListMatchweek;
              
              // If we still don't have matchweek, we'll need to group by date later
              // For now, use null as placeholder
              if (!finalMatchweek) {
                finalMatchweek = null; // Will be assigned later based on date grouping
              }

              // Clean team names
              const cleanedHomeTeam = cleanTeamName(homeTeam);
              const cleanedAwayTeam = cleanTeamName(awayTeam);

              if (!cleanedHomeTeam || !cleanedAwayTeam || cleanedHomeTeam.length < 3 || cleanedAwayTeam.length < 3) {
                continue;
              }

              // Create fixture ID (without matchweek to ensure fixtures and results match)
              const dateOnly = date.toISOString().split('T')[0];
              const fixtureId = `${cleanedHomeTeam.toLowerCase().replace(/\s+/g, '-')}-${cleanedAwayTeam.toLowerCase().replace(/\s+/g, '-')}-${dateOnly}`;
              
              if (seenFixtureIds.has(fixtureId)) {
                continue;
              }
              seenFixtureIds.add(fixtureId);

              const fixture: Fixture = {
                id: fixtureId,
                date: date.toISOString(),
                homeTeam: cleanedHomeTeam,
                awayTeam: cleanedAwayTeam,
                homeScore,
                awayScore,
                matchweek: finalMatchweek || 1, // Temporary, will be fixed
                status: 'finished',
                isDerby: isDerby(cleanedHomeTeam, cleanedAwayTeam),
              };

              // Group by matchweek if we have it, otherwise store with null for later processing
              if (finalMatchweek) {
                if (!resultsByMatchweek.has(finalMatchweek)) {
                  resultsByMatchweek.set(finalMatchweek, []);
                }
                resultsByMatchweek.get(finalMatchweek)!.push(fixture);
              } else {
                // Store in a temporary list for date-based grouping
                if (!resultsByMatchweek.has(0)) {
                  resultsByMatchweek.set(0, []);
                }
                resultsByMatchweek.get(0)!.push(fixture);
              }
            } catch (error) {
              console.error('[OneFootball] Error parsing result card:', error);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('[OneFootball] Error fetching results:', error);
  }
  
  return resultsByMatchweek;
}

/**
 * Groups matches without matchweek info into matchweeks based on date ranges
 * Uses the actual season start date (August 17th) instead of earliest match date
 */
function assignMatchweeksByDate(fixtures: Fixture[]): Fixture[] {
  if (fixtures.length === 0) {
    return fixtures;
  }
  
  // Sort by date
  fixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Determine the season start date (August 17th)
  // Premier League season typically starts mid-August
  const firstMatchDate = new Date(fixtures[0].date);
  const firstMatchYear = firstMatchDate.getFullYear();
  const firstMatchMonth = firstMatchDate.getMonth(); // 0-11 (Jan=0, Aug=7)
  
  // If match is before August, season started in previous year
  // If match is August or later, season started in current year
  let seasonYear = firstMatchYear;
  if (firstMatchMonth < 7) { // Before August (month < 7)
    seasonYear = firstMatchYear - 1;
  }
  
  // Season starts August 17th
  const seasonStartDate = new Date(seasonYear, 7, 17); // August 17th (month 7 = August)
  
  console.log(`[OneFootball] Assigning matchweeks: Season start ${seasonStartDate.toISOString().split('T')[0]}, First match ${firstMatchDate.toISOString().split('T')[0]}`);
  
  // Group into matchweeks (each matchweek is ~7 days)
  const grouped: Map<number, Fixture[]> = new Map();
  
  for (const fixture of fixtures) {
    const date = new Date(fixture.date);
    const daysDiff = Math.floor((date.getTime() - seasonStartDate.getTime()) / (1000 * 60 * 60 * 24));
    const matchweek = Math.max(1, Math.min(38, Math.floor(daysDiff / 7) + 1));
    
    if (!grouped.has(matchweek)) {
      grouped.set(matchweek, []);
    }
    grouped.get(matchweek)!.push(fixture);
  }
  
  // Update matchweek values (IDs remain the same without matchweek)
  const result: Fixture[] = [];
  for (const [matchweek, matchFixtures] of grouped) {
    for (const fixture of matchFixtures) {
      result.push({
        ...fixture,
        matchweek,
      });
    }
  }
  
  return result;
}

export async function scrapeResultsFromOneFootball(): Promise<Fixture[]> {
  try {
    console.log('[OneFootball] Fetching results from OneFootball.com...');
    
    // Fetch all results organized by matchweek
    const resultsByMatchweek = await fetchAllResultsFromOneFootball();
    
    const allResults: Fixture[] = [];
    const seenFixtureIds = new Set<string>();
    
    // Process results that already have matchweek assigned
    for (let matchweek = 1; matchweek <= 38; matchweek++) {
      const matchweekResults = resultsByMatchweek.get(matchweek) || [];
      for (const result of matchweekResults) {
        if (!seenFixtureIds.has(result.id)) {
          seenFixtureIds.add(result.id);
          allResults.push(result);
        }
      }
      if (matchweekResults.length > 0) {
        console.log(`[OneFootball] Found ${matchweekResults.length} results for matchweek ${matchweek}`);
      }
    }
    
    // Process results without matchweek info (grouped under key 0)
    const unassignedResults = resultsByMatchweek.get(0) || [];
    if (unassignedResults.length > 0) {
      console.log(`[OneFootball] Found ${unassignedResults.length} results without matchweek info, assigning by date...`);
      const assignedResults = assignMatchweeksByDate(unassignedResults);
      
      for (const result of assignedResults) {
        if (!seenFixtureIds.has(result.id)) {
          seenFixtureIds.add(result.id);
          allResults.push(result);
        }
      }
    }

    console.log(`[OneFootball] Successfully scraped ${allResults.length} total results`);
    
    // Log matchweek distribution
    const matchweekCounts = new Map<number, number>();
    for (const result of allResults) {
      matchweekCounts.set(result.matchweek, (matchweekCounts.get(result.matchweek) || 0) + 1);
    }
    console.log('[OneFootball] Results by matchweek:', Object.fromEntries(matchweekCounts));
    
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

    rows.each((index: number, element: cheerio.Element) => {
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

