import { NextResponse } from 'next/server';

// API documentation endpoint
export async function GET() {
  const apiInfo = {
    name: "Premier League Matches API",
    description: "REST API for Premier League fixtures, results, and standings",
    version: "1.0.0",
    baseUrl: "https://premierleaguematches.com",
    versions: {
      "v1": {
        status: "current",
        description: "Current stable API version",
        basePath: "/api/v1",
        released: "2024-01-01",
        endpoints: [
          "/api/v1/clubs",
          "/api/v1/fixtures",
          "/api/v1/results",
          "/api/v1/standings",
          "/api/v1/standings/update",
          "/api/v1/refresh",
          "/api/v1/historical-season",
          "/api/v1/keep-alive",
          "/api/v1/force-update",
          "/api/v1/secure-data",
          "/api/v1/og",
          "/api/v1/test-scraper"
        ]
      }
    },
    authentication: {
      type: "API Key",
      header: "x-api-key",
      levels: ["read", "write", "admin"]
    },
    rateLimits: {
      public: "300 requests per 15 minutes",
      sensitive: "5 requests per 15 minutes"
    },
    contact: {
      email: "api@premierleaguematches.com",
      documentation: "https://premierleaguematches.com/docs"
    }
  };

  return NextResponse.json(apiInfo, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    }
  });
}