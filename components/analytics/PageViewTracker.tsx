"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface PageViewTrackerProps {
  measurementId: string;
  enabled: boolean;
}

declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

export function PageViewTracker({
  measurementId,
  enabled,
}: PageViewTrackerProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }

    const search = searchParams?.toString();
    const fullPath = search ? `${pathname}?${search}` : pathname;

    if (lastPathRef.current === fullPath) {
      return;
    }

    lastPathRef.current = fullPath;

    let attempts = 0;

    const sendPageView = () => {
      if (typeof window === "undefined") {
        return;
      }

      if (window.gtag) {
        window.gtag("event", "page_view", {
          page_path: fullPath,
          page_location: window.location.href,
          page_title: document.title,
          send_to: measurementId,
        });
        return;
      }

      if (attempts < 10) {
        attempts += 1;
        window.setTimeout(sendPageView, 250);
      }
    };

    sendPageView();
  }, [enabled, measurementId, pathname, searchParams]);

  return null;
}
