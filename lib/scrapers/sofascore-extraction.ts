import { extractResultsFromPage as extractFromDOM } from "./sofascore-element-extraction";
import { processRawResults } from "./sofascore-processor";
import { Fixture } from "../types";

/**
 * Extraction utilities for SofaScore scraper
 * Handles extracting match data from the page
 */

/**
 * Extracts match results from the current page
 */
export async function extractResultsFromPage(
  page: any,
  matchweek: number,
  seasonYear: number
): Promise<Fixture[]> {
  try {
    console.log(`[SofaScore Extraction] Starting extraction for MW ${matchweek}, season ${seasonYear}...`);
    
    // Check page content before extraction
    const pageInfo = await page.evaluate(() => {
      return {
        url: window.location.href,
        title: document.title,
        bodyTextLength: document.body.textContent?.length || 0,
        matchLinks: document.querySelectorAll('a[href*="/match/"]').length,
        eventLinks: document.querySelectorAll('a[class*="event"]').length,
      };
    });
    
    console.log(`[SofaScore Extraction] Page info:`, {
      url: pageInfo.url,
      title: pageInfo.title.substring(0, 50),
      bodyTextLength: pageInfo.bodyTextLength,
      matchLinks: pageInfo.matchLinks,
      eventLinks: pageInfo.eventLinks,
    });
    
    const resultsData = await extractFromDOM(page, matchweek, seasonYear);
    console.log(`[SofaScore Extraction] Raw results data: ${resultsData.length} matches found`);
    
    const processedResults = processRawResults(resultsData, seasonYear);
    console.log(`[SofaScore Extraction] Processed results: ${processedResults.length} fixtures`);
    
    return processedResults;
  } catch (error) {
    console.error(`[SofaScore Extraction] Error extracting results from page:`, error);
    return [];
  }
}
