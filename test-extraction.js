const puppeteer = require('puppeteer');

async function testExtraction() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto('https://www.premierleague.com/matches', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    await new Promise(resolve => setTimeout(resolve, 5000));
    
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await page.evaluate(() => {
      const fixtures = [];
      const debug = [];
      
      // Get matchweek from URL
      const urlMatch = window.location.href.match(/matchweek[=\/](\d+)/i);
      const matchweek = urlMatch ? parseInt(urlMatch[1]) : 1;
      
      // Find match cards
      const matchCards = document.querySelectorAll('.match-card, [class*="match-card"]');
      debug.push(`Total match cards found: ${matchCards.length}`);
      
      matchCards.forEach((card, index) => {
        if (index < 5) { // Only process first 5 for debugging
          const teamNames = card.querySelectorAll('.match-card__team-name');
          debug.push(`Card ${index}: Found ${teamNames.length} team names`);
          
          if (teamNames.length >= 2) {
            const homeTeam = teamNames[0]?.textContent?.trim() || '';
            const awayTeam = teamNames[1]?.textContent?.trim() || '';
            
            debug.push(`  Home: "${homeTeam}", Away: "${awayTeam}"`);
            
            if (homeTeam && awayTeam) {
              const scoreElement = card.querySelector('.match-card__score, [class*="score"]');
              const scoreText = scoreElement?.textContent?.trim() || '';
              debug.push(`  Score text: "${scoreText}"`);
              
              const dateElement = card.querySelector('time, [datetime], .match-card__date, [class*="date"]');
              const dateStr = dateElement?.getAttribute('datetime') || 
                             dateElement?.textContent?.trim() || '';
              debug.push(`  Date: "${dateStr}"`);
              
              // Show full card HTML structure
              debug.push(`  Card HTML (first 200 chars): ${card.innerHTML.substring(0, 200)}`);
              
              fixtures.push({
                homeTeam,
                awayTeam,
                dateStr,
                scoreText,
                matchweek,
              });
            }
          } else {
            debug.push(`  Card ${index} HTML (first 300 chars): ${card.innerHTML.substring(0, 300)}`);
          }
        }
      });
      
      return { fixtures, debug };
    });

    console.log('\n=== EXTRACTION DEBUG ===');
    result.debug.forEach(line => console.log(line));
    console.log(`\n=== EXTRACTED FIXTURES (first 5) ===`);
    result.fixtures.forEach((f, i) => {
      console.log(`${i + 1}. ${f.homeTeam} vs ${f.awayTeam} - Score: "${f.scoreText}" - Date: "${f.dateStr}"`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

testExtraction();

