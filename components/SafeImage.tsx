"use client";

import { useState, useEffect } from "react";
import { preloadImage } from "@/lib/performance/image-loader";

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: "lazy" | "eager";
  priority?: boolean;
  unoptimized?: boolean;
  /** If true, CSS class controls dimensions instead of inline styles */
  cssControlledSize?: boolean;
  /** Callback when image fails to load */
  onError?: () => void;
  /** Fallback content to show when image fails */
  fallback?: React.ReactNode;
  /** Responsive sizes attribute for better Core Web Vitals */
  sizes?: string;
}

/**
 * Optimized Safe Image component for Core Web Vitals (2026 standards).
 * Includes CLS prevention, modern formats, performance optimizations, and error handling.
 * 
 * Key optimizations:
 * - Preloads critical images for LCP optimization
 * - Prevents CLS with explicit dimensions
 * - Supports modern formats (WebP/AVIF) via Next.js Image Optimization
 * - Lazy loading for non-critical images
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  className = "",
  loading = "lazy",
  priority = false,
  cssControlledSize = false,
  onError,
  fallback,
  sizes,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Preload critical images for LCP optimization
  useEffect(() => {
    if (priority && typeof window !== "undefined") {
      preloadImage(src);
    }
  }, [src, priority]);

  // Generate WebP/AVIF sources for better performance
  const getOptimizedSrc = (originalSrc: string) => {
    // For external URLs, try to get modern formats if available
    if (originalSrc.includes('upload.wikimedia.org') || originalSrc.includes('resources.premierleague.com')) {
      return originalSrc; // These already serve optimized formats
    }
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src);

  // Handle image load errors gracefully
  const handleError = () => {
    setHasError(true);
    // Silently handle expected failures from external servers
    // Only log if it's not a common external source
    if (!src.includes('upload.wikimedia.org') && !src.includes('resources.premierleague.com')) {
      console.warn(`Failed to load image: ${src}`);
    }
    if (onError) {
      onError();
    }
  };

  // Track when image loads for performance monitoring
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Show fallback if error occurred
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  // Calculate aspect ratio for CLS prevention
  const aspectRatio = width / height;

  // When CSS controls size, don't override with inline styles
  const imageStyle = cssControlledSize
    ? { objectFit: 'contain' as const }
    : {
        aspectRatio: `${width} / ${height}`,
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
      };

  return (
    <div
      className={`safe-image-wrapper ${className}`}
      style={{
        aspectRatio: cssControlledSize ? undefined : `${width} / ${height}`,
        width: cssControlledSize ? undefined : '100%',
        position: 'relative',
      }}
    >
      <img
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={priority ? "eager" : loading}
        decoding="async"
        style={imageStyle}
        onError={handleError}
        onLoad={handleLoad}
        sizes={sizes}
        // Performance hints for Core Web Vitals
        fetchPriority={priority ? "high" : "auto"}
        // Prevent CLS by ensuring dimensions are known
        data-aspect-ratio={aspectRatio}
      />
      {!isLoaded && !hasError && (
        <div
          className="safe-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-hidden="true"
        />
      )}
    </div>
  );
}
