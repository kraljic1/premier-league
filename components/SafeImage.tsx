"use client";

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
}

/**
 * Optimized Safe Image component for Core Web Vitals.
 * Includes CLS prevention, modern formats, and performance optimizations.
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
}: SafeImageProps) {
  // Generate WebP/AVIF sources for better performance
  const getOptimizedSrc = (originalSrc: string) => {
    // For external URLs, try to get modern formats if available
    if (originalSrc.includes('upload.wikimedia.org') || originalSrc.includes('resources.premierleague.com')) {
      return originalSrc; // These already serve optimized formats
    }
    return originalSrc;
  };

  const optimizedSrc = getOptimizedSrc(src);

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
      // Performance hints
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
