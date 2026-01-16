/**
 * Detailed inspection of SofaScore dropdown structure
 * This will help us understand how to interact with the round/matchweek dropdown
 */

import { scrapePage } from "../lib/scrapers/browser";

async function inspectDropdown() {
  let page;
  
  try {
    console.log("Opening SofaScore Premier League page...");
    const baseUrl = `https://www.sofascore.com/tournament/football/england/premier-league/17`;
    page = await scrapePage(baseUrl, undefined, 30000);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Handle cookie consent
    try {
      const cookieButton = await page.$('button:has-text("Accept"), [id*="accept"]');
      if (cookieButton) {
        await cookieButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } catch (e) {
      // Ignore
    }
    
    console.log("\n=== DROPDOWN INSPECTION ===\n");
    
    // Find all elements that might be the round dropdown
    const dropdownInfo = await page.evaluate(() => {
      const info: any = {
        dropdowns: [],
        buttons: [],
        selects: []
      };
      
      // Look for dropdowns
      const dropdowns = Array.from(document.querySelectorAll('[class*="dropdown"]'));
      dropdowns.forEach((el, i) => {
        const text = el.textContent || '';
        if (text.toLowerCase().includes('round') || text.toLowerCase().includes('matchweek')) {
          info.dropdowns.push({
            index: i + 1,
            tag: el.tagName,
            className: String(el.className || ''),
            id: el.id || '',
            text: text.substring(0, 100),
            hasChildren: el.children.length,
            children: Array.from(el.children).slice(0, 5).map(child => ({
              tag: child.tagName,
              className: String(child.className || ''),
              text: child.textContent?.substring(0, 50)
            }))
          });
        }
      });
      
      // Look for buttons that might open dropdowns
      const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
      buttons.forEach((btn, i) => {
        const text = btn.textContent || '';
        const className = String(btn.className || '');
        if (text.toLowerCase().includes('round') || 
            className.toLowerCase().includes('dropdown') ||
            className.toLowerCase().includes('select')) {
          info.buttons.push({
            index: i + 1,
            tag: btn.tagName,
            className: className,
            text: text.substring(0, 50),
            ariaLabel: btn.getAttribute('aria-label') || '',
            visible: btn.getBoundingClientRect().width > 0
          });
        }
      });
      
      // Look for select elements
      const selects = Array.from(document.querySelectorAll('select'));
      selects.forEach((sel, i) => {
        const text = sel.textContent || '';
        if (text.toLowerCase().includes('round') || text.toLowerCase().includes('matchweek')) {
          info.selects.push({
            index: i + 1,
            className: String(sel.className || ''),
            id: sel.id || '',
            options: Array.from(sel.options).slice(0, 10).map(opt => ({
              value: opt.value,
              text: opt.text
            }))
          });
        }
      });
      
      return info;
    });
    
    console.log("1. DROPDOWNS WITH 'ROUND' TEXT:");
    if (dropdownInfo.dropdowns.length > 0) {
      dropdownInfo.dropdowns.forEach((dd: any) => {
        console.log(`\n  Dropdown ${dd.index}:`);
        console.log(`    Tag: ${dd.tag}`);
        console.log(`    Class: ${dd.className}`);
        console.log(`    ID: ${dd.id || 'N/A'}`);
        console.log(`    Text: ${dd.text}`);
        console.log(`    Children: ${dd.hasChildren}`);
        if (dd.children.length > 0) {
          console.log(`    First few children:`);
          dd.children.forEach((child: any, idx: number) => {
            console.log(`      ${idx + 1}. ${child.tag} (${child.className}) - "${child.text}"`);
          });
        }
      });
    } else {
      console.log("  No dropdowns found with 'round' text");
    }
    
    console.log("\n2. BUTTONS THAT MIGHT OPEN DROPDOWN:");
    if (dropdownInfo.buttons.length > 0) {
      dropdownInfo.buttons.forEach((btn: any) => {
        console.log(`\n  Button ${btn.index}:`);
        console.log(`    Tag: ${btn.tag}`);
        console.log(`    Class: ${btn.className}`);
        console.log(`    Text: ${btn.text}`);
        console.log(`    Aria Label: ${btn.ariaLabel || 'N/A'}`);
        console.log(`    Visible: ${btn.visible}`);
      });
    } else {
      console.log("  No relevant buttons found");
    }
    
    console.log("\n3. SELECT ELEMENTS:");
    if (dropdownInfo.selects.length > 0) {
      dropdownInfo.selects.forEach((sel: any) => {
        console.log(`\n  Select ${sel.index}:`);
        console.log(`    Class: ${sel.className}`);
        console.log(`    ID: ${sel.id || 'N/A'}`);
        console.log(`    Options (first 10):`);
        sel.options.forEach((opt: any, idx: number) => {
          console.log(`      ${idx + 1}. Value: "${opt.value}", Text: "${opt.text}"`);
        });
      });
    } else {
      console.log("  No select elements found");
    }
    
    // Try to click the dropdown and see what happens
    console.log("\n4. TESTING DROPDOWN CLICK:");
    const clickResult = await page.evaluate(() => {
      // Find dropdown with "Round 22" text
      const dropdowns = Array.from(document.querySelectorAll('[class*="dropdown"], button, [role="button"]'));
      
      for (const dropdown of dropdowns) {
        const text = (dropdown.textContent || '').toLowerCase();
        if (text.includes('round') && text.includes('22')) {
          const rect = dropdown.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Click it
            (dropdown as HTMLElement).click();
            return {
              success: true,
              className: String(dropdown.className || ''),
              text: dropdown.textContent?.substring(0, 50)
            };
          }
        }
      }
      return { success: false };
    });
    
    if (clickResult.success) {
      console.log(`  ✓ Clicked dropdown: ${clickResult.className}`);
      console.log(`    Text: ${clickResult.text}`);
      
      // Wait for dropdown to open
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check what appeared after clicking
      const afterClick = await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll(
          '[role="option"], [class*="option"], li, [class*="item"], [class*="menu"] [class*="item"], [class*="dropdown"] > *'
        ));
        
        return {
          count: options.length,
          options: options.slice(0, 10).map(opt => ({
            text: opt.textContent?.trim().substring(0, 50),
            className: String(opt.className || ''),
            visible: opt.getBoundingClientRect().width > 0
          }))
        };
      });
      
      console.log(`\n  Options found after click: ${afterClick.count}`);
      afterClick.options.forEach((opt: any, idx: number) => {
        console.log(`    ${idx + 1}. "${opt.text}" (${opt.className}) - Visible: ${opt.visible}`);
      });
    } else {
      console.log("  ✗ Could not find/click dropdown");
    }
    
    // Take screenshot
    console.log("\n5. Taking screenshot...");
    await page.screenshot({ path: 'sofascore-dropdown-inspection.png', fullPage: true });
    console.log("  Screenshot saved to: sofascore-dropdown-inspection.png");
    
    console.log("\n=== INSPECTION COMPLETE ===");
    
  } catch (error: any) {
    console.error("\n❌ Error:", error);
    console.error("Stack:", error.stack);
  } finally {
    if (page) {
      await page.close();
    }
  }
}

inspectDropdown();
