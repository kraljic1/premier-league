"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully");

          // Check for a newer service worker on first load.
          registration.update().catch((error) => {
            console.warn("Service worker update check failed:", error);
          });

          // Reload when a new service worker activates.
          let isRefreshing = false;
          navigator.serviceWorker.addEventListener("controllerchange", () => {
            if (isRefreshing) {
              return;
            }
            isRefreshing = true;
            window.location.reload();
          });

          // If a new service worker is found, wait for it to install.
          registration.addEventListener("updatefound", () => {
            const installingWorker = registration.installing;
            if (!installingWorker) {
              return;
            }

            installingWorker.addEventListener("statechange", () => {
              if (
                installingWorker.state === "installed" &&
                navigator.serviceWorker.controller
              ) {
                window.location.reload();
              }
            });
          });
        })
        .catch((registrationError) => {
          console.error("Service Worker registration failed:", registrationError.message || registrationError);
        });
    }
  }, []);

  return null;
}

