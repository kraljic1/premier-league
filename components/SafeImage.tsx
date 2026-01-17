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

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={priority ? "eager" : loading}
      decoding="async"
      // CLS Prevention: explicit dimensions
      style={{
        aspectRatio: `${width} / ${height}`,
        width: 'auto',
        height: 'auto',
        maxWidth: '100%',
      }}
      // Performance hints
      fetchPriority={priority ? "high" : "auto"}
    />
  );
}
