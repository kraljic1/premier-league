"use client";

import { useEffect } from "react";

interface WebVitalMetric {
  name: string;
  value: number;
  id: string;
  delta: number;
  rating: "good" | "needs-improvement" | "poor";
}

/**
 * Core Web Vitals monitoring component for 2026 SEO standards
 * Tracks LCP, CLS, INP, FID, and TTFB metrics
 */
// Extend Window interface for gtag
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string | Date,
      config?: Record<string, any>
    ) => void;
  }
}

export function CoreWebVitals() {
  useEffect(() => {
    // Only track if window is available
    if (typeof window === "undefined") {
      return;
    }

    // Dynamically import web-vitals to reduce bundle size
    import("web-vitals").then(({ onCLS, onINP, onLCP, onFID, onTTFB, onFCP }) => {
      // Largest Contentful Paint (LCP) - Target: <2.5s
      onLCP((metric: WebVitalMetric) => {
        sendToAnalytics("LCP", metric);
      });

      // Cumulative Layout Shift (CLS) - Target: <0.1
      onCLS((metric: WebVitalMetric) => {
        sendToAnalytics("CLS", metric);
      });

      // Interaction to Next Paint (INP) - Target: <200ms
      onINP((metric: WebVitalMetric) => {
        sendToAnalytics("INP", metric);
      });

      // First Input Delay (FID) - Target: <100ms
      onFID((metric: WebVitalMetric) => {
        sendToAnalytics("FID", metric);
      });

      // Time to First Byte (TTFB) - Target: <800ms
      onTTFB((metric: WebVitalMetric) => {
        sendToAnalytics("TTFB", metric);
      });

      // First Contentful Paint (FCP) - Target: <1.8s
      onFCP((metric: WebVitalMetric) => {
        sendToAnalytics("FCP", metric);
      });
    });
  }, []);

  return null;
}

/**
 * Send Core Web Vitals metrics to Google Analytics 4
 */
function sendToAnalytics(metricName: string, metric: WebVitalMetric) {
  if (typeof window === "undefined" || !window.gtag) {
    return;
  }

  // Send to GA4 as custom events
  if (window.gtag) {
    window.gtag("event", metricName, {
      event_category: "Web Vitals",
      event_label: metric.id,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      non_interaction: true,
      // Custom dimensions for better analysis
      metric_rating: metric.rating,
      metric_delta: metric.delta,
    });
  }

  // Log poor performance metrics for debugging
  if (metric.rating === "poor") {
    console.warn(`[Core Web Vitals] ${metricName} is poor: ${metric.value}`, metric);
  }
}
