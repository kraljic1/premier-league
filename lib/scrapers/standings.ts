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
        const goalsForEl = row.querySelector('[data-testid*="goalsFor"], [data-testid*="GoalsFor"], [data-testid*="goals-for"], [data-testid*="GF"]');
        const goalsAgainstEl = row.querySelector('[data-testid*="goalsAgainst"], [data-testid*="GoalsAgainst"], [data-testid*="goals-against"], [data-testid*="GA"]');
        const goalDiffEl = row.querySelector('[data-testid*="goalDifference"], [data-testid*="GoalDifference"], [data-testid*="goal-difference"], [data-testid*="GD"]');
        const pointsEl = row.querySelector('[data-testid*="points"], [data-testid*="Points"]');
        
        // Try to find stats by column index in table structure
        const cells = row.querySelectorAll('td');
        const getCellValue = (index: number) => {
          if (cells[index]) {
            const text = cells[index].textContent?.trim() || '';
            const num = parseInt(text);
            return isNaN(num) ? 0 : num;
          }
          return 0;
        };
        
        // Extract numbers from the row text - filter out position numbers
        const allNumbers = allText.match(/\d+/g) || [];
        // Remove position number (usually first number)
        const statsNumbers = allNumbers.slice(1);
        
        const played = playedEl ? parseInt(playedEl.textContent?.trim() || '0') : (getCellValue(2) || parseInt(statsNumbers[0] || '0') || 0);
        const won = wonEl ? parseInt(wonEl.textContent?.trim() || '0') : (getCellValue(3) || parseInt(statsNumbers[1] || '0') || 0);
        const drawn = drawnEl ? parseInt(drawnEl.textContent?.trim() || '0') : (getCellValue(4) || parseInt(statsNumbers[2] || '0') || 0);
        const lost = lostEl ? parseInt(lostEl.textContent?.trim() || '0') : (getCellValue(5) || parseInt(statsNumbers[3] || '0') || 0);
        
        // Goals For and Against - try multiple extraction methods
        let goalsFor = goalsForEl ? parseInt(goalsForEl.textContent?.trim() || '0') : 0;
        let goalsAgainst = goalsAgainstEl ? parseInt(goalsAgainstEl.textContent?.trim() || '0') : 0;
        
        // If not found via data-testid, try cell index (GF is usually 6th column, GA is 7th)
        // But first, let's check all cells to find the right ones
        if (!goalsFor || !goalsAgainst) {
          // Try to find cells by looking for headers in the table
          const headerRow = row.closest('table')?.querySelector('thead tr');
          if (headerRow) {
            const headers = Array.from(headerRow.querySelectorAll('th'));
            const gfIndex = headers.findIndex(h => {
              const text = h.textContent?.toLowerCase() || '';
              return text.includes('gf') || text.includes('goals for') || text.includes('for');
            });
            const gaIndex = headers.findIndex(h => {
              const text = h.textContent?.toLowerCase() || '';
              return text.includes('ga') || text.includes('goals against') || text.includes('against');
            });
            
            if (gfIndex >= 0 && !goalsFor) {
              goalsFor = getCellValue(gfIndex);
            }
            if (gaIndex >= 0 && !goalsAgainst) {
              goalsAgainst = getCellValue(gaIndex);
            }
          }
        }
        
        // Fallback: try cell index (GF is usually 6th column, GA is 7th)
        if (!goalsFor) {
          goalsFor = getCellValue(6) || parseInt(statsNumbers[4] || '0') || 0;
        }
        if (!goalsAgainst) {
          goalsAgainst = getCellValue(7) || parseInt(statsNumbers[5] || '0') || 0;
        }
        
        // Try to extract from text patterns like "40" or "GF: 40"
        if (!goalsFor || !goalsAgainst) {
          const goalsPattern = allText.match(/GF[:\s]*(\d+)|(\d+)[:\s]*GA|(\d+)[:\s]*(\d+)/i);
          if (goalsPattern) {
            if (!goalsFor && goalsPattern[1]) goalsFor = parseInt(goalsPattern[1]);
            if (!goalsAgainst && goalsPattern[2]) goalsAgainst = parseInt(goalsPattern[2]);
            if (!goalsFor && goalsPattern[3]) goalsFor = parseInt(goalsPattern[3]);
            if (!goalsAgainst && goalsPattern[4]) goalsAgainst = parseInt(goalsPattern[4]);
          }
        }
        
        // Debug logging for problematic extractions
        if (played > 0 && (goalsFor === 0 || goalsAgainst === 0)) {
          debug.push(`${club}: Played=${played}, GF=${goalsFor}, GA=${goalsAgainst}, Cells=${cells.length}, Numbers=${statsNumbers.join(',')}`);
        }
        
        // Calculate goal difference if we have goalsFor and goalsAgainst
        let goalDifference = goalDiffEl ? parseInt(goalDiffEl.textContent?.trim() || '0') : 0;
        if (!goalDifference && goalsFor && goalsAgainst) {
          goalDifference = goalsFor - goalsAgainst;
        } else if (!goalDifference) {
          // Try to extract from cell or numbers array
          goalDifference = getCellValue(8) || parseInt(statsNumbers[6] || '0') || 0;
        }
        
        const points = pointsEl ? parseInt(pointsEl.textContent?.trim() || '0') : (getCellValue(9) || parseInt(statsNumbers[statsNumbers.length - 1] || '0') || 0);
        
        // Extract form - look for form indicators (W/D/L results)
        const formElement = row.querySelector('.standings-row__form, [class*="form"], [class*="Form"]');
        let form = '';
        
        if (formElement) {
          // Form items are links with data-testid="teamFormItem" containing divs with score classes
          const formItems = formElement.querySelectorAll('[data-testid="teamFormItem"], .team-form-item, a[href*="match"], [class*="form-item"]');
          
          if (formItems.length > 0) {
            form = Array.from(formItems)
              .slice(0, 6) // Get last 6 results
              .map(item => {
                // Check aria-label first (e.g., "Arsenal vs Crystal Palace. Win" or "... Lose")
                const ariaLabel = item.getAttribute('aria-label') || '';
                if (ariaLabel.includes('Win') || ariaLabel.includes('win') || ariaLabel.includes('Victory')) return 'W';
                if (ariaLabel.includes('Draw') || ariaLabel.includes('draw') || ariaLabel.includes('Tie')) return 'D';
                if (ariaLabel.includes('Lose') || ariaLabel.includes('Loss') || ariaLabel.includes('Defeat') || ariaLabel.includes('lose') || ariaLabel.includes('loss')) return 'L';
                
                // Check title attribute
                const title = item.getAttribute('title') || '';
                if (title.includes('Win') || title.includes('win') || title.includes('Victory')) return 'W';
                if (title.includes('Draw') || title.includes('draw') || title.includes('Tie')) return 'D';
                if (title.includes('Lose') || title.includes('Loss') || title.includes('Defeat') || title.includes('lose') || title.includes('loss')) return 'L';
                
                // Fallback: check class names
                const scoreDiv = item.querySelector('[class*="score"], [class*="result"]');
                const className = (scoreDiv?.className || item.className || '').toLowerCase();
                if (className.includes('--win') || className.includes('win') || className.includes('victory')) return 'W';
                if (className.includes('--draw') || className.includes('draw') || className.includes('tie')) return 'D';
                if (className.includes('--lose') || className.includes('--loss') || className.includes('lose') || className.includes('loss') || className.includes('defeat')) return 'L';
                
                // Check text content
                const text = item.textContent?.trim().toUpperCase() || '';
                if (text === 'W' || text.includes('WIN')) return 'W';
                if (text === 'D' || text.includes('DRAW')) return 'D';
                if (text === 'L' || text.includes('LOSS') || text.includes('LOSE')) return 'L';
                
                return '';
              })
              .filter(f => f !== '')
              .join('');
          } else {
            // Fallback: try to extract from text or other elements
            const formText = formElement.textContent?.trim() || '';
            // Look for patterns like "WWDLW" or "W W D L W"
            const formMatches = formText.match(/[WDL]/g);
            if (formMatches) {
              form = formMatches.slice(0, 6).join('');
            } else {
              // Try to find form in child elements
              const allText = Array.from(formElement.querySelectorAll('*'))
                .map(el => el.textContent?.trim().toUpperCase() || '')
                .join(' ');
              const allMatches = allText.match(/[WDL]/g);
              if (allMatches) {
                form = allMatches.slice(0, 6).join('');
              }
            }
          }
        }
        
        // If still no form found, try looking in the entire row for form indicators
        if (!form) {
          const rowText = row.textContent?.trim().toUpperCase() || '';
          const formPattern = rowText.match(/[WDL]{3,6}/);
          if (formPattern) {
            form = formPattern[0].slice(-6); // Get last 6 characters
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
      
      // Calculate goal difference if we have goalsFor and goalsAgainst
      let goalDifference = standingData.goalDifference;
      if (!goalDifference && standingData.goalsFor !== undefined && standingData.goalsAgainst !== undefined) {
        goalDifference = standingData.goalsFor - standingData.goalsAgainst;
      }
      
      // Validate data - if we have played games but no goals, log a warning
      if (standingData.played > 0 && standingData.goalsFor === 0 && standingData.goalsAgainst === 0) {
        console.warn(`[Standings Scraper] Warning: ${standingData.club} has ${standingData.played} games played but GF/GA are 0. This may indicate extraction failure.`);
      }
      
      standings.push({
        position: standingData.position || standings.length + 1,
        club: standingData.club,
        played: standingData.played || 0,
        won: standingData.won || 0,
        drawn: standingData.drawn || 0,
        lost: standingData.lost || 0,
        goalsFor: standingData.goalsFor ?? 0,
        goalsAgainst: standingData.goalsAgainst ?? 0,
        goalDifference: goalDifference ?? 0,
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

