/**
 * Navigation utilities for SofaScore scraper
 * Handles navigating to seasons and matchweeks
 */

/**
 * Navigates to a specific season on SofaScore
 * SofaScore URL format: https://www.sofascore.com/tournament/football/england/premier-league/17#id:XXXXX
 * The ID changes per season, so we need to find it or use the season selector
 */
export async function navigateToSeason(page: any, seasonYear: number): Promise<void> {
  try {
    const seasonStr = `${seasonYear}/${seasonYear + 1}`;
    const seasonShort = `${seasonYear.toString().slice(-2)}/${(seasonYear + 1).toString().slice(-2)}`; // e.g., "23/24"
    console.log(`[SofaScore Navigation] Attempting to navigate to season ${seasonStr}...`);
    
    // Scroll to top to find season selector (usually in header)
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Find season selector button - SofaScore uses button.dropdown__button with season text
    const seasonButton = await page.evaluate((year: number, season: string, short: string) => {
      // Look for dropdown buttons (same pattern as round dropdown)
      const buttons = Array.from(document.querySelectorAll('button.dropdown__button'));
      
      for (const button of buttons) {
        const text = (button.textContent || '').trim();
        const className = String(button.className || '');
        
        // Check if this button shows a season format (e.g., "25/26", "2024/2025")
        // Also check parent for "Select season" text
        const parent = button.closest('[class*="dropdown"]');
        const parentText = parent ? (parent.textContent || '').toLowerCase() : '';
        
        if ((text.match(/\d{2}\/\d{2}/) || text.match(/\d{4}\/\d{4}/) || 
             parentText.includes('select season') || parentText.includes('season')) &&
            className.includes('dropdown__button')) {
          const rect = button.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            return {
              found: true,
              text: text.substring(0, 50),
              className: className.substring(0, 50)
            };
          }
        }
      }
      
      return { found: false };
    }, seasonYear, seasonStr, seasonShort);
    
    if (!seasonButton.found) {
      console.log("[SofaScore Navigation] Season selector button not found");
      return;
    }
    
    console.log(`[SofaScore Navigation] Found season selector: "${seasonButton.text}"`);
    
    // Click the season selector button (same pattern as round dropdown)
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.dropdown__button'));
      for (const button of buttons) {
        const text = (button.textContent || '').trim();
        const parent = button.closest('[class*="dropdown"]');
        const parentText = parent ? (parent.textContent || '').toLowerCase() : '';
        
        // Check if this is the season dropdown (has season format or "select season" text)
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
      console.log("[SofaScore Navigation] Could not click season selector");
      return;
    }
    
    // Wait for dropdown to appear (longer wait for season dropdown)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Find and click the target season option (same pattern as round dropdown)
    const seasonSelected = await page.evaluate((targetSeason: string, targetShort: string, targetYear: number) => {
      // Look for options in dropdown - prioritize li.dropdown__listItem (SofaScore's season options)
      const selectors = [
        'li.dropdown__listItem', // Primary selector for season options
        '[class*="dropdown"] li[class*="listItem"]',
        '[class*="dropdown"] [class*="item"]',
        '[class*="menu"] [class*="item"]',
        '[role="option"]',
        '[class*="option"]',
        'li[class*="item"]',
        'button[class*="item"]',
        '[class*="dropdown"] button',
        '[class*="dropdown"] li'
      ];
      
      let options: Element[] = [];
      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        const filtered = elements.filter(el => {
          const text = (el.textContent || '').trim();
          const rect = el.getBoundingClientRect();
          // Match any season-like format (e.g., "23/24", "2023/2024")
          return rect.width > 0 && rect.height > 0 && 
                 (text.match(/^\d{2}\/\d{2}$/) || text.match(/^\d{4}\/\d{4}$/) || 
                  text.match(/^\d{4}$/));
        });
        if (filtered.length > 0) {
          options = filtered;
          break;
        }
      }
      
      console.log(`[Season Selection] Found ${options.length} potential season options`);
      
      // Extract year from short format (e.g., "23/24" -> 2023)
      const shortYear = targetShort.split('/')[0];
      const fullYear = targetYear.toString();
      const lastTwoDigits = fullYear.slice(-2);
      
      // Try multiple matching strategies
      for (const option of options) {
        const text = (option.textContent || '').trim();
        
        // Strategy 1: Exact match (most reliable - e.g., "23/24")
        if (text === targetShort || text === targetSeason) {
          console.log(`[Season Selection] ✓ Exact match found: "${text}"`);
          option.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Click the li element directly or find button inside
          const clickable = option.tagName === 'BUTTON' ? option : 
                          option.querySelector('button') || 
                          option.closest('button') || 
                          option;
          (clickable as HTMLElement).click();
          return true;
        }
        
        // Strategy 2: Match short format (e.g., "23/24")
        const shortMatch = text.match(/^(\d{2})\/(\d{2})$/);
        if (shortMatch && shortMatch[1] === shortYear) {
          console.log(`[Season Selection] ✓ Short format match found: "${text}"`);
          option.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const clickable = option.tagName === 'BUTTON' ? option : 
                          option.querySelector('button') || 
                          option.closest('button') || 
                          option;
          (clickable as HTMLElement).click();
          return true;
        }
        
        // Strategy 3: Contains match (fallback)
        if (text.includes(targetShort) || text.includes(targetSeason)) {
          console.log(`[Season Selection] ✓ Contains match found: "${text}"`);
          option.scrollIntoView({ behavior: 'smooth', block: 'center' });
          const clickable = option.tagName === 'BUTTON' ? option : 
                          option.querySelector('button') || 
                          option.closest('button') || 
                          option;
          (clickable as HTMLElement).click();
          return true;
        }
      }
      
      // Log available options for debugging
      console.log(`[Season Selection] Available options:`, options.map(opt => (opt.textContent || '').trim()).slice(0, 10));
      
      return false;
    }, seasonStr, seasonShort, seasonYear);
    
    if (seasonSelected) {
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page to load new season
      console.log(`[SofaScore Navigation] ✓ Successfully navigated to season ${seasonStr}`);
    } else {
      console.log(`[SofaScore Navigation] Could not find season ${seasonStr} in dropdown`);
    }
  } catch (error) {
    console.warn("[SofaScore Navigation] Could not navigate to specific season, continuing with current page:", error);
  }
}

/**
 * Navigates to a specific matchweek using dropdown
 * SofaScore uses a dropdown to select rounds/matchweeks
 */
export async function navigateToMatchweek(page: any, targetMatchweek: number): Promise<void> {
  try {
    let currentMatchweek = await getCurrentMatchweek(page);
    
    if (currentMatchweek === targetMatchweek) {
      return;
    }
    
    console.log(`[SofaScore Navigation] Navigating from MW ${currentMatchweek} to MW ${targetMatchweek}...`);
    
    // Try dropdown method first (most reliable for SofaScore)
    const dropdownSuccess = await selectMatchweekFromDropdown(page, targetMatchweek);
    
    if (dropdownSuccess) {
      // Longer wait after dropdown navigation
      await new Promise(resolve => setTimeout(resolve, 2500));
      const newMatchweek = await getCurrentMatchweek(page);
      if (newMatchweek === targetMatchweek) {
        console.log(`[SofaScore Navigation] ✓ Successfully navigated to MW ${targetMatchweek} via dropdown`);
        return;
      }
    }
    
    // Fallback: Try button navigation
    console.log(`[SofaScore Navigation] Dropdown method failed, trying button navigation...`);
    const maxAttempts = 50;
    let attempts = 0;
    
    // Navigate backwards (from higher to lower matchweek)
    while (currentMatchweek > targetMatchweek && attempts < maxAttempts) {
      attempts++;
      
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const beforeMatchweek = currentMatchweek;
      await clickPreviousMatchweek(page);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let contentChanged = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newMatchweek = await getCurrentMatchweek(page);
        if (newMatchweek !== beforeMatchweek) {
          currentMatchweek = newMatchweek;
          contentChanged = true;
          break;
        }
      }
      
      if (!contentChanged) {
        console.warn(`[SofaScore Navigation] Content did not change after clicking previous button at MW ${beforeMatchweek}`);
        break;
      }
      
      if (currentMatchweek === targetMatchweek || currentMatchweek < targetMatchweek) {
        break;
      }
    }
    
    // If we need to go forward
    while (currentMatchweek < targetMatchweek && attempts < maxAttempts) {
      attempts++;
      
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const beforeMatchweek = currentMatchweek;
      await clickNextMatchweek(page);
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      let contentChanged = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newMatchweek = await getCurrentMatchweek(page);
        if (newMatchweek !== beforeMatchweek) {
          currentMatchweek = newMatchweek;
          contentChanged = true;
          break;
        }
      }
      
      if (!contentChanged) {
        console.warn(`[SofaScore Navigation] Content did not change after clicking next button at MW ${beforeMatchweek}`);
        break;
      }
      
      if (currentMatchweek === targetMatchweek || currentMatchweek > targetMatchweek) {
        break;
      }
    }
    
    if (attempts >= maxAttempts) {
      console.warn(`[SofaScore Navigation] Reached max attempts while navigating to MW ${targetMatchweek}`);
    }
  } catch (error) {
    console.error(`[SofaScore Navigation] Error navigating to matchweek ${targetMatchweek}:`, error);
  }
}

/**
 * Selects a matchweek from the dropdown
 * SofaScore uses: button.dropdown__button with text "Round X"
 */
export async function selectMatchweekFromDropdown(page: any, targetMatchweek: number): Promise<boolean> {
  try {
    // Find the round dropdown button (not the sports dropdown)
    const dropdownButton = await page.evaluate((targetMW: number) => {
      // Find button with class dropdown__button that contains "Round" text
      const buttons = Array.from(document.querySelectorAll('button.dropdown__button'));
      
      for (const button of buttons) {
        const text = button.textContent || '';
        // Look for button that shows current round (e.g., "Round 22")
        if (text.includes('Round') && /Round\s*\d+/.test(text)) {
          return {
            found: true,
            className: String(button.className || ''),
            text: text.trim()
          };
        }
      }
      return { found: false };
    }, targetMatchweek);
    
    if (!dropdownButton.found) {
      console.log(`[SofaScore Navigation] Round dropdown button not found`);
      return false;
    }
    
    console.log(`[SofaScore Navigation] Found round dropdown: "${dropdownButton.text.substring(0, 30)}"`);
    
    // Click the dropdown button
    const buttonClicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button.dropdown__button'));
      for (const button of buttons) {
        const text = button.textContent || '';
        if (text.includes('Round') && /Round\s*\d+/.test(text)) {
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
    
    if (!buttonClicked) {
      return false;
    }
    
    // Wait for dropdown menu to appear (longer delay to avoid rate limiting)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now find and click the target round option
    // Wait a bit more for dropdown to fully render
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Debug: See what options are available (only log actual round options)
    const availableOptions = await page.evaluate(() => {
      // Look specifically in dropdown menus/options
      const selectors = [
        '[role="option"]',
        '[class*="dropdown"] [class*="item"]',
        '[class*="menu"] [class*="item"]',
        '[class*="dropdown"] button',
        '[class*="dropdown"] li'
      ];
      
      const roundOptions: Element[] = [];
      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        const filtered = elements.filter(el => {
          const text = (el.textContent || '').trim();
          const rect = el.getBoundingClientRect();
          // Only match elements that explicitly say "Round X" or are standalone numbers in dropdown context
          return rect.width > 0 && rect.height > 0 && 
                 (text.match(/^Round\s*\d+$/i) || (text.match(/^\d+$/) && parseInt(text) >= 1 && parseInt(text) <= 38 && el.closest('[class*="dropdown"]')));
        });
        if (filtered.length > 0) {
          roundOptions.push(...filtered);
          break; // Found options, stop searching
        }
      }
      
      return roundOptions.slice(0, 10).map(el => ({
        tag: el.tagName,
        text: (el.textContent || '').trim().substring(0, 30)
      }));
    });
    
    // Only log if we found actual round options (not false positives)
    if (availableOptions.length > 0 && availableOptions.length <= 38) {
      const hasActualRounds = availableOptions.some((opt: { tag: string; text: string }) => opt.text.match(/Round\s*\d+/i) || opt.text.match(/^\d+$/));
      if (hasActualRounds) {
        console.log(`[SofaScore Navigation] Found ${availableOptions.length} round options in dropdown`);
      }
    }
    
    const optionSelected = await page.evaluate((targetMW: number) => {
      // Look for options - they might be in a specific container
      // Try multiple strategies to find round options
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
      
      let roundOptions: Element[] = [];
      
      for (const selector of selectors) {
        const elements = Array.from(document.querySelectorAll(selector));
        const filtered = elements.filter(opt => {
          const text = (opt.textContent || '').trim();
          const rect = opt.getBoundingClientRect();
          // Must be visible and contain round number
          return rect.width > 0 && rect.height > 0 && 
                 (text.match(/Round\s*\d+/i) || (text.match(/^\d+$/) && parseInt(text) >= 1 && parseInt(text) <= 38));
        });
        
        if (filtered.length > 0) {
          roundOptions = filtered;
          break;
        }
      }
      
      // If still no options, try finding by text content in all elements
      if (roundOptions.length === 0) {
        const allElements = Array.from(document.querySelectorAll('*'));
        roundOptions = allElements.filter(el => {
          const text = (el.textContent || '').trim();
          const rect = el.getBoundingClientRect();
          return rect.width > 0 && rect.height > 0 &&
                 text.match(/^Round\s*\d+$/i) && 
                 !text.includes('Select') && // Exclude labels
                 el.tagName !== 'SPAN' || el.parentElement?.tagName === 'BUTTON'; // Prefer buttons
        });
      }
      
      // Try to find and click the target round
      for (const option of roundOptions) {
        const optionText = (option.textContent || '').trim();
        const mwMatch = optionText.match(/Round\s*(\d+)|^(\d+)$/i);
        if (mwMatch) {
          const mw = parseInt(mwMatch[1] || mwMatch[2]);
          if (mw === targetMW && mw >= 1 && mw <= 38) {
            // Scroll into view
            option.scrollIntoView({ behavior: 'smooth', block: 'center' });
            // Try clicking the option or its parent button
            const clickable = option.tagName === 'BUTTON' ? option : 
                            option.closest('button') || option;
            (clickable as HTMLElement).click();
            return true;
          }
        }
      }
      return false;
    }, targetMatchweek);
    
    if (optionSelected) {
      // Wait a bit after clicking option before checking
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Wait for page to update after selection - check multiple times
      let updated = false;
      for (let i = 0; i < 10; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const newMatchweek = await getCurrentMatchweek(page);
        if (newMatchweek === targetMatchweek) {
          updated = true;
          console.log(`[SofaScore Navigation] ✓ Successfully navigated to Round ${targetMatchweek}`);
          break;
        }
      }
      
      if (!updated) {
        console.warn(`[SofaScore Navigation] Selected Round ${targetMatchweek} but page didn't update`);
        return false;
      }
      
      return true;
    } else {
      console.log(`[SofaScore Navigation] Could not find Round ${targetMatchweek} option in dropdown`);
      return false;
    }
  } catch (error) {
    console.error(`[SofaScore Navigation] Error selecting from dropdown:`, error);
    return false;
  }
}

/**
 * Clicks the "previous matchweek" button
 * SofaScore might use a dropdown or navigation buttons
 */
async function clickPreviousMatchweek(page: any): Promise<void> {
  try {
    // First, try to find dropdown and select previous round
    const dropdownClicked = await page.evaluate(() => {
      // Look for round dropdown
      const dropdown = document.querySelector('[class*="dropdown"][class*="round"], [class*="round"]');
      if (dropdown) {
        // Try to open dropdown
        (dropdown as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    if (dropdownClicked) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Try to select previous option in dropdown
      await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('[role="option"], [class*="option"], li, [class*="item"]'));
        // Look for previous round number
        const currentRound = parseInt(document.body.textContent?.match(/round\s*(\d+)/i)?.[1] || '0');
        if (currentRound > 1) {
          const prevRound = currentRound - 1;
          const prevOption = options.find(opt => {
            const text = opt.textContent || '';
            return text.includes(`Round ${prevRound}`) || text.includes(`round ${prevRound}`);
          });
          if (prevOption) {
            (prevOption as HTMLElement).click();
            return true;
          }
        }
        return false;
      });
      return;
    }
    
    // Fallback: Try to find navigation buttons
    const button = await page.$('button[aria-label*="previous" i], button[aria-label*="Previous"], [class*="prev"], [class*="arrow-left"], button[class*="left"], [data-testid*="prev"], svg[class*="arrow"]');
    
    if (button) {
      await page.evaluate((btn) => {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, button);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await page.evaluate((btn) => {
        btn.click();
      }, button);
      return;
    }
    
    // Fallback: try with evaluate
    const clicked = await page.evaluate(() => {
      const selectors = [
        'button[aria-label*="previous" i]',
        'button[aria-label*="Previous"]',
        '[class*="prev"]',
        '[class*="arrow-left"]',
        'button[class*="left"]',
        '[data-testid*="prev"]',
        'svg[class*="arrow"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && (element as HTMLElement).offsetParent !== null) {
          (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    
    if (!clicked) {
      console.warn("[SofaScore Navigation] Could not find previous matchweek button - may need to use dropdown");
    }
  } catch (error) {
    console.error("[SofaScore Navigation] Error clicking previous matchweek:", error);
  }
}

/**
 * Clicks the "next matchweek" button
 * SofaScore might use a dropdown or navigation buttons
 */
async function clickNextMatchweek(page: any): Promise<void> {
  try {
    // First, try to find dropdown and select next round
    const dropdownClicked = await page.evaluate(() => {
      const dropdown = document.querySelector('[class*="dropdown"][class*="round"], [class*="round"]');
      if (dropdown) {
        (dropdown as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    if (dropdownClicked) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      // Try to select next option in dropdown
      await page.evaluate(() => {
        const options = Array.from(document.querySelectorAll('[role="option"], [class*="option"], li, [class*="item"]'));
        const currentRound = parseInt(document.body.textContent?.match(/round\s*(\d+)/i)?.[1] || '0');
        if (currentRound < 38) {
          const nextRound = currentRound + 1;
          const nextOption = options.find(opt => {
            const text = opt.textContent || '';
            return text.includes(`Round ${nextRound}`) || text.includes(`round ${nextRound}`);
          });
          if (nextOption) {
            (nextOption as HTMLElement).click();
            return true;
          }
        }
        return false;
      });
      return;
    }
    
    // Fallback: Try to find navigation buttons
    const button = await page.$('button[aria-label*="next" i], button[aria-label*="Next"], [class*="next"], [class*="arrow-right"], button[class*="right"], [data-testid*="next"], svg[class*="arrow"]');
    
    if (button) {
      await page.evaluate((btn) => {
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, button);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await page.evaluate((btn) => {
        btn.click();
      }, button);
      return;
    }
    
    // Fallback: try with evaluate
    const clicked = await page.evaluate(() => {
      const selectors = [
        'button[aria-label*="next" i]',
        'button[aria-label*="Next"]',
        '[class*="next"]',
        '[class*="arrow-right"]',
        'button[class*="right"]',
        '[data-testid*="next"]',
        'svg[class*="arrow"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && (element as HTMLElement).offsetParent !== null) {
          (element as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' });
          (element as HTMLElement).click();
          return true;
        }
      }
      return false;
    });
    
    if (!clicked) {
      console.warn("[SofaScore Navigation] Could not find next matchweek button - may need to use dropdown");
    }
  } catch (error) {
    console.error("[SofaScore Navigation] Error clicking next matchweek:", error);
  }
}

/**
 * Gets the current matchweek from the page
 */
export async function getCurrentMatchweek(page: any): Promise<number> {
  try {
    const matchweek = await page.evaluate(() => {
      // SofaScore uses "Round X" format - look for dropdown or text
      const dropdown = document.querySelector('[class*="dropdown"], [class*="round"]');
      if (dropdown) {
        const dropdownText = dropdown.textContent || '';
        const roundMatch = dropdownText.match(/round\s*(\d+)/i);
        if (roundMatch) {
          const mw = parseInt(roundMatch[1]);
          if (!isNaN(mw) && mw >= 1 && mw <= 38) {
            return mw;
          }
        }
      }
      
      // Look for "Round X" in page text (limit search to first 5000 chars to avoid huge strings)
      const bodyText = document.body.textContent || '';
      const text = bodyText.substring(0, 5000); // Limit to avoid huge string serialization
      const mwMatch = text.match(/round\s*(\d+)|matchweek\s*(\d+)|mw\s*(\d+)/i);
      if (mwMatch) {
        const mw = parseInt(mwMatch[1] || mwMatch[2] || mwMatch[3]);
        if (!isNaN(mw) && mw >= 1 && mw <= 38) {
          return mw;
        }
      }
      
      // Check URL
      const urlMatch = window.location.href.match(/round[=:](\d+)|matchweek[=:](\d+)/i);
      if (urlMatch) {
        const mw = parseInt(urlMatch[1] || urlMatch[2]);
        if (!isNaN(mw) && mw >= 1 && mw <= 38) {
          return mw;
        }
      }
      
      return null;
    });
    
    return matchweek || 38;
  } catch (error) {
    console.error("[SofaScore Navigation] Error getting current matchweek:", error);
    return 38;
  }
}
