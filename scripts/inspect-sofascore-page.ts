/**
 * Inspects SofaScore page structure to help identify correct selectors
 * Run with: npx tsx scripts/inspect-sofascore-page.ts
 * 
 * This script opens SofaScore and logs the page structure to help identify:
 * - Matchweek navigation buttons
 * - Match elements
 * - Team name selectors
 * - Score selectors
 */

import { scrapePage } from "../lib/scrapers/browser";

async function inspectPage() {
  let page;
  
  try {
    console.log("Opening SofaScore Premier League page...");
    const baseUrl = `https://www.sofascore.com/tournament/football/england/premier-league/17`;
    page = await scrapePage(baseUrl, undefined, 30000);
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Handle cookie consent if present
    console.log("Checking for cookie consent...");
    try {
      const cookieButton = await page.$('button:has-text("Accept"), button:has-text("I agree"), [id*="accept"], [class*="accept"]');
      if (cookieButton) {
        await cookieButton.click();
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log("  Cookie consent handled");
      }
    } catch (e) {
      console.log("  No cookie consent found or already handled");
    }
    
    // Scroll to trigger lazy loading
    console.log("Scrolling to load content...");
    for (let i = 0; i < 3; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log("\n=== PAGE INSPECTION ===\n");
    
    // Inspect navigation buttons - look for more specific patterns
    console.log("1. NAVIGATION BUTTONS:");
    const navInfo = await page.evaluate(() => {
      // Look for buttons with arrow icons or navigation-related classes
      const allButtons = Array.from(document.querySelectorAll('button, a, [role="button"], [class*="button"]'));
      
      // Filter out cookie/privacy buttons
      const navButtons = allButtons.filter(btn => {
        const text = (btn.textContent || '').toLowerCase();
        const ariaLabel = (btn.getAttribute('aria-label') || '').toLowerCase();
        // className can be a DOMTokenList, convert to string first
        const className = String(btn.className || '').toLowerCase();
        const id = String(btn.id || '').toLowerCase();
        
        // Exclude cookie/privacy buttons
        if (text.includes('cookie') || text.includes('privacy') || text.includes('consent') ||
            ariaLabel.includes('cookie') || ariaLabel.includes('privacy') || ariaLabel.includes('consent') ||
            className.includes('cookie') || className.includes('privacy') || className.includes('consent') ||
            id.includes('cookie') || id.includes('privacy') || id.includes('consent')) {
          return false;
        }
        
        // Look for navigation patterns
        return text.includes('prev') || text.includes('next') || text.includes('previous') ||
               text.includes('arrow') || text.includes('<') || text.includes('>') ||
               ariaLabel.includes('prev') || ariaLabel.includes('next') || ariaLabel.includes('previous') ||
               ariaLabel.includes('arrow') || ariaLabel.includes('round') || ariaLabel.includes('matchweek') ||
               className.includes('prev') || className.includes('next') || className.includes('arrow') ||
               className.includes('nav') || className.includes('round') || className.includes('matchweek') ||
               id.includes('prev') || id.includes('next') || id.includes('nav');
      });
      
      return navButtons.map(btn => {
        const rect = btn.getBoundingClientRect();
        const classNameStr = String(btn.className || '');
        const idStr = String(btn.id || '');
        return {
          tag: btn.tagName,
          text: btn.textContent?.trim().substring(0, 50) || '',
          ariaLabel: btn.getAttribute('aria-label') || '',
          className: classNameStr,
          id: idStr,
          dataTestId: btn.getAttribute('data-testid') || '',
          visible: rect.width > 0 && rect.height > 0,
          position: { x: rect.x, y: rect.y },
          selector: classNameStr ? `.${classNameStr.split(' ').filter(c => c && !c.includes('[')).slice(0, 3).join('.')}` : btn.tagName.toLowerCase()
        };
      });
    });
    
    const navButtons = navInfo;
    
    if (navButtons.length > 0) {
      console.log(`  Found ${navButtons.length} potential navigation buttons:\n`);
      navButtons.forEach((btn, i) => {
        console.log(`  Button ${i + 1}:`);
        console.log(`    Tag: ${btn.tag}`);
        console.log(`    Text: ${btn.text || 'N/A'}`);
        console.log(`    Aria Label: ${btn.ariaLabel || 'N/A'}`);
        console.log(`    Class: ${btn.className || 'N/A'}`);
        console.log(`    ID: ${btn.id || 'N/A'}`);
        console.log(`    Data-testid: ${btn.dataTestId || 'N/A'}`);
        console.log(`    Visible: ${btn.visible}`);
        console.log(`    Position: (${btn.position.x}, ${btn.position.y})`);
        console.log(`    Suggested selector: ${btn.selector}`);
        console.log('');
      });
    } else {
      console.log("  ⚠️  No navigation buttons found with common patterns");
      console.log("  Looking for any buttons with icons or arrows...");
      
      // Fallback: look for SVG icons or arrow characters
      const iconButtons = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        return buttons.filter(btn => {
          const hasSvg = btn.querySelector('svg') !== null;
          const text = btn.textContent || '';
          const hasArrow = /[<>←→↑↓]/.test(text);
          return (hasSvg || hasArrow) && btn.getBoundingClientRect().width > 0;
        }).slice(0, 5).map(btn => ({
          tag: btn.tagName,
          className: btn.className,
          hasSvg: !!btn.querySelector('svg'),
          text: btn.textContent?.trim().substring(0, 30)
        }));
      });
      
      if (iconButtons.length > 0) {
        console.log("  Found buttons with icons:");
        iconButtons.forEach((btn, i) => {
          console.log(`    ${i + 1}. ${btn.tag} - ${btn.className} - "${btn.text}"`);
        });
      }
    }
    
    // Inspect match elements - look more broadly
    console.log("\n2. MATCH ELEMENTS:");
    const matchInfo = await page.evaluate(() => {
      // Try multiple selector strategies
      const selectors = [
        '[class*="match"]',
        '[class*="event"]',
        '[class*="fixture"]',
        '[class*="game"]',
        '[data-testid*="match"]',
        'a[href*="/match/"]',
        '[class*="tournament"] [class*="event"]',
        '[class*="round"]',
        'tr[class*="event"]',
        'div[class*="event"]'
      ];
      
      const allMatches: any[] = [];
      const seen = new Set<Element>();
      
      for (const selector of selectors) {
        try {
          const elements = Array.from(document.querySelectorAll(selector));
          elements.forEach(el => {
            if (!seen.has(el) && el.textContent && el.textContent.trim().length > 20) {
              seen.add(el);
              const text = el.textContent.trim();
              const hasTeams = /vs|v\.|[-–]|vs\./i.test(text);
              const hasScore = /\d+\s*[-–]\s*\d+/.test(text);
              const hasTeamNames = /[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/.test(text);
              
              // Only include if it looks like a match
              if (hasTeams || hasScore || (hasTeamNames && text.length < 200)) {
                allMatches.push({
                  selector,
                  tag: el.tagName,
                  className: el.className || '',
                  id: el.id || '',
                  dataTestId: el.getAttribute('data-testid') || '',
                  text: text.substring(0, 150),
                  hasTeams,
                  hasScore,
                  hasTeamNames,
                  children: el.children.length,
                  rect: el.getBoundingClientRect()
                });
              }
            }
          });
        } catch (e) {
          // Continue
        }
      }
      
      return allMatches.slice(0, 10);
    });
    
    if (matchInfo.length > 0) {
      matchInfo.forEach((match, i) => {
        console.log(`  Match Element ${i + 1}:`);
        console.log(`    Found via selector: ${match.selector}`);
        console.log(`    Tag: ${match.tag}`);
        console.log(`    Class: ${match.className || 'N/A'}`);
        console.log(`    Data-testid: ${match.dataTestId || 'N/A'}`);
        console.log(`    Has teams: ${match.hasTeams}`);
        console.log(`    Has score: ${match.hasScore}`);
        console.log(`    Children: ${match.children}`);
        console.log(`    Visible: ${match.rect.width > 0 && match.rect.height > 0}`);
        console.log(`    Text preview: ${match.text}`);
        console.log('');
      });
    } else {
      console.log("  No match elements found with common patterns");
      console.log("  Trying to find any elements with team-like text...");
      
      // Fallback: look for any text that might be matches
      const textMatches = await page.evaluate(() => {
        const bodyText = document.body.textContent || '';
        const lines = bodyText.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 10 && trimmed.length < 200 &&
                 (/vs|v\.|[-–]/.test(trimmed) || /\d+\s*[-–]\s*\d+/.test(trimmed));
        });
        return lines.slice(0, 10);
      });
      
      if (textMatches.length > 0) {
        console.log("  Found potential match text:");
        textMatches.forEach((text, i) => {
          console.log(`    ${i + 1}. ${text.substring(0, 100)}`);
        });
      }
    }
    
    // Inspect team name elements
    console.log("\n3. TEAM NAME ELEMENTS:");
    const teamInfo = await page.evaluate(() => {
      const potentialTeams = Array.from(document.querySelectorAll(
        '[class*="team"], [class*="home"], [class*="away"], [class*="name"]'
      )).slice(0, 10);
      
      return potentialTeams.map((el, i) => ({
        index: i + 1,
        tag: el.tagName,
        className: el.className,
        text: el.textContent?.trim().substring(0, 50),
        parentClass: el.parentElement?.className
      }));
    });
    
    teamInfo.forEach(team => {
      console.log(`  Team Element ${team.index}:`);
      console.log(`    Tag: ${team.tag}`);
      console.log(`    Class: ${team.className || 'N/A'}`);
      console.log(`    Text: ${team.text || 'N/A'}`);
      console.log(`    Parent class: ${team.parentClass || 'N/A'}`);
      console.log('');
    });
    
    // Check current matchweek
    console.log("\n4. CURRENT MATCHWEEK:");
    const mwInfo = await page.evaluate(() => {
      const text = document.body.textContent || '';
      const mwMatch = text.match(/matchweek\s*(\d+)|mw\s*(\d+)|round\s*(\d+)/i);
      const urlMatch = window.location.href.match(/matchweek[=:](\d+)|round[=:](\d+)/i);
      
      return {
        inText: mwMatch ? parseInt(mwMatch[1] || mwMatch[2] || mwMatch[3]) : null,
        inUrl: urlMatch ? parseInt(urlMatch[1] || urlMatch[2]) : null,
        url: window.location.href
      };
    });
    
    console.log(`  Matchweek in text: ${mwInfo.inText || 'Not found'}`);
    console.log(`  Matchweek in URL: ${mwInfo.inUrl || 'Not found'}`);
    console.log(`  Current URL: ${mwInfo.url}`);
    
    // Get page HTML structure (sample)
    console.log("\n5. PAGE STRUCTURE SAMPLE:");
    const structure = await page.evaluate(() => {
      const body = document.body;
      const mainContent = body.querySelector('main, [role="main"], [class*="content"], [class*="container"]');
      return {
        title: document.title,
        mainElement: mainContent ? {
          tag: mainContent.tagName,
          className: mainContent.className,
          id: mainContent.id
        } : null,
        hasReact: !!window.React || !!document.querySelector('[data-reactroot]'),
        scripts: Array.from(document.querySelectorAll('script[src]')).length
      };
    });
    
    console.log(`  Page title: ${structure.title}`);
    console.log(`  Main element: ${structure.mainElement ? `${structure.mainElement.tag} (${structure.mainElement.className})` : 'Not found'}`);
    console.log(`  React detected: ${structure.hasReact}`);
    console.log(`  Scripts loaded: ${structure.scripts}`);
    
    // Deep dive into page structure
    console.log("\n6. PAGE STRUCTURE ANALYSIS:");
    const structureAnalysis = await page.evaluate(() => {
      // Look for common SofaScore patterns
      const analysis: any = {
        sections: [],
        tables: [],
        lists: [],
        containers: []
      };
      
      // Find main content sections
      const sections = Array.from(document.querySelectorAll('section, [class*="section"], [class*="content"], [class*="main"]'));
      sections.slice(0, 5).forEach((section, i) => {
        const text = section.textContent?.trim().substring(0, 200) || '';
        if (text.length > 50) {
          analysis.sections.push({
            index: i + 1,
            tag: section.tagName,
            className: section.className,
            textSample: text,
            childCount: section.children.length
          });
        }
      });
      
      // Find tables (SofaScore might use tables)
      const tables = Array.from(document.querySelectorAll('table'));
      tables.slice(0, 3).forEach((table, i) => {
        const rows = table.querySelectorAll('tr');
        analysis.tables.push({
          index: i + 1,
          className: table.className,
          rowCount: rows.length,
          firstRowText: rows[0]?.textContent?.trim().substring(0, 100)
        });
      });
      
      // Find lists
      const lists = Array.from(document.querySelectorAll('ul, ol, [class*="list"]'));
      lists.slice(0, 5).forEach((list, i) => {
        const items = list.querySelectorAll('li, [class*="item"]');
        if (items.length > 0) {
          analysis.lists.push({
            index: i + 1,
            tag: list.tagName,
            className: list.className,
            itemCount: items.length,
            firstItemText: items[0]?.textContent?.trim().substring(0, 100)
          });
        }
      });
      
      // Look for containers with matchweek-related content
      const containers = Array.from(document.querySelectorAll('[class*="round"], [class*="matchweek"], [class*="week"], [class*="fixture"]'));
      containers.slice(0, 5).forEach((container, i) => {
        analysis.containers.push({
          index: i + 1,
          className: container.className,
          text: container.textContent?.trim().substring(0, 150),
          children: container.children.length
        });
      });
      
      return analysis;
    });
    
    if (structureAnalysis.sections.length > 0) {
      console.log("  Content sections found:");
      structureAnalysis.sections.forEach((section: any) => {
        console.log(`    ${section.index}. ${section.tag} (${section.className}) - ${section.childCount} children`);
        console.log(`       Text: ${section.textSample.substring(0, 100)}...`);
      });
    }
    
    if (structureAnalysis.tables.length > 0) {
      console.log("\n  Tables found:");
      structureAnalysis.tables.forEach((table: any) => {
        console.log(`    ${table.index}. ${table.className} - ${table.rowCount} rows`);
        if (table.firstRowText) {
          console.log(`       First row: ${table.firstRowText}`);
        }
      });
    }
    
    if (structureAnalysis.lists.length > 0) {
      console.log("\n  Lists found:");
      structureAnalysis.lists.forEach((list: any) => {
        console.log(`    ${list.index}. ${list.tag} (${list.className}) - ${list.itemCount} items`);
        if (list.firstItemText) {
          console.log(`       First item: ${list.firstItemText}`);
        }
      });
    }
    
    if (structureAnalysis.containers.length > 0) {
      console.log("\n  Matchweek/Round containers found:");
      structureAnalysis.containers.forEach((container: any) => {
        console.log(`    ${container.index}. ${container.className}`);
        console.log(`       Text: ${container.text}`);
        console.log(`       Children: ${container.children}`);
      });
    }
    
    // Take a screenshot for manual inspection
    console.log("\n7. Taking screenshot...");
    await page.screenshot({ path: 'sofascore-inspection.png', fullPage: true });
    console.log("  Screenshot saved to: sofascore-inspection.png");
    
    console.log("\n=== INSPECTION COMPLETE ===");
    console.log("\n📋 SUMMARY:");
    console.log(`  - Navigation buttons found: ${navButtons.length}`);
    console.log(`  - Match elements found: ${matchInfo.length}`);
    console.log(`  - Current matchweek: ${mwInfo.inText || 'Not found'}`);
    console.log(`  - Page URL: ${mwInfo.url}`);
    
    console.log("\n💡 NEXT STEPS:");
    console.log("1. Review the detailed information above");
    console.log("2. Check the full-page screenshot: sofascore-inspection.png");
    console.log("3. Look for:");
    console.log("   - Navigation buttons (previous/next matchweek)");
    console.log("   - Match containers (should have team names and scores)");
    console.log("   - Matchweek indicators");
    console.log("4. Update selectors in:");
    console.log("   - lib/scrapers/sofascore-navigation.ts (for navigation)");
    console.log("   - lib/scrapers/sofascore-element-extraction.ts (for matches)");
    console.log("5. Test with: npx tsx scripts/test-scraper-single-matchweek.ts 22");
    
    if (mwInfo.inText) {
      console.log(`\n✅ Found matchweek ${mwInfo.inText} in page text - page is loading correctly!`);
      console.log("   Focus on finding the navigation buttons and match containers.");
    }
    
  } catch (error: any) {
    console.error("\n❌ Error during inspection:", error);
    console.error("Stack:", error.stack);
  } finally {
    if (page) {
      await page.close();
    }
  }
}

inspectPage();
