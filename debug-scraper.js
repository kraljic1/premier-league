const puppeteer = require('puppeteer');

async function debugScraper() {
  const browser = await puppeteer.launch({
    headless: false, // Show browser for debugging
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('Navigating to matches page...');
    await page.goto('https://www.premierleague.com/matches', {
      waitUntil: 'networkidle2',
      timeout: 30000,
    });

    console.log('Waiting for content to load...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get page info
    const pageInfo = await page.evaluate(() => {
      return {
        title: document.title,
        bodyClasses: document.body.className,
        url: window.location.href,
        // Find all elements with "match" in class name
        matchElements: Array.from(document.querySelectorAll('[class*="match"], [class*="Match"], [class*="fixture"], [class*="Fixture"]')).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: el.textContent?.substring(0, 100),
        })),
        // Find tables
        tables: Array.from(document.querySelectorAll('table')).map((table, i) => ({
          index: i,
          className: table.className,
          rows: table.querySelectorAll('tbody tr').length,
        })),
        // Find any data attributes
        dataAttributes: Array.from(document.querySelectorAll('[data-match], [data-fixture], [data-match-id]')).map(el => ({
          tagName: el.tagName,
          attributes: Array.from(el.attributes).map(attr => `${attr.name}="${attr.value}"`),
        })),
      };
    });

    console.log('\n=== PAGE INFO ===');
    console.log('Title:', pageInfo.title);
    console.log('URL:', pageInfo.url);
    console.log('Body Classes:', pageInfo.bodyClasses);
    
    console.log('\n=== MATCH ELEMENTS FOUND ===');
    console.log('Count:', pageInfo.matchElements.length);
    if (pageInfo.matchElements.length > 0) {
      pageInfo.matchElements.slice(0, 5).forEach((el, i) => {
        console.log(`\nElement ${i + 1}:`);
        console.log('  Tag:', el.tagName);
        console.log('  Class:', el.className);
        console.log('  Text:', el.textContent);
      });
    }

    console.log('\n=== TABLES FOUND ===');
    console.log('Count:', pageInfo.tables.length);
    pageInfo.tables.forEach(table => {
      console.log(`Table ${table.index}:`, table.className, `(${table.rows} rows)`);
    });

    console.log('\n=== DATA ATTRIBUTES ===');
    console.log('Count:', pageInfo.dataAttributes.length);
    pageInfo.dataAttributes.slice(0, 3).forEach((el, i) => {
      console.log(`Element ${i + 1}:`, el.tagName, el.attributes.join(', '));
    });

    // Take a screenshot
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('\nScreenshot saved to debug-screenshot.png');

    // Keep browser open for manual inspection
    console.log('\nBrowser will stay open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

debugScraper();

