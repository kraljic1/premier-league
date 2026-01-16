"use client";

import { useEffect } from "react";

/**
 * Component to fix Next.js portal element issues
 * Hides empty or zero-sized portals that can cause layout problems
 */
export function PortalFix() {
  useEffect(() => {
    // Function to hide empty portals
    const hideEmptyPortals = () => {
      const portals = document.querySelectorAll("nextjs-portal");
      portals.forEach((portal) => {
        const element = portal as HTMLElement;
        const rect = element.getBoundingClientRect();
        
        // Hide portal if it's empty or has zero dimensions
        if (
          element.children.length === 0 ||
          (rect.width === 0 && rect.height === 0)
        ) {
          element.style.display = "none";
          element.style.visibility = "hidden";
          element.style.pointerEvents = "none";
        } else {
          // Show portal if it has content
          element.style.display = "";
          element.style.visibility = "";
          element.style.pointerEvents = "";
        }
      });
    };

    // Run immediately
    hideEmptyPortals();

    // Watch for new portals being added
    const observer = new MutationObserver(hideEmptyPortals);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Cleanup
    return () => {
      observer.disconnect();
    };
  }, []);

  return null;
}
