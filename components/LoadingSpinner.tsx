"use client";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  const sizeClass = {
    sm: "loading-spinner--small",
    md: "loading-spinner--medium",
    lg: "loading-spinner--large",
  }[size];

  return (
    <div className={`loading-spinner ${sizeClass} ${className}`}>
      <div className="loading-spinner__ring">
        <div></div>
        <div></div>
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
