import { Handler, schedule } from "@netlify/functions";
import { CUP_COMPETITIONS } from "../../lib/competition-sources";

const handler: Handler = async () => {
  console.log("[DailyCupFixtures] Starting daily cup fixtures refresh...");

  const baseUrl =
    process.env.URL || process.env.NETLIFY_URL || "http://localhost:3000";
  const competitions = CUP_COMPETITIONS.map((competition) => competition.value);
  const params = new URLSearchParams();
  params.set("competitions", competitions.join(","));

  const apiUrl = `${baseUrl}/api/fixtures?${params.toString()}`;
  console.log(`[DailyCupFixtures] Calling fixtures API: ${apiUrl}`);

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Netlify-DailyCupFixtures/1.0",
      },
      signal: AbortSignal.timeout(120000),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(
        `[DailyCupFixtures] API error ${response.status} ${response.statusText}: ${errorText}`
      );
      return {
        statusCode: response.status,
        body: JSON.stringify({
          success: false,
          message: "Failed to refresh cup fixtures",
        }),
      };
    }

    const data = await response.json();
    const total = Array.isArray(data) ? data.length : 0;

    console.log(`[DailyCupFixtures] Fixtures refreshed: ${total}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        fixtures: total,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("[DailyCupFixtures] Error refreshing fixtures:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        message: "Unexpected error refreshing cup fixtures",
      }),
    };
  }
};

export const handler = schedule("0 3 * * *", handler);
