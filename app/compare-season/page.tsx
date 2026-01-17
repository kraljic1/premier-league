import { Suspense } from "react";
import { CompareSeasonClient } from "@/app/compare-season/CompareSeasonClient";

// Server component - handles initial data fetching and SEO
export default function CompareSeasonPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CompareSeasonClient />
    </Suspense>
  );
}
