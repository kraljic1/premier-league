const puppeteer = require('puppeteer');

async function testFormLosses() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  await page.goto('https://www.premierleague.com/tables', { waitUntil: 'networkidle2', timeout: 30000 });
  await new Promise(r => setTimeout(r, 5000));
  
  const result = await page.evaluate(() => {
    const rows = document.querySelectorAll('.standings-row__container');
    const samples = [];
    
    rows.forEach((row, i) => {
      if (i >= 15) { // Check bottom teams that likely have losses
        const formElement = row.querySelector('.standings-row__form');
        if (formElement) {
          const formItems = formElement.querySelectorAll('[data-testid="teamFormItem"], .team-form-item');
          const formData = Array.from(formItems).slice(0, 6).map(item => {
            const ariaLabel = item.getAttribute('aria-label') || '';
            const scoreDiv = item.querySelector('[class*="score"]');
            const className = scoreDiv?.className || '';
            return {
              ariaLabel,
              className,
            };
          });
          
          const clubEl = row.querySelector('.standings-row__team');
          const club = clubEl?.querySelector('[data-testid*="teamFullName"], .standings-row__team-name--full')?.textContent?.trim() ||
                     clubEl?.querySelector('.standings-row__team-name--short')?.textContent?.trim() || '';
          
          if (club) {
            samples.push({ club, formData });
          }
        }
      }
    });
    
    return samples;
  });
  
  console.log(JSON.stringify(result, null, 2));
  await browser.close();
}

testFormLosses();

