import { NextRequest, NextResponse } from 'next/server';
import { scrapeStandings } from '../../../lib/scrapers/standings-api';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds for scraping

export async function GET(request: NextRequest) {
  try {
    console.log('[API] Starting standings scraping...');

    const standings = await scrapeStandings();

    console.log(`[API] Successfully scraped ${standings.length} standings`);

    return NextResponse.json({
      success: true,
      standings,
      count: standings.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('[API] Error scraping standings:', error);

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