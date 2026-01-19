/**
 * Mobile SEO utilities for 2026 standards
 * Implements mobile-first indexing optimizations
 */

/**
 * Generate mobile-optimized viewport meta tag
 */
export function generateMobileViewport() {
  return {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    viewportFit: "cover" as const, // For iOS notch support
  };
}

/**
 * Generate mobile app manifest link
 */
export function generateMobileManifest() {
  return {
    manifest: "/manifest.json",
    appleWebApp: {
      capable: true,
      statusBarStyle: "black-translucent",
      title: "Premier League Tracker",
    },
  };
}

/**
 * Generate mobile-optimized meta tags
 */
export function generateMobileMetaTags() {
  return {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "format-detection": "telephone=no",
    "theme-color": "#37003c",
  };
}

/**
 * Check if device is mobile
 */
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Generate responsive image sizes for mobile
 */
export function generateMobileImageSizes(): string {
  return "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";
}
