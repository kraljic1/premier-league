"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((registration) => {
          console.log("Service Worker registered successfully");
        })
        .catch((registrationError) => {
          console.error("Service Worker registration failed:", registrationError.message || registrationError);
        });
    }
  }, []);

  return null;
}

