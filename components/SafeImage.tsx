"use client";

interface SafeImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: "lazy" | "eager";
  unoptimized: boolean;
}

/**
 * Safe Image component that uses regular img tag for all external images.
 * This prevents Next.js Image validation errors with external hostnames.
 * For small club logos and SVGs, the regular img tag is sufficient.
 */
export function SafeImage({
  src,
  alt,
  width,
  height,
  className = "",
  loading = "lazy",
}: SafeImageProps) {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading={loading}
    />
  );
}
