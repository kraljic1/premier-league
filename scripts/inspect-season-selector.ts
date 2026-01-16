/**
 * Debug script to inspect season selector on SofaScore page
 * Run with: npx tsx scripts/inspect-season-selector.ts
 */

import { scrapePage } from "../lib/scrapers/browser";

async function inspectSeasonSelector() {
  let page;
  
  try {
    console.log("Opening SofaScore Premier League page...");
    const baseUrl = `https://www.sofascore.com/tournament/football/england/premier-league/17`;
    page = await scrapePage(baseUrl, undefined, 30000);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Handle cookie consent
    try {
      const cookieSelectors = [
        'button:has-text("Accept")',
        'button:has-text("I agree")',
        '[id*="accept"]',
        '[class*="accept"]',
        '#onetrust-accept-btn-handler',
        '.onetrust-accept-btn-handler'
      ];
      
      for (const selector of cookieSelectors) {
        try {
          const button = await page.$(selector);
          if (button) {
            await button.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
            break;
          }
        } catch (e) {
          // Continue
        }
      }
    } catch (e) {
      // Ignore
    }
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Scroll to top to find header elements
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("\n=== INSPECTING SEASON SELECTOR ===\n");
    
    // Find all potential season selector elements
    const seasonInfo = await page.evaluate(() => {
      const results: any[] = [];
      
      // Look for buttons with season-like text
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      buttons.forEach((btn, i) => {
        const text = (btn.textContent || '').trim();
        const className = String(btn.className || '');
        const id = btn.id || '';
        
        // Check if it looks like a season selector
        if (text.match(/\d{4}\/\d{4}/) || // e.g., "2024/2025"
            text.match(/\d{2}\/\d{2}/) || // e.g., "24/25"
            text.toLowerCase().includes('season') ||
            className.toLowerCase().includes('season') ||
            id.toLowerCase().includes('season')) {
          const rect = btn.getBoundingClientRect();
          results.push({
            type: 'button',
            index: i,
            text: text.substring(0, 100),
            className: className.substring(0, 100),
            id: id.substring(0, 50),
            visible: rect.width > 0 && rect.height > 0,
            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          });
        }
      });
      
      // Look for dropdowns
      const dropdowns = Array.from(document.querySelectorAll('[class*="dropdown"], select'));
      dropdowns.forEach((dropdown, i) => {
        const text = (dropdown.textContent || '').trim();
        const className = String(dropdown.className || '');
        if (text.match(/\d{4}\/\d{4}/) || text.match(/\d{2}\/\d{2}/) || 
            text.toLowerCase().includes('season')) {
          const rect = dropdown.getBoundingClientRect();
          results.push({
            type: 'dropdown',
            index: i,
            text: text.substring(0, 100),
            className: className.substring(0, 100),
            visible: rect.width > 0 && rect.height > 0,
            position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          });
        }
      });
      
      // Look for text that says "Select season" or similar
      const allElements = Array.from(document.querySelectorAll('*'));
      allElements.forEach((el) => {
        const text = (el.textContent || '').toLowerCase();
        if ((text.includes('select season') || text.includes('season')) && 
            el.tagName !== 'SCRIPT' && el.tagName !== 'STYLE') {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            results.push({
              type: 'text_element',
              tag: el.tagName,
              text: (el.textContent || '').trim().substring(0, 100),
              className: String(el.className || '').substring(0, 100),
              visible: true,
              position: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
            });
          }
        }
      });
      
      return results;
    });
    
    console.log(`Found ${seasonInfo.length} potential season selector elements:\n`);
    
    if (seasonInfo.length === 0) {
      console.log("❌ No season selector found!");
      console.log("\nThis might mean:");
      console.log("1. SofaScore doesn't have a visible season selector");
      console.log("2. Season selection is done via URL parameters only");
      console.log("3. Need to inspect the page manually in a browser");
    } else {
      seasonInfo.forEach((info, i) => {
        console.log(`${i + 1}. ${info.type.toUpperCase()}`);
        console.log(`   Text: "${info.text}"`);
        console.log(`   Class: "${info.className}"`);
        if (info.id) console.log(`   ID: "${info.id}"`);
        console.log(`   Visible: ${info.visible}`);
        console.log(`   Position: (${info.position.x}, ${info.position.y})`);
        console.log('');
      });
    }
    
    // Try to find current season displayed on page
    const currentSeason = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const seasonMatch = text.match(/(\d{4}\/\d{4})/);
      if (seasonMatch) {
        return seasonMatch[1];
      }
      return null;
    });
    
    if (currentSeason) {
      console.log(`\nCurrent season displayed on page: ${currentSeason}`);
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshots/season-selector-inspection.png', fullPage: false });
    console.log("\n✓ Screenshot saved to screenshots/season-selector-inspection.png");
    
  } catch (error: any) {
    console.error("\n❌ Error:", error);
    console.error("Stack:", error.stack);
  } finally {
    if (page) {
      await page.close();
    }
  }
}

inspectSeasonSelector();
