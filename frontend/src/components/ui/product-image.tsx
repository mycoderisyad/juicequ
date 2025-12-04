"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { getPlaceholderImage } from "@/lib/image-utils";

interface ProductImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Product name for alt text fallback */
  productName?: string;
  /** Background color class as fallback (e.g., "bg-green-500") */
  colorFallback?: string;
  /** Show color overlay instead of placeholder on error */
  useColorOnError?: boolean;
}

/**
 * ProductImage component with automatic fallback handling.
 * 
 * - Shows actual image if available
 * - Falls back to placeholder or color on error/404
 * - Handles loading state gracefully
 */
export function ProductImage({
  src,
  alt,
  productName,
  colorFallback,
  useColorOnError = false,
  className,
  ...props
}: ProductImageProps) {
  const [hasError, setHasError] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(true);

  // Reset error state when src changes
  React.useEffect(() => {
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  const displayAlt = alt || productName || "Product image";

  // If no src or error occurred, show fallback
  if (!src || hasError) {
    // Use color fallback if specified
    if (useColorOnError && colorFallback) {
      return (
        <div
          className={cn(
            "flex items-center justify-center",
            colorFallback,
            className
          )}
          role="img"
          aria-label={displayAlt}
        >
          <div
            className={cn(
              "h-1/2 w-1/2 rounded-full opacity-80 shadow-lg",
              colorFallback
            )}
          />
        </div>
      );
    }

    // Default placeholder
    return (
      <img
        src={getPlaceholderImage()}
        alt={displayAlt}
        className={className}
        {...props}
      />
    );
  }

  return (
    <>
      {/* Loading placeholder */}
      {isLoading && (
        <div
          className={cn(
            "absolute inset-0 animate-pulse bg-gray-200",
            className
          )}
        />
      )}
      <img
        src={src}
        alt={displayAlt}
        className={cn(
          isLoading && "opacity-0",
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        {...props}
      />
    </>
  );
}

export default ProductImage;
