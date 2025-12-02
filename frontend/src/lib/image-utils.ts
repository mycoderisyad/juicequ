/**
 * Image utilities for handling product images
 * 
 * In development, images are served from /public/images/
 * In production, images will be served from external storage (S3, GCS, Cloudinary, etc.)
 */

const STORAGE_BASE_URL = process.env.NEXT_PUBLIC_STORAGE_URL || '';

/**
 * Get the full URL for a product image
 * @param path - Relative path to the image (e.g., "products/hero/berry-blast.png")
 * @returns Full URL to the image
 */
export function getImageUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  // In production, use external storage URL
  if (STORAGE_BASE_URL) {
    return `${STORAGE_BASE_URL}/${cleanPath}`;
  }
  
  // In development, use local public folder
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
