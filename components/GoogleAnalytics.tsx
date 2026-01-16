"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer: any[];
  }
}

interface GoogleAnalyticsProps {
  measurementId: string;
}

export function GoogleAnalytics({ measurementId }: GoogleAnalyticsProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Function to initialize GA4
  const initializeGA4 = () => {
    if (window.gtag) return; // Already initialized

    // Initialize gtag function
    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]) {
      window.dataLayer.push(args);
    }
    window.gtag = gtag as typeof window.gtag;

    // Load Google Analytics script
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    // Initialize GA4
    gtag("js", new Date());
    gtag("config", measurementId, {
      page_path: window.location.pathname,
    });
  };

  useEffect(() => {
    // Check initial consent status
    const consent = localStorage.getItem("cookie-consent");
    if (consent === "accepted") {
      initializeGA4();
    }

    // Listen for consent changes
    const handleConsentChange = (event: CustomEvent) => {
      if (event.detail.consent === "accepted") {
        initializeGA4();
      }
    };

    window.addEventListener("cookie-consent-changed", handleConsentChange as EventListener);

    return () => {
      window.removeEventListener("cookie-consent-changed", handleConsentChange as EventListener);

      // Cleanup: remove script if component unmounts
      const existingScript = document.querySelector(
        `script[src*="googletagmanager.com/gtag/js"]`
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [measurementId]);

  // Track page views on route change
  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (consent !== "accepted" || !window.gtag) {
      return;
    }

    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
    window.gtag("config", measurementId, {
      page_path: url,
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}
