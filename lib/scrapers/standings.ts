import { Standing } from "../types";
import { scrapePage } from "./browser";

export async function scrapeStandings(): Promise<Standing[]> {
  let page;
  try {
    const url = "https://www.premierleague.com/tables";
    
    page = await scrapePage(url, "table", 30000);
    
    const standings: Standing[] = [];

    // Extract standings from the rendered page
    const standingsData = await page.evaluate(() => {
      const standings: any[] = [];
      const debug: string[] = [];
      
      // Find standings table rows - they use standings-row__container
      const rows = document.querySelectorAll('.standings-row__container, table tbody tr, [class*="standings-row"]');
      debug.push(`Found ${rows.length} standings rows`);
      
      rows.forEach((row, index) => {
        // Skip header rows
        if (row.querySelector('th')) return;

        // Extract position
        const positionElement = row.querySelector('[data-testid="standingsRowPosition"], .standings-row__position');
        const position = positionElement ? parseInt(positionElement.textContent?.trim() || '0') : index + 1;
        
        // Extract club name - the structure has team name elements
        const teamSection = row.querySelector('.standings-row__team');
        let club = '';
        
        // Try multiple approaches to get team name
        const teamNameFull = teamSection?.querySelector('[data-testid*="teamFullName"], .standings-row__team-name--full');
        const teamNameShort = teamSection?.querySelector('.standings-row__team-name--short');
        const teamNameAny = teamSection?.querySelector('.standings-row__team-name');
        
        // Prefer full name, fallback to short name, then any name
        if (teamNameFull) {
          club = teamNameFull.textContent?.trim() || '';
        } else if (teamNameShort) {
          club = teamNameShort.textContent?.trim() || '';
        } else if (teamNameAny) {
          club = teamNameAny.textContent?.trim() || '';
        }
        
        // If we got text with duplicates like "ArsenalArsenal", extract the unique part
        if (club) {
          // Check if it's a duplicate (first half equals second half)
          const half = Math.floor(club.length / 2);
          if (half > 0 && club.substring(0, half) === club.substring(half)) {
            club = club.substring(0, half);
          }
          // Remove any numbers at the end
          club = club.replace(/\d+$/, '').trim();
        }
        
        // If still no club name, try extracting from row text using known team names
        if (!club || club.length < 3) {
          const rowText = row.textContent || '';
          const knownTeams = ['Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man Utd', 'Tottenham', 'Newcastle', 'Brighton', 'Brentford', 'Burnley', 'Fulham', 'Sunderland', 'Nott\'m Forest', 'Wolves', 'Crystal Palace', 'Aston Villa', 'Everton', 'Leeds', 'West Ham', 'Bournemouth'];
          for (const team of knownTeams) {
            if (rowText.includes(team)) {
              club = team;
              break;
            }
          }
        }
        
        if (!club || club.length < 3) return; // Skip if no valid club name
        
        // Extract stats - look for data attributes or specific classes
        const statsElements = row.querySelectorAll('[data-testid*="played"], [data-testid*="won"], [data-testid*="drawn"], [data-testid*="lost"], [data-testid*="goals"], [data-testid*="points"]');
        
        // Try to find stats in order: played, won, drawn, lost, goalsFor, goalsAgainst, goalDifference, points
        const allText = row.textContent || '';
        
        // Extract numbers from the row - they're usually in a specific order
        const numbers = allText.match(/\d+/g) || [];
        
        // Try to find stats using data-testid attributes
        const playedEl = row.querySelector('[data-testid*="played"], [data-testid*="Played"]');
        const wonEl = row.querySelector('[data-testid*="won"], [data-testid*="Won"]');
        const drawnEl = row.querySelector('[data-testid*="drawn"], [data-testid*="Drawn"]');
        const lostEl = row.querySelector('[data-testid*="lost"], [data-testid*="Lost"]');
        const goalsForEl = row.querySelector('[data-testid*="goalsFor"], [data-testid*="GoalsFor"]');
        const goalsAgainstEl = row.querySelector('[data-testid*="goalsAgainst"], [data-testid*="GoalsAgainst"]');
        const goalDiffEl = row.querySelector('[data-testid*="goalDifference"], [data-testid*="GoalDifference"]');
        const pointsEl = row.querySelector('[data-testid*="points"], [data-testid*="Points"]');
        
        const played = playedEl ? parseInt(playedEl.textContent?.trim() || '0') : (parseInt(numbers[1] || '0') || 0);
        const won = wonEl ? parseInt(wonEl.textContent?.trim() || '0') : (parseInt(numbers[2] || '0') || 0);
        const drawn = drawnEl ? parseInt(drawnEl.textContent?.trim() || '0') : (parseInt(numbers[3] || '0') || 0);
        const lost = lostEl ? parseInt(lostEl.textContent?.trim() || '0') : (parseInt(numbers[4] || '0') || 0);
        const goalsFor = goalsForEl ? parseInt(goalsForEl.textContent?.trim() || '0') : (parseInt(numbers[5] || '0') || 0);
        const goalsAgainst = goalsAgainstEl ? parseInt(goalsAgainstEl.textContent?.trim() || '0') : (parseInt(numbers[6] || '0') || 0);
        const goalDifference = goalDiffEl ? parseInt(goalDiffEl.textContent?.trim() || '0') : (goalsFor - goalsAgainst);
        const points = pointsEl ? parseInt(pointsEl.textContent?.trim() || '0') : (parseInt(numbers[numbers.length - 1] || '0') || 0);
        
        // Extract form - look for form indicators (W/D/L results)
        const formElement = row.querySelector('.standings-row__form, [class*="form"]');
        let form = '';
        
        if (formElement) {
          // Form items are links with data-testid="teamFormItem" containing divs with score classes
          const formItems = formElement.querySelectorAll('[data-testid="teamFormItem"], .team-form-item');
          
          if (formItems.length > 0) {
            form = Array.from(formItems)
              .slice(0, 6) // Get last 6 results
              .map(item => {
                // Check aria-label first (e.g., "Arsenal vs Crystal Palace. Win" or "... Lose")
                const ariaLabel = item.getAttribute('aria-label') || '';
                if (ariaLabel.includes('Win')) return 'W';
                if (ariaLabel.includes('Draw')) return 'D';
                if (ariaLabel.includes('Lose') || ariaLabel.includes('Loss') || ariaLabel.includes('Defeat')) return 'L';
                
                // Fallback: check class names
                const scoreDiv = item.querySelector('[class*="score"]');
                const className = scoreDiv?.className || '';
                if (className.includes('--win') || className.includes('win')) return 'W';
                if (className.includes('--draw') || className.includes('draw')) return 'D';
                if (className.includes('--lose') || className.includes('--loss') || className.includes('lose') || className.includes('loss')) return 'L';
                
                return '';
              })
              .filter(f => f !== '')
              .join('');
          } else {
            // Fallback: try to extract from text or other elements
            const formText = formElement.textContent?.trim() || '';
            form = formText.slice(0, 6).replace(/[^WDL]/g, '');
          }
        }
        
        standings.push({
          position,
          club,
          played,
          won,
          drawn,
          lost,
          goalsFor,
          goalsAgainst,
          goalDifference,
          points,
          form,
        });
      });
      
      debug.push(`Extracted ${standings.length} standings`);
      if (standings.length > 0) {
        debug.push(`Sample: ${standings[0].club} - Position ${standings[0].position}, Points: ${standings[0].points}`);
      }
      
      return { standings, debug };
    });
    
    // Log debug info
    if (standingsData.debug) {
      console.log('Standings scraper debug:', standingsData.debug.join('\n'));
    }
    
    const actualStandings = standingsData.standings || standingsData;

    // Process and format standings, removing duplicates
    const seenClubs = new Set<string>();
    
    for (const standingData of actualStandings) {
      if (!standingData.club || standingData.club.length < 3) continue;
      
      // Skip duplicates based on club name
      if (seenClubs.has(standingData.club)) continue;
      seenClubs.add(standingData.club);
      
      standings.push({
        position: standingData.position || standings.length + 1,
        club: standingData.club,
        played: standingData.played || 0,
        won: standingData.won || 0,
        drawn: standingData.drawn || 0,
        lost: standingData.lost || 0,
        goalsFor: standingData.goalsFor || 0,
        goalsAgainst: standingData.goalsAgainst || 0,
        goalDifference: standingData.goalDifference || (standingData.goalsFor - standingData.goalsAgainst) || 0,
        points: standingData.points || 0,
        form: standingData.form || '',
      });
    }
    
    // Sort by position to ensure correct order
    standings.sort((a, b) => a.position - b.position);
    
    console.log(`Processed ${standings.length} standings`);

    if (standings.length === 0) {
      console.warn("No standings found. The website structure may have changed.");
    }

    return standings;
  } catch (error) {
    console.error("Error scraping standings:", error);
    return [];
  } finally {
    if (page) {
      await page.close();
    }
  }
}

