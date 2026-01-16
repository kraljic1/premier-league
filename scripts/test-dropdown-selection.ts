/**
 * Test script to see what happens when we click the round dropdown
 * This will help us understand the dropdown structure better
 */

import { scrapePage } from "../lib/scrapers/browser";
import { selectMatchweekFromDropdown, getCurrentMatchweek } from "../lib/scrapers/sofascore-navigation";

async function testDropdownSelection() {
  let page;
  
  try {
    console.log("Opening SofaScore Premier League page...");
    const baseUrl = `https://www.sofascore.com/tournament/football/england/premier-league/17`;
    page = await scrapePage(baseUrl, undefined, 30000);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Handle cookie consent more aggressively
    try {
      // Try multiple selectors for cookie/privacy accept buttons
      const cookieSelectors = [
        'button:has-text("Accept")',
        'button:has-text("I agree")',
        '[id*="accept"]',
        '[class*="accept"]',
        'button[aria-label*="accept" i]',
        '#onetrust-accept-btn-handler',
        '.onetrust-accept-btn-handler',
        'button[data-testid*="accept"]'
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
          // Continue to next selector
        }
      }
      
      // Also try to close any modals/overlays via JavaScript
      await page.evaluate(() => {
        // Close any modals
        const modals = document.querySelectorAll('[role="dialog"], [class*="modal"], [class*="overlay"]');
        modals.forEach(modal => {
          const closeBtn = modal.querySelector('button[aria-label*="close" i], button[aria-label*="Close"], [class*="close"]');
          if (closeBtn) {
            (closeBtn as HTMLElement).click();
          }
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (e) {
      // Ignore - dialogs might not be present
    }
    
    console.log("\n=== TESTING DROPDOWN SELECTION ===\n");
    
    const currentMW = await getCurrentMatchweek(page);
    console.log(`Current matchweek: ${currentMW}\n`);
    
    // Test selecting a different matchweek
    const targetMW = currentMW > 1 ? currentMW - 1 : 1;
    console.log(`Attempting to select Round ${targetMW}...\n`);
    
    const success = await selectMatchweekFromDropdown(page, targetMW);
    
    if (success) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const newMW = await getCurrentMatchweek(page);
      console.log(`\n✓ Success! Now at matchweek: ${newMW}`);
      
      if (newMW === targetMW) {
        console.log("✅ Dropdown selection worked correctly!");
      } else {
        console.log(`⚠️  Expected MW ${targetMW}, but got MW ${newMW}`);
      }
    } else {
      console.log("\n❌ Dropdown selection failed");
      console.log("\nLet's inspect what's available after clicking...");
      
      // Click the button and see what appears
      await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button.dropdown__button'));
        for (const button of buttons) {
          const text = button.textContent || '';
          if (text.includes('Round') && /Round\s*\d+/.test(text)) {
            button.click();
            return;
          }
        }
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check what options appeared
      const options = await page.evaluate(() => {
        const allElements = Array.from(document.querySelectorAll('*'));
        const roundOptions = allElements.filter(el => {
          const text = el.textContent || '';
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 &&
                 (text.match(/Round\s*\d+/i) || (text.match(/^\d+$/) && parseInt(text) >= 1 && parseInt(text) <= 38));
        }).slice(0, 20);
        
        return roundOptions.map(el => ({
          tag: el.tagName,
          className: String(el.className || ''),
          text: el.textContent?.trim().substring(0, 50),
          visible: el.getBoundingClientRect().width > 0
        }));
      });
      
      console.log(`\nFound ${options.length} potential round options:`);
      options.forEach((opt, i) => {
        console.log(`  ${i + 1}. ${opt.tag} (${opt.className}) - "${opt.text}"`);
      });
    }
    
  } catch (error: any) {
    console.error("\n❌ Error:", error);
    console.error("Stack:", error.stack);
  } finally {
    if (page) {
      await page.close();
    }
  }
}

testDropdownSelection();
