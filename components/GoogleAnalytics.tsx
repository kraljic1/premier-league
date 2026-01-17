"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, any>
    ) => void;
    dataLayer?: any[];
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
    if (window.gtag) {
      console.log("[GA4] Already initialized");
      return; // Already initialized
    }

    console.log("[GA4] Initializing Google Analytics with ID:", measurementId);

    // Initialize gtag function
    window.dataLayer = window.dataLayer || [];
    const dataLayer = window.dataLayer;
    function gtag(...args: any[]) {
      dataLayer.push(args);
    }
    window.gtag = gtag;

    // Load Google Analytics script
    const script1 = document.createElement("script");
    script1.async = true;
    script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.appendChild(script1);

    script1.onload = () => {
      console.log("[GA4] Script loaded successfully");
    };

    script1.onerror = () => {
      console.error("[GA4] Failed to load script");
    };

    // Initialize GA4
    gtag("js", new Date());
    gtag("config", measurementId, {
      page_path: window.location.pathname,
    });

    console.log("[GA4] Configuration sent");
  };

  useEffect(() => {
    // Check initial consent status
    const consent = localStorage.getItem("cookie-consent");
    console.log("[GA4] Cookie consent status:", consent);
    
    if (consent === "accepted") {
      initializeGA4();
    } else if (!consent) {
      console.log("[GA4] No consent decision yet - waiting for user to accept cookies");
    } else {
      console.log("[GA4] Cookies rejected - GA4 will not load");
    }

    // Listen for consent changes
    const handleConsentChange = (event: CustomEvent) => {
      console.log("[GA4] Consent changed:", event.detail.consent);
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
    console.log("[GA4] Tracking page view:", url);
    window.gtag("config", measurementId, {
      page_path: url,
    });
  }, [pathname, searchParams, measurementId]);

  return null;
}
