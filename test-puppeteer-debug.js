const puppeteer = require('puppeteer');

async function testScraper() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('Navigating to Premier League matches...');
    await page.goto('https://www.premierleague.com/matches', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('Waiting for content...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Scroll to load content
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });
    await new Promise(resolve => setTimeout(resolve, 2000));
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    await new Promise(resolve => setTimeout(resolve, 1000));

    const result = await page.evaluate(() => {
      const debug = [];
      
      debug.push(`URL: ${window.location.href}`);
      debug.push(`Title: ${document.title}`);
      
      // Check for match cards
      const matchCards = document.querySelectorAll('.match-card, [class*="match-card"]');
      debug.push(`Match cards (.match-card): ${matchCards.length}`);
      
      // Check for team names
      const teamNames = document.querySelectorAll('.match-card__team-name');
      debug.push(`Team names (.match-card__team-name): ${teamNames.length}`);
      
      // Check for match list container
      const matchList = document.querySelector('.match-list-root, [class*="match-list"]');
      debug.push(`Match list container: ${!!matchList}`);
      
      // Check for any elements with "match" in class
      const allMatchElements = document.querySelectorAll('[class*="match"]');
      debug.push(`All elements with "match" in class: ${allMatchElements.length}`);
      
      // Sample some class names
      const sampleClasses = [];
      allMatchElements.forEach((el, i) => {
        if (i < 10) {
          sampleClasses.push(el.className);
        }
      });
      debug.push(`Sample classes: ${sampleClasses.join(', ')}`);
      
      // Check body text for team names
      const bodyText = document.body.textContent || '';
      const hasArsenal = bodyText.includes('Arsenal');
      const hasChelsea = bodyText.includes('Chelsea');
      debug.push(`Body contains "Arsenal": ${hasArsenal}`);
      debug.push(`Body contains "Chelsea": ${hasChelsea}`);
      
      // Try to find any table or list structure
      const tables = document.querySelectorAll('table');
      debug.push(`Tables found: ${tables.length}`);
      
      const lists = document.querySelectorAll('ul, ol');
      debug.push(`Lists found: ${lists.length}`);
      
      return { debug };
    });

    console.log('\n=== DEBUG INFO ===');
    result.debug.forEach(line => console.log(line));
    
    // Take screenshot for inspection
    await page.screenshot({ path: 'premier-league-page.png', fullPage: true });
    console.log('\nScreenshot saved to premier-league-page.png');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
  }
}

testScraper();

