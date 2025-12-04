/**
 * Image Upload Component for Products
 * Auto-converts images to WebP format
 */
"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Loader2, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadApi } from "@/lib/api/admin";

// Backend API URL for serving uploaded images
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";

/**
 * Convert a relative image URL to full URL if needed
 * e.g., /uploads/thumbnails/image.webp -> http://localhost:8000/uploads/thumbnails/image.webp
 */
function getFullImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // Already a full URL or data URL
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
    return url;
  }
  
  // Backend uploads path - prepend API base URL
  if (url.startsWith("/uploads/")) {
    return `${API_BASE_URL}${url}`;
  }
  
  // Frontend public path - keep as is (Next.js will handle it)
  if (url.startsWith("/images/")) {
    return url;
  }
  
  // Default: assume it's a backend path
  return `${API_BASE_URL}${url}`;
}

interface ImageUploadProps {
  label: string;
  imageType: "hero" | "bottle" | "thumbnail" | "catalog";
  productId?: string;
  currentImage?: string;
  onUploadComplete?: (url: string) => void;
  className?: string;
  helpText?: string;
}

export function ImageUpload({
  label,
  imageType,
  productId,
  currentImage,
  onUploadComplete,
  className,
  helpText,
}: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(getFullImageUrl(currentImage));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    url?: string;
    sizeReduction?: string;
    error?: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Update preview when currentImage changes
  React.useEffect(() => {
    setPreview(getFullImageUrl(currentImage));
  }, [currentImage]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp", "image/bmp"];
    if (!validTypes.includes(file.type)) {
      setUploadResult({ success: false, error: "Invalid file type. Use PNG, JPG, GIF, or WebP." });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadResult({ success: false, error: "File too large. Maximum 10MB." });
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload
    setIsUploading(true);
    setUploadResult(null);

    try {
      const result = await uploadApi.uploadImage(file, imageType, productId);
      const fullUrl = getFullImageUrl(result.url);
      setUploadResult({
        success: true,
        url: result.url,
        sizeReduction: result.size_reduction,
      });
      setPreview(fullUrl);
      onUploadComplete?.(result.url);
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleClear = () => {
    setPreview(null);
    setUploadResult(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && inputRef.current) {
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      inputRef.current.files = dataTransfer.files;
      inputRef.current.dispatchEvent(new Event("change", { bubbles: true }));
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      
      <div
        className={cn(
          "relative rounded-xl border-2 border-dashed transition-colors",
          preview ? "border-green-300 bg-green-50/50" : "border-gray-300 hover:border-gray-400",
          isUploading && "border-blue-300 bg-blue-50/50"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/bmp"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          disabled={isUploading}
        />

        {preview ? (
          <div className="relative aspect-video p-4">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-contain rounded-lg"
            />
            {!isUploading && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="absolute top-2 right-2 z-20 rounded-full bg-red-500 p-1 text-white shadow-lg hover:bg-red-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto" />
                  <p className="mt-2 text-sm text-blue-600">Converting to WebP...</p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            {isUploading ? (
              <>
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                <p className="mt-2 text-sm text-blue-600">Uploading & converting...</p>
              </>
            ) : (
              <>
                <div className="rounded-full bg-gray-100 p-3">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  <span className="font-medium text-green-600">Click to upload</span> or drag and drop
                </p>
                <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF, WebP (max 10MB)</p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Result message */}
      {uploadResult && (
        <div
          className={cn(
            "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
            uploadResult.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          )}
        >
          {uploadResult.success ? (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>Uploaded! Size reduced by {uploadResult.sizeReduction}</span>
            </>
          ) : (
            <>
              <X className="h-4 w-4" />
              <span>{uploadResult.error}</span>
            </>
          )}
        </div>
      )}

      {helpText && (
        <p className="text-xs text-gray-500">{helpText}</p>
      )}
    </div>
  );
}

interface BatchImageUploadProps {
  productId: string;
  currentImages?: {
    hero?: string;
    bottle?: string;
    thumbnail?: string;
  };
  onUploadComplete?: (images: { hero?: string; bottle?: string; thumbnail?: string }) => void;
}

export function BatchImageUpload({
  productId,
  currentImages,
  onUploadComplete,
}: BatchImageUploadProps) {
  const [images, setImages] = useState<{
    hero?: string;
    bottle?: string;
    thumbnail?: string;
  }>(currentImages || {});

  const handleImageUploaded = (type: "hero" | "bottle" | "thumbnail", url: string) => {
    const updated = { ...images, [type]: url };
    setImages(updated);
    onUploadComplete?.(updated);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Product Images</h3>
      <p className="text-sm text-gray-500">
        Upload images for hero section, product display, and thumbnails. All images are automatically converted to WebP for optimal performance.
      </p>

      <div className="grid gap-6 md:grid-cols-3">
        <ImageUpload
          label="Hero Background"
          imageType="hero"
          productId={productId}
          currentImage={images.hero}
          onUploadComplete={(url) => handleImageUploaded("hero", url)}
          helpText="Used as background in homepage hero section (recommended: 1920x1080)"
        />

        <ImageUpload
          label="Bottle/Product Image"
          imageType="bottle"
          productId={productId}
          currentImage={images.bottle}
          onUploadComplete={(url) => handleImageUploaded("bottle", url)}
          helpText="Product bottle image for hero section (recommended: 500x800, transparent PNG)"
        />

        <ImageUpload
          label="Thumbnail"
          imageType="thumbnail"
          productId={productId}
          currentImage={images.thumbnail}
          onUploadComplete={(url) => handleImageUploaded("thumbnail", url)}
          helpText="Thumbnail for product cards (recommended: 400x400)"
        />
      </div>
    </div>
  );
}

export default ImageUpload;
