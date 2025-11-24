import { Fixture } from "../types";
import { isDerby } from "../clubs";
import { scrapePage } from "./browser";

/**
 * Scrapes fixtures (scheduled and live matches) from Premier League website
 * URL: https://www.premierleague.com/matches
 */
export async function scrapeFixtures(): Promise<Fixture[]> {
  const allFixtures: Fixture[] = [];
  const seenFixtureIds = new Set<string>();
  
  try {
    // Scrape all matchweeks from 1 to 38
    // Stop early if we find 3 consecutive matchweeks with no data
    const maxMatchweek = 38;
    let consecutiveEmpty = 0;
    
    for (let matchweek = 1; matchweek <= maxMatchweek; matchweek++) {
      let page;
      try {
        const url = `https://www.premierleague.com/matches?competition=8&season=2025&matchweek=${matchweek}`;
    
        console.log(`Scraping matchweek ${matchweek}...`);
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
    
    // Extract ALL fixtures from the page, extracting matchweek from each fixture's context
    const fixturesData = await page.evaluate(() => {
      const fixtures: any[] = [];
      
          // Find match cards - but we need to extract matchweek from each card's context
      const matchCards = document.querySelectorAll('.match-card, [class*="match-card"]');
      
      matchCards.forEach((card) => {
        // Find home and away team containers
        const homeTeamContainer = card.querySelector('.match-card__team--home, [class*="team--home"]');
        const awayTeamContainer = card.querySelector('.match-card__team--away, [class*="team--away"]');
        
        if (!homeTeamContainer || !awayTeamContainer) return;
        
            // Extract team names
        const homeTeamFull = homeTeamContainer.querySelector('.match-card__team-name--full, [data-testid="matchCardTeamFullName"]');
        const homeTeam = homeTeamFull?.textContent?.trim() || 
                        homeTeamContainer.querySelector('.match-card__team-name')?.textContent?.trim() || '';
        
        const awayTeamFull = awayTeamContainer.querySelector('.match-card__team-name--full, [data-testid="matchCardTeamFullName"]');
        const awayTeam = awayTeamFull?.textContent?.trim() || 
                        awayTeamContainer.querySelector('.match-card__team-name')?.textContent?.trim() || '';
        
        if (!homeTeam || !awayTeam || homeTeam === awayTeam) return;
        
        // Find score
        const scoreElement = card.querySelector('.match-card__score, [class*="score"], [data-testid*="score"]');
        const scoreText = scoreElement?.textContent?.trim() || '';
        
            // Find date/time
        const dateElement = card.querySelector('time[datetime], [datetime], .match-card__date, [class*="date"]');
        let dateStr = dateElement?.getAttribute('datetime') || 
                     dateElement?.textContent?.trim() || '';
        
            // If no date found, try parent containers
        if (!dateStr) {
          let parent = card.parentElement;
          for (let i = 0; i < 5 && parent; i++) {
            const parentDate = parent.querySelector('time[datetime], [datetime]');
            if (parentDate) {
              dateStr = parentDate.getAttribute('datetime') || parentDate.textContent?.trim() || '';
              break;
            }
            parent = parent.parentElement;
          }
        }
        
            // CRITICAL: Extract matchweek from the card's parent context
            // The website groups fixtures by matchweek sections, so we need to find the section
            let cardMatchweek: number | null = null;
            
            // Try to find matchweek in parent containers (up to 15 levels up to find section headers)
            let parent = card.parentElement;
            for (let i = 0; i < 15 && parent; i++) {
              // Method 1: Check for data attributes
              const mwAttr = parent.getAttribute('data-matchweek') || 
                           parent.getAttribute('data-matchweek-id') ||
                           parent.getAttribute('data-week');
              if (mwAttr) {
                const mw = parseInt(mwAttr);
                if (!isNaN(mw) && mw >= 1 && mw <= 38) {
                  cardMatchweek = mw;
                  break;
                }
              }
              
              // Method 2: Check for matchweek in class names
              const classMatch = parent.className?.match(/matchweek[_-]?(\d+)|week[_-]?(\d+)|mw[_-]?(\d+)/i);
              if (classMatch) {
                const mw = parseInt(classMatch[1] || classMatch[2] || classMatch[3]);
                if (!isNaN(mw) && mw >= 1 && mw <= 38) {
                  cardMatchweek = mw;
                  break;
                }
              }
              
              // Method 3: Check for heading that indicates matchweek (most reliable)
              const heading = parent.querySelector('h1, h2, h3, h4, h5, [class*="heading"], [class*="title"], [class*="header"]');
              if (heading) {
                const headingText = heading.textContent || '';
                const mwMatch = headingText.match(/matchweek\s*(\d+)|week\s*(\d+)|mw\s*(\d+)/i);
                if (mwMatch) {
                  const mw = parseInt(mwMatch[1] || mwMatch[2] || mwMatch[3]);
                  if (!isNaN(mw) && mw >= 1 && mw <= 38) {
                    cardMatchweek = mw;
                    break;
                  }
                }
              }
              
              // Method 4: Check for section with matchweek in id
              const idMatch = parent.id?.match(/matchweek[_-]?(\d+)|week[_-]?(\d+)|mw[_-]?(\d+)/i);
              if (idMatch) {
                const mw = parseInt(idMatch[1] || idMatch[2] || idMatch[3]);
                if (!isNaN(mw) && mw >= 1 && mw <= 38) {
                  cardMatchweek = mw;
                  break;
                }
              }
              
              parent = parent.parentElement;
            }
            
            // If we couldn't find matchweek, skip this fixture (better to skip than assign wrong matchweek)
            if (cardMatchweek === null) {
              console.warn(`Could not determine matchweek for fixture: ${homeTeam} vs ${awayTeam}`);
              return; // Skip this fixture
            }
            
            // Determine status and scores
            let homeScore: number | null = null;
            let awayScore: number | null = null;
            let status: "scheduled" | "live" | "finished" = "scheduled";
            
            // Check for finished match indicators
            const cardText = card.textContent?.toLowerCase() || "";
            const hasScorePattern = scoreText.match(/(\d+)\s*[-]\s*(\d+)/);
            const isLive = scoreText.toLowerCase().includes("live") || cardText.includes("live");
            const hasTimePattern = scoreText.match(/\d{1,2}:\d{2}/) || cardText.match(/\d{1,2}:\d{2}/);
            const isFinished = cardText.includes("ft") || cardText.includes("full time") || 
                              cardText.includes("finished") || card.querySelector('[class*="finished"], [class*="ft"]');
            
            if (hasScorePattern) {
              homeScore = parseInt(hasScorePattern[1]);
              awayScore = parseInt(hasScorePattern[2]);
              // If there's a score and it's marked as finished or not live, it's finished
              if (isFinished || (!isLive && !hasTimePattern)) {
                status = "finished";
              } else if (isLive) {
                status = "live";
              } else {
                // Has score but unclear status - check date to determine
                status = "finished";
              }
            } else if (isLive) {
              status = "live";
              const liveScoreMatch = cardText.match(/(\d+)\s*[-]\s*(\d+)/);
              if (liveScoreMatch) {
                homeScore = parseInt(liveScoreMatch[1]);
                awayScore = parseInt(liveScoreMatch[2]);
              }
            } else if (hasTimePattern) {
              status = "scheduled";
            } else if (isFinished) {
              // Explicitly marked as finished
              status = "finished";
            }
            
            fixtures.push({
              homeTeam,
              awayTeam,
              dateStr,
              homeScore,
              awayScore,
              matchweek: cardMatchweek, // Use matchweek extracted from card context
              status,
            });
          });
      
          return fixtures;
    });
    
        const actualFixtures = fixturesData || [];
        console.log(`Matchweek ${matchweek}: Found ${actualFixtures.length} fixtures (extracted from page context)`);

        // Process and format fixtures for this matchweek
        const fixtures: Fixture[] = [];
    for (const fixtureData of actualFixtures) {
      if (!fixtureData.homeTeam || !fixtureData.awayTeam || fixtureData.homeTeam === fixtureData.awayTeam) {
            continue;
          }
          
          // Validate matchweek
          if (!fixtureData.matchweek || fixtureData.matchweek < 1 || fixtureData.matchweek > 38) {
            console.warn(`Skipping fixture with invalid matchweek: ${fixtureData.homeTeam} vs ${fixtureData.awayTeam} (MW: ${fixtureData.matchweek})`);
            continue;
      }
      
      let date: Date;
      if (fixtureData.dateStr) {
        const parsedDate = parseDate(fixtureData.dateStr);
        if (parsedDate) {
          date = parsedDate;
        } else {
          date = new Date();
        }
      } else {
        date = new Date();
      }
          
          // Improve status detection: if match has scores and date is in the past, it's finished
          let finalStatus = fixtureData.status;
          const now = new Date();
          const matchDate = new Date(date);
          const isPastMatch = matchDate < now;
          
          // If match has scores and is in the past, it's definitely finished
          if (fixtureData.homeScore !== null && fixtureData.awayScore !== null && isPastMatch) {
            finalStatus = "finished";
          }
          // If match is in the past but no score, check if it should be finished
          else if (isPastMatch && fixtureData.status === "scheduled") {
            // Match was scheduled but date has passed - likely finished (even if score not scraped)
            // But only mark as finished if we're confident (e.g., more than 3 hours past match time)
            const hoursSinceMatch = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
            if (hoursSinceMatch > 3) {
              finalStatus = "finished";
            }
          }
          
          // Create unique ID for deduplication
          const fixtureId = `${fixtureData.homeTeam}-${fixtureData.awayTeam}-${date.toISOString()}-${fixtureData.matchweek}`;
          
          // Skip if already seen
          if (seenFixtureIds.has(fixtureId)) {
            continue;
          }
          seenFixtureIds.add(fixtureId);
      
      fixtures.push({
            id: fixtureId,
        date: date.toISOString(),
        homeTeam: fixtureData.homeTeam,
        awayTeam: fixtureData.awayTeam,
        homeScore: fixtureData.homeScore,
        awayScore: fixtureData.awayScore,
        matchweek: fixtureData.matchweek,
            status: finalStatus,
        isDerby: isDerby(fixtureData.homeTeam, fixtureData.awayTeam),
      });
    }

        // Add fixtures from this matchweek to all fixtures
        allFixtures.push(...fixtures);
        
        // Check if we should stop early
    if (fixtures.length === 0) {
          consecutiveEmpty++;
          if (consecutiveEmpty >= 3 && matchweek > 10) {
            console.log(`Stopping early: Found ${consecutiveEmpty} consecutive empty matchweeks`);
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
        console.error(`Error scraping matchweek ${matchweek}:`, error);
        if (page) {
          await page.close();
        }
        // Continue to next matchweek
        continue;
      }
    }

    console.log(`Total fixtures scraped: ${allFixtures.length} from ${new Set(allFixtures.map(f => f.matchweek)).size} matchweeks`);
    
    return allFixtures.sort(
      (a, b) => {
        // Sort by matchweek first, then by date
        if (a.matchweek !== b.matchweek) {
          return a.matchweek - b.matchweek;
      }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
    );
  } catch (error) {
    console.error("Error scraping fixtures:", error);
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
