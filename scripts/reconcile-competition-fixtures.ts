#!/usr/bin/env tsx

/**
 * Daily reconciliation for fixtures across competitions.
 * Usage: npx tsx scripts/reconcile-competition-fixtures.ts
 */

import { config } from "dotenv";
import { resolve } from "path";
import { reconcileCompetitionFixtures } from "../lib/reconcile-competition-fixtures";

config({ path: resolve(__dirname, "../.env.local") });

async function main() {
  const result = await reconcileCompetitionFixtures();
  console.log(`[Reconcile Fixtures] Done. Total upserted: ${result.totalUpserted}`);
}

main().catch((error) => {
  console.error("[Reconcile Fixtures] Fatal error:", error);
  process.exit(1);
});
