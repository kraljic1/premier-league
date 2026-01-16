/**
 * Test script to see what season options are available in the dropdown
 * Run with: npx tsx scripts/test-season-dropdown.ts
 */

import { scrapePage } from "../lib/scrapers/browser";

async function testSeasonDropdown() {
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
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("\n=== CLICKING SEASON DROPDOWN ===\n");
    
    // Click the season dropdown button
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.dropdown__button'));
      for (const button of buttons) {
        const text = (button.textContent || '').trim();
        const parent = button.closest('[class*="dropdown"]');
        const parentText = parent ? (parent.textContent || '').toLowerCase() : '';
        
        if ((text.match(/\d{2}\/\d{2}/) || text.match(/\d{4}\/\d{4}/) || 
             parentText.includes('select season')) &&
            String(button.className || '').includes('dropdown__button')) {
          const rect = button.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            button.scrollIntoView({ behavior: 'smooth', block: 'center' });
            (button as HTMLElement).click();
            return true;
          }
        }
      }
      return false;
    });
    
    if (!clicked) {
      console.log("❌ Could not click season dropdown");
      return;
    }
    
    console.log("✓ Clicked season dropdown, waiting for options to appear...\n");
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now find all available season options
    const seasonOptions = await page.evaluate(() => {
      const selectors = [
        '[class*="dropdown"] [class*="item"]',
        '[class*="menu"] [class*="item"]',
        '[role="option"]',
        '[class*="option"]',
        'li[class*="item"]',
        'button[class*="item"]',
        '[class*="dropdown"] button',
        '[class*="dropdown"] li'
      ];
      
      const allOptions: any[] = [];
      
      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        elements.forEach(el => {
          const text = (el.textContent || '').trim();
          const rect = el.getBoundingClientRect();
          
          // Check if it looks like a season option
          if (rect.width > 0 && rect.height > 0 && 
              (text.match(/\d{2}\/\d{2}/) || text.match(/\d{4}\/\d{4}/) || 
               text.match(/\d{4}/))) {
            allOptions.push({
              tag: el.tagName,
              text: text.substring(0, 50),
              className: String(el.className || '').substring(0, 100),
              visible: true,
              position: { x: rect.x, y: rect.y }
            });
          }
        });
      }
      
      // Remove duplicates based on text
      const uniqueOptions = Array.from(
        new Map(allOptions.map(opt => [opt.text, opt])).values()
      );
      
      return uniqueOptions;
    });
    
    console.log(`Found ${seasonOptions.length} season options:\n`);
    
    if (seasonOptions.length === 0) {
      console.log("❌ No season options found!");
      console.log("\nThe dropdown might not have opened, or options are loaded dynamically.");
    } else {
      seasonOptions.forEach((opt, i) => {
        console.log(`${i + 1}. "${opt.text}"`);
        console.log(`   Tag: ${opt.tag}, Class: "${opt.className.substring(0, 50)}"`);
        console.log('');
      });
    }
    
    // Take a screenshot
    await page.screenshot({ path: 'screenshots/season-dropdown-open.png', fullPage: false });
    console.log("✓ Screenshot saved to screenshots/season-dropdown-open.png");
    
  } catch (error: any) {
    console.error("\n❌ Error:", error);
    console.error("Stack:", error.stack);
  } finally {
    if (page) {
      await page.close();
    }
  }
}

testSeasonDropdown();
