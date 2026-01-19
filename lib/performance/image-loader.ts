/**
 * Advanced image optimization utilities for Core Web Vitals optimization
 * Supports WebP/AVIF with fallbacks, responsive images, and lazy loading
 */

export interface ImageSource {
  src?: string;
  srcset?: string;
  sizes?: string;
  type?: string;
}

export interface OptimizedImageConfig {
  src: string;
  width: number;
  height: number;
  alt: string;
  priority?: boolean;
  quality?: number;
  format?: "webp" | "avif" | "auto";
}

/**
 * Generate responsive image sources with modern formats
 */
export function generateImageSources(
  baseSrc: string,
  widths: number[] = [640, 768, 1024, 1280, 1920]
): ImageSource[] {
  const sources: ImageSource[] = [];

  // Generate AVIF sources (best compression)
  if (supportsFormat("avif")) {
    sources.push({
      srcset: widths.map((w) => `${baseSrc}?w=${w}&format=avif ${w}w`).join(", "),
      type: "image/avif",
    });
  }

  // Generate WebP sources (good compression, wider support)
  if (supportsFormat("webp")) {
    sources.push({
      srcset: widths.map((w) => `${baseSrc}?w=${w}&format=webp ${w}w`).join(", "),
      type: "image/webp",
    });
  }

  // Fallback to original format
  sources.push({
    srcset: widths.map((w) => `${baseSrc}?w=${w} ${w}w`).join(", "),
  });

  return sources;
}

/**
 * Check if browser supports modern image format
 */
function supportsFormat(format: "webp" | "avif"): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;

  if (format === "webp") {
    return canvas.toDataURL("image/webp").indexOf("data:image/webp") === 0;
  }

  if (format === "avif") {
    return canvas.toDataURL("image/avif").indexOf("data:image/avif") === 0;
  }

  return false;
}

/**
 * Generate sizes attribute for responsive images
 */
export function generateSizesAttribute(breakpoints: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
  default: string;
}): string {
  const sizes: string[] = [];

  if (breakpoints.mobile) {
    sizes.push(`(max-width: 640px) ${breakpoints.mobile}`);
  }
  if (breakpoints.tablet) {
    sizes.push(`(max-width: 1024px) ${breakpoints.tablet}`);
  }
  if (breakpoints.desktop) {
    sizes.push(`(max-width: 1280px) ${breakpoints.desktop}`);
  }
  sizes.push(breakpoints.default);

  return sizes.join(", ");
}

/**
 * Preload critical images for LCP optimization
 */
export function preloadImage(src: string, as: "image" = "image"): void {
  if (typeof document === "undefined") {
    return;
  }

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = as;
  link.href = src;
  link.fetchPriority = "high";

  // Add crossorigin for external images
  if (src.startsWith("http")) {
    link.crossOrigin = "anonymous";
  }

  document.head.appendChild(link);
}

/**
 * Get optimal image format based on browser support
 */
export function getOptimalFormat(): "avif" | "webp" | "original" {
  if (typeof window === "undefined") {
    return "original";
  }

  if (supportsFormat("avif")) {
    return "avif";
  }

  if (supportsFormat("webp")) {
    return "webp";
  }

  return "original";
}
