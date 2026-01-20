import { schedule } from "@netlify/functions";
import { reconcileCompetitionFixtures } from "../../lib/reconcile-competition-fixtures";

/**
 * Daily Netlify scheduled function for competition fixtures reconciliation.
 * Runs at 02:15 UTC.
 */
export const handler = schedule("15 2 * * *", async () => {
  const startTime = Date.now();
  console.log("[Reconcile Fixtures] Scheduled run started");

  try {
    const result = await reconcileCompetitionFixtures();
    const duration = Math.round((Date.now() - startTime) / 1000);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        totalUpserted: result.totalUpserted,
        perCompetition: result.perCompetition,
        duration: `${duration}s`,
        timestamp: new Date().toISOString(),
      }),
    };
  } catch (error) {
    console.error("[Reconcile Fixtures] Scheduled run failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      }),
    };
  }
});
