const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function createTrophyIcons() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Read the SVG content
  const svgContent = fs.readFileSync(path.join(__dirname, '../public/premier-league-trophy.svg'), 'utf8');

  // Create HTML with the SVG
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; padding: 20px; background: transparent; }
        svg { display: block; width: 60px; height: 60px; }
      </style>
    </head>
    <body>
      ${svgContent}
    </body>
    </html>
  `;

  await page.setContent(html);
  await page.setViewport({ width: 100, height: 100 });

  // Take screenshot for trophy logo (100x100 for navbar)
  await page.screenshot({
    path: path.join(__dirname, '../public/premier-league-trophy.png'),
    clip: { x: 20, y: 20, width: 60, height: 60 },
    omitBackground: true
  });

  await browser.close();
  console.log('Trophy icon created successfully!');
}

createTrophyIcons().catch(console.error);