/**
 * Element extraction utilities for SofaScore scraper
 * Handles extracting data from DOM elements
 */

/**
 * Extracts match results from the current page (DOM evaluation)
 */
export async function extractResultsFromPage(
  page: any,
  matchweek: number,
  seasonYear: number
): Promise<any[]> {
  // Use string evaluation to avoid TypeScript metadata injection
  const extractionCode = `
    (() => {
      const mw = ${matchweek};
      const year = ${seasonYear};
      
      const teamMappings = {
        "Man City": "Manchester City",
        "Man United": "Manchester United",
        "Man Utd": "Manchester United",
        "Tottenham": "Tottenham Hotspur",
        "Spurs": "Tottenham Hotspur",
        "Brighton": "Brighton & Hove Albion",
        "Wolves": "Wolverhampton Wanderers",
        "West Ham": "West Ham United",
        "Newcastle": "Newcastle United",
        "Leeds": "Leeds United",
        "Forest": "Nottingham Forest",
        "Nottingham": "Nottingham Forest",
      };
      
      function mapTeamName(name) {
        const normalized = name.trim();
        return teamMappings[normalized] || normalized;
      }
      
      function extractTeamNames(element, elementText) {
        let homeTeam = '';
        let awayTeam = '';
        
        const homeTeamEl = element.querySelector('[class*="home"], [class*="team"][class*="1"]');
        const awayTeamEl = element.querySelector('[class*="away"], [class*="team"][class*="2"]');
        
        if (homeTeamEl) homeTeam = (homeTeamEl.textContent || '').trim();
        if (awayTeamEl) awayTeam = (awayTeamEl.textContent || '').trim();
        
        if (!homeTeam || !awayTeam) {
          let textForTeams = elementText
            .replace(/\\d{2}\\/\\d{2}\\/\\d{2,4}/g, '')
            .replace(/\\b(FT|HT|LIVE|POSTPONED|CANCELLED)\\b/gi, '')
            .replace(/\\d{4}$/, '')
            .trim();
          
          const directPattern = /([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*(?:\\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur|FC|Utd))?)([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)*(?:\\s+(?:United|City|Albion|Wanderers|Rovers|Athletic|Hotspur|FC|Utd))?)/;
          const match = textForTeams.match(directPattern);
          if (match && match[1] && match[2]) {
            homeTeam = match[1].trim();
            awayTeam = match[2].trim();
          }
        }
        
        if (!homeTeam || !awayTeam || homeTeam === awayTeam || homeTeam.length < 3 || awayTeam.length < 3) {
          return null;
        }
        
        return { 
          homeTeam: mapTeamName(homeTeam), 
          awayTeam: mapTeamName(awayTeam) 
        };
      }
      
      function extractScores(element, elementText) {
        let scoreMatch = elementText.match(/(\\d+)\\s*[-–]\\s*(\\d+)/);
        
        if (!scoreMatch) {
          const endMatch = elementText.match(/(\\d)(\\d)(\\d)(\\d)$/);
          if (endMatch) {
            const homeScore = parseInt(endMatch[1]);
            const awayScore = parseInt(endMatch[3]);
            if (homeScore >= 0 && homeScore <= 20 && awayScore >= 0 && awayScore <= 20) {
              scoreMatch = [null, homeScore.toString(), awayScore.toString()];
            }
          }
        }
        
        if (!scoreMatch || !scoreMatch[1] || !scoreMatch[2]) {
          return null;
        }
        
        const homeScore = parseInt(scoreMatch[1]);
        const awayScore = parseInt(scoreMatch[2]);
        
        if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || homeScore > 20 || awayScore < 0 || awayScore > 20) {
          return null;
        }
        
        return { homeScore, awayScore };
      }
      
      function extractDate(element, matchweek, seasonYear) {
        const elementText = element.textContent || '';
        const dateMatch = elementText.match(/(\\d{2})\\/(\\d{2})\\/(\\d{2,4})/);
        if (dateMatch) {
          const day = parseInt(dateMatch[1]);
          const month = parseInt(dateMatch[2]);
          let year = parseInt(dateMatch[3]);
          if (year < 100) year = 2000 + year;
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
            return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0') + 'T12:00:00Z';
          }
        }
        
        const seasonStartMonth = 8;
        const estimatedMonth = Math.min(12, Math.max(8, Math.floor((matchweek - 1) / 4) + seasonStartMonth));
        const estimatedDay = ((matchweek - 1) % 4) * 7 + 1;
        return seasonYear + '-' + String(estimatedMonth).padStart(2, '0') + '-' + String(Math.min(28, estimatedDay)).padStart(2, '0') + 'T12:00:00Z';
      }
      
      function extractMatchFromElement(element, mw, year) {
        const elementText = element.textContent || '';
        
        if (elementText.length < 10 || !/[A-Z][a-z]+/.test(elementText)) {
          return null;
        }
        
        const teams = extractTeamNames(element, elementText);
        if (!teams) return null;
        
        const scores = extractScores(element, elementText);
        if (!scores) return null;
        
        const dateStr = extractDate(element, mw, year);
        
        return {
          homeTeam: teams.homeTeam,
          awayTeam: teams.awayTeam,
          homeScore: scores.homeScore,
          awayScore: scores.awayScore,
          dateStr: dateStr,
          matchweek: mw,
          status: "finished"
        };
      }
      
      const results = [];
      const matchSelectors = [
        'a[href*="/match/"]',
        'a[class*="event-hl"]',
        'a[class*="event"]',
        '[class*="match"]',
        '[data-testid*="match"]',
        '[class*="fixture"]'
      ];
      
      let matchElements = [];
      
      console.log('[SofaScore Extraction] Searching for match elements...');
      for (const selector of matchSelectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        const filtered = elements.filter(el => {
          const text = el.textContent || '';
          return text.length > 10 && /[A-Z][a-z]+/.test(text);
        });
        console.log('[SofaScore Extraction] Selector "' + selector + '": found ' + elements.length + ' total, ' + filtered.length + ' filtered');
        if (filtered.length > 0) {
          matchElements = filtered;
          console.log('[SofaScore Extraction] ✓ Using selector "' + selector + '" with ' + filtered.length + ' elements');
          break;
        }
      }
      
      if (matchElements.length === 0) {
        console.log('[SofaScore Extraction] ⚠️  No match elements found. Page content sample:');
        const bodyText = document.body.textContent || '';
        console.log('[SofaScore Extraction] Body text length: ' + bodyText.length);
        console.log('[SofaScore Extraction] Body text sample: ' + bodyText.substring(0, 500));
      }
      
      console.log('[SofaScore Extraction] Processing ' + matchElements.length + ' match elements...');
      
      matchElements.forEach((element, index) => {
        try {
          const elementText = element.textContent || '';
          if (index < 10) {
            console.log('[SofaScore Extraction] Element ' + (index + 1) + ' text: ' + elementText.substring(0, 200));
          }
          
          const matchData = extractMatchFromElement(element, mw, year);
          if (matchData) {
            results.push(matchData);
            console.log('[SofaScore Extraction] ✓ Extracted: ' + matchData.homeTeam + ' vs ' + matchData.awayTeam + ' ' + matchData.homeScore + '-' + matchData.awayScore);
          } else if (index < 10) {
            const teams = extractTeamNames(element, elementText);
            const scores = extractScores(element, elementText);
            console.log('[SofaScore Extraction] ✗ Skipped element ' + (index + 1) + ':');
            console.log('  - Teams: ' + (teams ? (teams.homeTeam + ' vs ' + teams.awayTeam) : 'none'));
            console.log('  - Scores: ' + (scores ? (scores.homeScore + '-' + scores.awayScore) : 'none'));
          }
        } catch (error) {
          console.warn('[SofaScore Extraction] Error on element ' + (index + 1) + ':', error);
        }
      });
      
      console.log('[SofaScore Extraction] Total matches extracted: ' + results.length);
      return results;
    })()
  `;
  
  return await page.evaluate(extractionCode);
}
