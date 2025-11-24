const puppeteer = require('puppeteer');

async function testDOM() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  await page.goto('https://www.premierleague.com/matches', {
    waitUntil: 'networkidle2',
    timeout: 30000,
  });
  
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const structure = await page.evaluate(() => {
    // Find elements that might contain match data
    const results = {
      matchContainers: [],
      teamNames: [],
      scores: [],
      dates: [],
    };
    
    // Look for common Premier League team names
    const teamNames = [
      'Arsenal', 'Chelsea', 'Liverpool', 'Man City', 'Man Utd', 'Tottenham', 'Spurs',
      'Newcastle', 'Brighton', 'Brentford', 'Burnley', 'Fulham', 'Sunderland',
      'Nott\'m Forest', 'Wolves', 'Crystal Palace', 'Aston Villa', 'Everton', 'Leeds'
    ];
    
    // Find all text nodes and elements
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null
    );
    
    let node;
    while (node = walker.nextNode()) {
      const text = node.textContent.trim();
      
      // Check for team names
      teamNames.forEach(team => {
        if (text.includes(team)) {
          const parent = node.parentElement;
          if (parent) {
            results.teamNames.push({
              team,
              text: parent.textContent.substring(0, 200),
              className: parent.className,
              tagName: parent.tagName,
            });
          }
        }
      });
      
      // Check for score pattern
      if (text.match(/\d+\s*[-]\s*\d+/)) {
        const parent = node.parentElement;
        if (parent) {
          results.scores.push({
            text: parent.textContent.substring(0, 200),
            className: parent.className,
            tagName: parent.tagName,
          });
        }
      }
      
      // Check for date patterns
      if (text.match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun)\s+\d+\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i)) {
        const parent = node.parentElement;
        if (parent) {
          results.dates.push({
            text: parent.textContent.substring(0, 200),
            className: parent.className,
            tagName: parent.tagName,
          });
        }
      }
    }
    
    return results;
  });
  
  console.log(JSON.stringify(structure, null, 2));
  
  await browser.close();
}

testDOM();

