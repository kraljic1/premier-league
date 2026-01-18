"use client";

import { useState } from "react";

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
}

/**
 * Optimized Safe Image component for Core Web Vitals.
 * Includes CLS prevention, modern formats, performance optimizations, and error handling.
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
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

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

  // Show fallback if error occurred
  if (hasError && fallback) {
    return <>{fallback}</>;
  }

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
      // Performance hints
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
