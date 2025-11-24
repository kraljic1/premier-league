const puppeteer = require('puppeteer');

async function testStandings() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('Navigating to Premier League tables...');
    await page.goto('https://www.premierleague.com/tables', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('Waiting for content...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    const result = await page.evaluate(() => {
      const debug = [];
      
      debug.push(`URL: ${window.location.href}`);
      debug.push(`Title: ${document.title}`);
      
      // Check for tables
      const tables = document.querySelectorAll('table');
      debug.push(`Tables found: ${tables.length}`);
      
      // Check for table rows
      const tableRows = document.querySelectorAll('table tbody tr');
      debug.push(`Table rows found: ${tableRows.length}`);
      
      // Check for standings-specific classes
      const standingsElements = document.querySelectorAll('[class*="standing"], [class*="table"], [class*="league"]');
      debug.push(`Standings-related elements: ${standingsElements.length}`);
      
      // Sample some class names
      const sampleClasses = [];
      standingsElements.forEach((el, i) => {
        if (i < 10) {
          sampleClasses.push(el.className);
        }
      });
      debug.push(`Sample classes: ${sampleClasses.join(', ')}`);
      
      // Check body text for team names
      const bodyText = document.body.textContent || '';
      const hasArsenal = bodyText.includes('Arsenal');
      const hasManCity = bodyText.includes('Man City');
      debug.push(`Body contains "Arsenal": ${hasArsenal}`);
      debug.push(`Body contains "Man City": ${hasManCity}`);
      
      // Try to find table structure
      if (tables.length > 0) {
        const firstTable = tables[0];
        const rows = firstTable.querySelectorAll('tbody tr');
        debug.push(`First table has ${rows.length} rows`);
        
        if (rows.length > 0) {
          const firstRow = rows[0];
          const cells = firstRow.querySelectorAll('td');
          debug.push(`First row has ${cells.length} cells`);
          
          if (cells.length > 0) {
            debug.push(`First row HTML (first 500 chars): ${firstRow.innerHTML.substring(0, 500)}`);
          }
        }
      }
      
      return { debug };
    });

    console.log('\n=== STANDINGS DEBUG INFO ===');
    result.debug.forEach(line => console.log(line));
    
    // Take screenshot
    await page.screenshot({ path: 'standings-page.png', fullPage: true });
    console.log('\nScreenshot saved to standings-page.png');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
}

testStandings();

