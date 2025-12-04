/**
 * Image utilities for handling product images
 * 
 * Images are stored on the local VPS server (same server as the application).
 * This approach is cost-effective for small businesses that don't need cloud storage.
 * 
 * In development: 
 * - Old images from /public/images/ (Next.js static)
 * - New uploads from backend /uploads/ endpoint
 * In production: all images served from backend /uploads/ endpoint
 */

// Backend API URL for serving uploaded images
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:8000";
const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || API_BASE_URL;

/**
 * Get the full URL for a product image
 * @param path - Relative path to the image (e.g., "products/hero/berry-blast.png")
 * @returns Full URL to the image
 */
export function getImageUrl(path: string | null | undefined): string {
  // Return placeholder if no path provided
  if (!path) {
    return getPlaceholderImage();
  }
  
  // If it's a Tailwind class (bg-*), return placeholder
  if (path.startsWith('bg-')) {
    return getPlaceholderImage();
  }
  
  // If it's a full URL already, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // If it's a data URL (base64), return as-is
  if (path.startsWith('data:')) {
    return path;
  }
  
  // If path starts with /uploads, it's from backend storage
  if (path.startsWith('/uploads/')) {
    return `${STORAGE_BASE_URL}${path}`;
  }
  
  // If path starts with /images, it's from frontend public folder (legacy)
  if (path.startsWith('/images/')) {
    return path;
  }
  
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // Check if path already includes 'images/' (frontend public)
  if (cleanPath.startsWith('images/')) {
    return `/${cleanPath}`;
  }
  
  // Default: assume it's a relative path, try frontend public
  return `/images/${cleanPath}`;
}

/**
 * Get the full URL for a product image in the products folder
 * @param category - Category folder (e.g., "hero", "catalog", "thumbnails")
 * @param filename - Image filename (e.g., "berry-blast.png")
 * @returns Full URL to the product image
 */
export function getProductImageUrl(category: string, filename: string): string {
  return getImageUrl(`products/${category}/${filename}`);
}

/**
 * Get placeholder image URL when product image is not available
 * @param width - Width of placeholder
 * @param height - Height of placeholder
 * @returns Placeholder image URL
 */
export function getPlaceholderImage(width: number = 400, height: number = 600): string {
  return `https://placehold.co/${width}x${height}/22c55e/white?text=JuiceQu`;
}
