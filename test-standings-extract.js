const puppeteer = require('puppeteer');

async function testExtract() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  await page.goto('https://www.premierleague.com/tables', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll('.standings-row__container, table tbody tr');
    const samples = [];
    
    rows.forEach((row, i) => {
      if (i < 3) {
        const teamBadge = row.querySelector('.standings-row__team-badge');
        const fullName = teamBadge?.querySelector('[data-testid*="teamFullName"], .standings-row__team-name--full');
        const shortName = teamBadge?.querySelector('.standings-row__team-name--short');
        const anyName = teamBadge?.querySelector('[class*="team-name"]');
        
        samples.push({
          index: i,
          fullName: fullName?.textContent?.trim(),
          shortName: shortName?.textContent?.trim(),
          anyName: anyName?.textContent?.trim(),
          badgeText: teamBadge?.textContent?.trim(),
          badgeHTML: teamBadge?.innerHTML.substring(0, 300),
        });
      }
    });
    
    return samples;
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

testExtract();

