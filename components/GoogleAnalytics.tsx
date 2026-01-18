"use client";

import { useEffect, useState } from "react";
import { GoogleAnalytics as NextJsGoogleAnalytics } from "nextjs-google-analytics";

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const [consent, setConsent] = useState<string | null>(null);

  useEffect(() => {
    // Check initial consent status
    const initialConsent = localStorage.getItem("cookie-consent");
    setConsent(initialConsent);

    // Listen for consent changes
    const handleConsentChange = (event: CustomEvent) => {
      setConsent(event.detail.consent);
    };

    window.addEventListener("cookie-consent-changed", handleConsentChange as EventListener);

    return () => {
      window.removeEventListener("cookie-consent-changed", handleConsentChange as EventListener);
    };
  }, []);

  // Only render GA if cookies are accepted
  if (consent !== "accepted") {
    return null;
  }

  return (
    <NextJsGoogleAnalytics
      trackPageViews
      gaMeasurementId={measurementId}
    />
  );
}