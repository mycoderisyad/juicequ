"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { getPlaceholderImage } from "@/lib/image-utils";

// In-memory cache untuk track gambar yang gagal load
const failedImageCache = new Set<string>();

interface CachedImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderWidth?: number;
  placeholderHeight?: number;
}

function CachedImageComponent({
  src,
  alt,
  className = "",
  placeholderWidth = 400,
  placeholderHeight = 600,
}: CachedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(() => {
    // Jika gambar sudah pernah gagal, langsung pakai placeholder
    if (failedImageCache.has(src)) {
      return getPlaceholderImage(placeholderWidth, placeholderHeight);
    }
    return src;
  });

  const [hasError, setHasError] = useState(() => failedImageCache.has(src));

  // Update src jika prop berubah
  useEffect(() => {
    if (failedImageCache.has(src)) {
      setImageSrc(getPlaceholderImage(placeholderWidth, placeholderHeight));
      setHasError(true);
    } else {
      setImageSrc(src);
      setHasError(false);
    }
  }, [src, placeholderWidth, placeholderHeight]);

  const handleError = useCallback(() => {
    if (!hasError) {
      // Tambahkan ke cache agar tidak request ulang
      failedImageCache.add(src);
      setImageSrc(getPlaceholderImage(placeholderWidth, placeholderHeight));
      setHasError(true);
    }
  }, [src, hasError, placeholderWidth, placeholderHeight]);

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
    />
  );
}

// Memo untuk mencegah re-render yang tidak perlu
export const CachedImage = memo(CachedImageComponent);

// Utility untuk clear cache (jika diperlukan)
export function clearImageCache() {
  failedImageCache.clear();
}

// Utility untuk check apakah gambar sudah di-cache sebagai failed
export function isImageFailed(src: string): boolean {
  return failedImageCache.has(src);
}

