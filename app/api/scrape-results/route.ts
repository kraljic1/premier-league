import { NextRequest, NextResponse } from 'next/server';
import { scrapeRecentResults } from '../../../lib/scrapers/results-api';
import { scrapeResultsFromOneFootball } from '../../../lib/scrapers/onefootball-fixtures';

export const runtime = 'nodejs';
export const maxDuration = 45; // Reduced to 45 seconds for Netlify limits

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Starting results scraping...');

    let results = [];
    let source = 'rezultati';

    try {
      results = await scrapeResultsFromOneFootball();
      source = 'onefootball';
    } catch (error) {
      console.warn('[API] OneFootball scraping failed, falling back to Rezultati:', error);
      results = await scrapeRecentResults();
    }

    console.log(`[API] Successfully scraped ${results.length} results from ${source}`);

    return NextResponse.json({
      success: true,
      results,
      source,
      count: results.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API] Error scraping results:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Same as GET for compatibility
  return GET(request);
}