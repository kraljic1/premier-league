import { NextRequest, NextResponse } from "next/server";
import { scrapeFixturesFromOneFootball, scrapeResultsFromOneFootball } from "@/lib/scrapers/onefootball-fixtures";

export async function GET(request: NextRequest) {
  try {
    console.log('Testing scrapers...');

    const fixtures = await scrapeFixturesFromOneFootball();
    const results = await scrapeResultsFromOneFootball();

    return NextResponse.json({
      fixturesCount: fixtures.length,
      resultsCount: results.length,
      fixtures: fixtures.slice(0, 3),
      results: results.slice(0, 3),
    });
  } catch (error) {
    console.error('Scraper test error:', error);
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}