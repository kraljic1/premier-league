"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics as NextJsGoogleAnalytics } from "nextjs-google-analytics";

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    console.info("[GA4] GoogleAnalytics mounted");
    console.info(`[GA4] Measurement ID present: ${Boolean(measurementId)}`);
    // Check initial consent status
    const initialConsent = localStorage.getItem("cookie-consent");
    setConsent(initialConsent);
    console.info(`[GA4] Cookie consent status: ${initialConsent ?? "unset"}`);

    // Listen for consent changes
    const handleConsentChange = (event: CustomEvent) => {
      setConsent(event.detail.consent);
    };

    window.addEventListener("cookie-consent-changed", handleConsentChange as EventListener);

    return () => {
      window.removeEventListener("cookie-consent-changed", handleConsentChange as EventListener);
    };
  }, [measurementId]);

  // Only render GA if cookies are accepted
  if (consent !== "accepted") {
    console.info("[GA4] Consent not accepted - GA4 not loaded");
    return null;
  }

  console.info("[GA4] Consent accepted - loading GA4");
  return (
    <NextJsGoogleAnalytics
      trackPageViews
      gaMeasurementId={measurementId}
    />
  );
}