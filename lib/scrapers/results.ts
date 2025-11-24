import { Fixture } from "../types";
import { isDerby } from "../clubs";
import { scrapePage } from "./browser";

/**
 * Scrapes match results (finished matches) from Premier League website
 * Uses the same /matches URL but filters for finished matches with scores
 * URL: https://www.premierleague.com/matches
 */
export async function scrapeResults(): Promise<Fixture[]> {
  const allResults: Fixture[] = [];
  const seenFixtureIds = new Set<string>();
  
  try {
    // Scrape all matchweeks from 1 to 38 for results
    // Stop early if we find 3 consecutive matchweeks with no data
    const maxMatchweek = 38;
    let consecutiveEmpty = 0;
    
    for (let matchweek = 1; matchweek <= maxMatchweek; matchweek++) {
      let page;
      try {
        // Use matches URL (same as fixtures) - results are finished matches on this page
        const url = `https://www.premierleague.com/matches?competition=8&season=2025&matchweek=${matchweek}`;
        
        console.log(`[Results] Scraping matchweek ${matchweek}...`);
        page = await scrapePage(url, undefined, 30000);
        
        // Wait for page to fully load
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Scroll multiple times to load all lazy-loaded content
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => {
            window.scrollTo(0, document.body.scrollHeight);
          });
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Scroll back up
        await page.evaluate(() => {
          window.scrollTo(0, 0);
        });
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Extract results from the page (finished matches only)
        // Wrap in try-catch to handle any errors gracefully
        let resultsData;
        try {
          // Pass matchweek as parameter - no closure issues
          resultsData = await page.evaluate((mw) => {
            const results: any[] = [];
            const debug: string[] = [];

            try {
              // Debug: Check page content
              debug.push(`Page URL: ${window.location.href}`);
              debug.push(`Page title: ${document.title}`);
              debug.push(`Body text length: ${document.body.textContent?.length || 0}`);
              debug.push(`Scraping matchweek: ${mw}`);

              // Find match cards - try multiple selectors
              const matchCards = document.querySelectorAll('.match-card, [class*="match-card"], [class*="match"], [data-testid*="match"]');
              debug.push(`Found ${matchCards.length} match cards`);

              // Also check for any team names on the page
              const bodyText = document.body.textContent || '';
              const hasTeamNames = /(Arsenal|Chelsea|Liverpool|Man City|Man Utd|Tottenham)/i.test(bodyText);
              debug.push(`Page contains team names: ${hasTeamNames}`);

              matchCards.forEach((card, index) => {
                try {
                  // Find home and away team containers - try multiple selectors
                  let homeTeamContainer = card.querySelector('.match-card__team--home, [class*="team--home"]');
                  let awayTeamContainer = card.querySelector('.match-card__team--away, [class*="team--away"]');

                  // Extract team names
                  let homeTeam = '';
                  let awayTeam = '';

                  if (homeTeamContainer && awayTeamContainer) {
                    const homeTeamFull = homeTeamContainer.querySelector('.match-card__team-name--full, [data-testid="matchCardTeamFullName"]');
                    homeTeam = homeTeamFull?.textContent?.trim() ||
                              homeTeamContainer.querySelector('.match-card__team-name')?.textContent?.trim() || '';

                    const awayTeamFull = awayTeamContainer.querySelector('.match-card__team-name--full, [data-testid="matchCardTeamFullName"]');
                    awayTeam = awayTeamFull?.textContent?.trim() ||
                              awayTeamContainer.querySelector('.match-card__team-name')?.textContent?.trim() || '';
                  } else {
                    // Fallback: try to extract from card text
                    const cardText = card.textContent || '';
                    const teamMatch = cardText.match(/([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+vs?\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
                    if (teamMatch) {
                      homeTeam = teamMatch[1].trim();
                      awayTeam = teamMatch[2].trim();
                    }
                  }

                  if (!homeTeam || !awayTeam || homeTeam === awayTeam) {
                    if (index < 5) {
                      debug.push(`Card ${index}: Invalid teams - home: "${homeTeam}", away: "${awayTeam}"`);
                    }
                    return;
                  }

                  // Find score - results always have scores
                  const scoreElement = card.querySelector('.match-card__score, [class*="score"], [data-testid*="score"]');
                  const scoreText = scoreElement?.textContent?.trim() || '';

                  // Extract scores - results must have scores
                  let homeScore: number | null = null;
                  let awayScore: number | null = null;

                  const scoreMatch = scoreText.match(/(\d+)\s*[-]\s*(\d+)/);
                  if (scoreMatch) {
                    homeScore = parseInt(scoreMatch[1]);
                    awayScore = parseInt(scoreMatch[2]);
                  } else {
                    // Try to extract from card text
                    const cardText = card.textContent || '';
                    const textScoreMatch = cardText.match(/(\d+)\s*[-]\s*(\d+)/);
                    if (textScoreMatch) {
                      homeScore = parseInt(textScoreMatch[1]);
                      awayScore = parseInt(textScoreMatch[2]);
                    }
                  }

                  // Check if this is a finished match
                  const cardText = card.textContent?.toLowerCase() || '';
                  const hasScore = homeScore !== null && awayScore !== null;
                  const isLive = cardText.includes("live");

                  // Results must have scores and not be live
                  if (!hasScore) {
                    if (index < 5) {
                      debug.push(`Card ${index}: No score found for ${homeTeam} vs ${awayTeam}`);
                    }
                    return;
                  }

                  if (isLive) {
                    return; // Skip live matches - they're not results yet
                  }

                  // If it has a score and is not live, it's a finished match (result)
                  results.push({
                    homeTeam,
                    awayTeam,
                    dateStr: '',
                    homeScore,
                    awayScore,
                    matchweek: mw,
                    status: "finished",
                  });
                } catch (cardError) {
                  // Skip this card if there's an error
                  debug.push(`Card ${index}: Error processing - ${cardError}`);
                }
              });

              debug.push(`Extracted ${results.length} results from matchweek ${mw}`);
              if (results.length > 0) {
                debug.push(`Sample result: ${results[0].homeTeam} vs ${results[0].awayTeam} ${results[0].homeScore}-${results[0].awayScore}`);
              }

            } catch (error) {
              debug.push(`Error in page evaluation: ${error}`);
            }

            return { results, debug };
          }, matchweek);
        } catch (evalError) {
          console.error(`[Results] Error in page.evaluate for matchweek ${matchweek}:`, evalError);
          // Continue with empty results for this matchweek
          resultsData = { results: [], debug: [`Error: ${evalError instanceof Error ? evalError.message : String(evalError)}`] };
        }
        
        const actualResults = resultsData?.results || resultsData || [];
        if (resultsData?.debug) {
          console.log(`[Results] Matchweek ${matchweek} debug:`, resultsData.debug.join('\n'));
        }
        console.log(`[Results] Matchweek ${matchweek}: Found ${actualResults.length} results`);

        // Process and format results
        for (const resultData of actualResults) {
          if (!resultData.homeTeam || !resultData.awayTeam || resultData.homeTeam === resultData.awayTeam) {
            continue;
          }
          
          // Validate matchweek
          if (!resultData.matchweek || resultData.matchweek < 1 || resultData.matchweek > 38) {
            console.warn(`Skipping result with invalid matchweek: ${resultData.homeTeam} vs ${resultData.awayTeam} (MW: ${resultData.matchweek})`);
            continue;
          }
          
          let date: Date;
          if (resultData.dateStr) {
            const parsedDate = parseDate(resultData.dateStr);
            if (parsedDate) {
              date = parsedDate;
            } else {
              date = new Date();
            }
          } else {
            date = new Date();
          }
          
          // Results must have scores and be finished
          if (resultData.homeScore === null || resultData.awayScore === null) {
            continue; // Skip if no score
          }
          
          // Double-check: if match is in the past and has scores, it's definitely finished
          const now = new Date();
          const matchDate = new Date(date);
          const isPastMatch = matchDate < now;
          
          if (!isPastMatch && resultData.status !== "finished") {
            continue; // Skip future matches without finished status
          }
          
          // Create unique ID for deduplication
          const fixtureId = `${resultData.homeTeam}-${resultData.awayTeam}-${date.toISOString()}-${resultData.matchweek}`;
          
          // Skip if already seen
          if (seenFixtureIds.has(fixtureId)) {
            continue;
          }
          seenFixtureIds.add(fixtureId);
          
          allResults.push({
            id: fixtureId,
            date: date.toISOString(),
            homeTeam: resultData.homeTeam,
            awayTeam: resultData.awayTeam,
            homeScore: resultData.homeScore,
            awayScore: resultData.awayScore,
            matchweek: resultData.matchweek,
            status: "finished",
            isDerby: isDerby(resultData.homeTeam, resultData.awayTeam),
          });
        }
        
        // Check if we should stop early
        if (actualResults.length === 0) {
          consecutiveEmpty++;
          if (consecutiveEmpty >= 3 && matchweek > 10) {
            console.log(`[Results] Stopping early: Found ${consecutiveEmpty} consecutive empty matchweeks`);
            break;
          }
        } else {
          consecutiveEmpty = 0;
        }
        
        // Close page before next iteration
        if (page) {
          await page.close();
        }
      } catch (error) {
        console.error(`[Results] Error scraping matchweek ${matchweek}:`, error);
        if (page) {
          await page.close();
        }
        // Continue to next matchweek
        continue;
      }
    }
    
    console.log(`[Results] Total results scraped: ${allResults.length} from ${new Set(allResults.map(f => f.matchweek)).size} matchweeks`);
    
    return allResults.sort(
      (a, b) => {
        // Sort by matchweek first, then by date
        if (a.matchweek !== b.matchweek) {
          return a.matchweek - b.matchweek;
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    );
  } catch (error) {
    console.error("[Results] Error scraping results:", error);
    return [];
  }
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  try {
    // Try ISO date format first
    if (dateStr.includes("T") || dateStr.includes("-")) {
      const date = new Date(dateStr);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Try "DD MMM" format
    const now = new Date();
    const parts = dateStr.trim().split(" ");
    if (parts.length >= 2) {
      const day = parseInt(parts[0]);
      const monthStr = parts[1];
      const monthMap: Record<string, number> = {
        Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
        Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
      };
      
      if (!isNaN(day) && monthMap[monthStr] !== undefined) {
        const date = new Date(now.getFullYear(), monthMap[monthStr], day);
        return date;
      }
    }
    
    // Try other common formats
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date;
    }
    
    return null;
  } catch {
    return null;
  }
}

