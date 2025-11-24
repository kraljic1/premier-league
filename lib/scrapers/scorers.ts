import { Scorer } from "../types";
import { scrapePage } from "./browser";

export async function scrapeScorers(): Promise<Scorer[]> {
  let goalsPage;
  let assistsPage;
  try {
    const goalsUrl = "https://www.premierleague.com/stats/top/players/goals";
    const assistsUrl = "https://www.premierleague.com/stats/top/players/goal_assist";
    
    // Fetch goals page
    goalsPage = await scrapePage(goalsUrl, "table", 30000);
    
    const scorersMap = new Map<string, Scorer>();

    // Extract goals data
    const goalsData = await goalsPage.evaluate(() => {
      const scorers: any[] = [];
      
      const selectors = [
        'table tbody tr',
        '[class*="stats"] tbody tr',
        '[class*="table"] tbody tr',
        'tbody tr',
      ];

      for (const selector of selectors) {
        const rows = document.querySelectorAll(selector);
        if (rows.length > 0) {
          rows.forEach((row) => {
            // Skip header rows
            if (row.querySelector('th')) return;

            const cells = Array.from(row.querySelectorAll('td'));
            if (cells.length < 3) return;

            // Extract player name
            const nameElement = row.querySelector('[class*="player"], [class*="Player"]') || cells[0];
            const name = nameElement?.textContent?.trim() || "";
            
            // Extract club
            const clubElement = row.querySelector('[class*="club"], [class*="team"], [class*="Club"]') || cells[1];
            const club = clubElement?.textContent?.trim() || "";
            
            // Extract goals (usually last cell)
            const goalsText = cells[cells.length - 1]?.textContent?.trim() || "0";
            const goals = parseInt(goalsText) || 0;

            if (name && club) {
              scorers.push({ name, club, goals });
            }
          });
          
          if (scorers.length > 0) break;
        }
      }

      return scorers;
    });

    // Add goals to map
    for (const scorer of goalsData.slice(0, 20)) {
      scorersMap.set(scorer.name, {
        name: scorer.name,
        club: scorer.club,
        goals: scorer.goals,
        assists: 0,
      });
    }

    // Fetch assists page
    try {
      assistsPage = await scrapePage(assistsUrl, "table", 30000);
      
      const assistsData = await assistsPage.evaluate(() => {
        const assists: any[] = [];
        
        const selectors = [
          'table tbody tr',
          '[class*="stats"] tbody tr',
          '[class*="table"] tbody tr',
          'tbody tr',
        ];

        for (const selector of selectors) {
          const rows = document.querySelectorAll(selector);
          if (rows.length > 0) {
            rows.forEach((row) => {
              // Skip header rows
              if (row.querySelector('th')) return;

              const cells = Array.from(row.querySelectorAll('td'));
              if (cells.length < 2) return;

              // Extract player name
              const nameElement = row.querySelector('[class*="player"], [class*="Player"]') || cells[0];
              const name = nameElement?.textContent?.trim() || "";
              
              // Extract assists (usually last cell)
              const assistsText = cells[cells.length - 1]?.textContent?.trim() || "0";
              const assists = parseInt(assistsText) || 0;

              if (name) {
                assists.push({ name, assists });
              }
            });
            
            if (assists.length > 0) break;
          }
        }

        return assists;
      });

      // Merge assists data
      for (const assistData of assistsData) {
        if (scorersMap.has(assistData.name)) {
          const scorer = scorersMap.get(assistData.name)!;
          scorer.assists = assistData.assists;
        }
      }
    } catch (error) {
      console.error("Error fetching assists page:", error);
      // Continue without assists data
    }

    if (scorersMap.size === 0) {
      console.warn("No scorers found. The website structure may have changed.");
    }

    return Array.from(scorersMap.values())
      .sort((a, b) => b.goals - a.goals)
      .slice(0, 20);
  } catch (error) {
    console.error("Error scraping scorers:", error);
    return [];
  } finally {
    if (goalsPage) {
      await goalsPage.close();
    }
    if (assistsPage) {
      await assistsPage.close();
    }
  }
}

