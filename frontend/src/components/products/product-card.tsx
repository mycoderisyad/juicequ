/**
 * Accessible product card component
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { Plus, Minus, ShoppingCart, Heart, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useCartStore } from "@/lib/store";
import { useCurrency } from "@/lib/hooks/use-store";
import { getPlaceholderImage, getImageUrl } from "@/lib/image-utils";

export interface ProductPromo {
  has_promo: boolean;
  promo_id?: string;
  promo_name?: string;
  promo_type?: "percentage" | "fixed";
  discount_value?: number;
  discount_percentage?: number;
  original_price?: number;
  discounted_price?: number;
  promo_end_date?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  base_price: number;
  calories?: number;
  category_id?: string;
  category_name?: string;
  image_url?: string;
  image_color?: string;
  thumbnail_image?: string;
  hero_image?: string;
  bottle_image?: string;
  is_available: boolean;
  stock_quantity?: number;
  is_featured?: boolean;
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sugar?: number;
  };
  prices?: {
    small?: number;
    medium?: number;
    large?: number;
  };
  volumes?: {
    small?: number;
    medium?: number;
    large?: number;
  };
  has_sizes?: boolean;
  volume_unit?: string;
  // Promo info
  promo?: ProductPromo | null;
}

interface ProductCardProps {
  product: Product;
  className?: string;
  onAddToCart?: (product: Product, quantity: number, size: string) => void;
}

type SizeType = "small" | "medium" | "large";

export function ProductCard({ product, className, onAddToCart }: ProductCardProps) {
  const [quantity, setQuantity] = React.useState(1);
  const [selectedSize, setSelectedSize] = React.useState<SizeType>("medium");
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [imageError, setImageError] = React.useState(false);
  const addItem = useCartStore((state) => state.addItem);
  const { format: formatCurrency } = useCurrency();

  // Get price based on selected size
  const getPrice = () => {
    if (product.prices && product.prices[selectedSize]) {
      return product.prices[selectedSize];
    }
    // Fallback to base_price with multiplier
    const multipliers = { small: 0.8, medium: 1.0, large: 1.3 };
    return Math.round(product.base_price * multipliers[selectedSize]);
  };

  // Get promo discounted price for size
  const getPromoPrice = () => {
    if (!product.promo?.has_promo) return null;
    const originalPrice = getPrice();

    // Use discounted_price from backend if available (for medium size)
    if (selectedSize === "medium" && product.promo.discounted_price) {
      return product.promo.discounted_price;
    }

    // Calculate for other sizes
    if (product.promo.promo_type === "percentage" && product.promo.discount_value) {
      return Math.round(originalPrice * (1 - product.promo.discount_value / 100));
    } else if (product.promo.discount_value) {
      return Math.max(0, originalPrice - product.promo.discount_value);
    }
    return null;
  };

  // Get discount percentage for badge
  const getDiscountPercent = () => {
    if (!product.promo?.has_promo) return 0;
    // Use discount_percentage from backend if available
    if (product.promo.discount_percentage) {
      return Math.round(product.promo.discount_percentage);
    }
    if (product.promo.promo_type === "percentage" && product.promo.discount_value) {
      return Math.round(product.promo.discount_value);
    } else if (product.promo.discount_value) {
      const originalPrice = getPrice();
      return Math.round((product.promo.discount_value / originalPrice) * 100);
    }
    return 0;
  };

  // Get volume based on selected size
  const getVolume = () => {
    if (product.volumes && product.volumes[selectedSize]) {
      return product.volumes[selectedSize];
    }
    const defaultVolumes = { small: 250, medium: 350, large: 500 };
    return defaultVolumes[selectedSize];
  };

  const displayPrice = getPrice();
  const promoPrice = getPromoPrice();
  const discountPercent = getDiscountPercent();
  const hasPromo = product.promo?.has_promo && promoPrice !== null;
  const displayVolume = getVolume();
  const volumeUnit = product.volume_unit || "ml";
  const hasSizes = product.has_sizes !== false;

  const handleIncrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((prev) => Math.min(99, prev + 1));
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (onAddToCart) {
      onAddToCart(product, quantity, selectedSize);
    } else {
      // Use global cart store - pass quantity directly
      const productImage = product.thumbnail_image || product.bottle_image || product.hero_image;
      const finalPrice = hasPromo && promoPrice !== null ? promoPrice : displayPrice;
      addItem({
        id: `${product.id}-${selectedSize}`,
        productId: product.id,
        name: `${product.name} (${selectedSize.charAt(0).toUpperCase()})`,
        price: finalPrice,
        color: product.image_color,
        image: productImage,
        quantity: quantity,
      });
    }

    // Reset quantity after adding
    setQuantity(1);
  };

  const handleSizeChange = (e: React.MouseEvent, size: SizeType) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedSize(size);
  };

  const handleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const imageColor = product.image_color || "bg-gray-200";
  const productImage = product.thumbnail_image || product.bottle_image || product.hero_image;

  // Check if productImage is a color class (bg-*) rather than actual image
  const isColorClass = productImage?.startsWith('bg-') || false;
  const hasValidImage = productImage && !isColorClass && !imageError;

  return (
    <Link
      href={`/products/${product.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600 focus-visible:ring-offset-2",
        !product.is_available && "opacity-60",
        className
      )}
    >
      {/* Image Area */}
      <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-gray-50">
        {hasValidImage ? (
          <>
            {/* Product image from database */}
            <img
              src={getImageUrl(productImage)}
              alt={product.name}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              onError={() => setImageError(true)}
            />
          </>
        ) : (
          <>
            {/* Background color overlay */}
            <div
              className={cn(
                "absolute inset-0 opacity-20 transition-opacity group-hover:opacity-30",
                imageColor
              )}
              aria-hidden="true"
            />

            {/* Product visual placeholder */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className={cn(
                  "h-32 w-32 rounded-full opacity-80 shadow-lg transition-transform duration-500 group-hover:scale-110",
                  imageColor
                )}
                aria-hidden="true"
              />
            </div>
          </>
        )}

        {/* Favorite button */}
        <button
          onClick={handleFavorite}
          className={cn(
            "absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm transition-colors",
            isFavorite
              ? "text-red-500 hover:bg-red-50"
              : "text-gray-600 hover:bg-red-50 hover:text-red-500"
          )}
          aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={isFavorite}
        >
          <Heart
            className={cn("h-5 w-5", isFavorite && "fill-current")}
            aria-hidden="true"
          />
        </button>

        {/* Category badge */}
        {product.category_name && (
          <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
            {product.category_name}
          </span>
        )}

        {/* Promo discount badge */}
        {hasPromo && discountPercent > 0 && (
          <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-red-500 px-2.5 py-1 text-white shadow-lg">
            <Percent className="h-3 w-3" aria-hidden="true" />
            <span className="text-xs font-bold">{discountPercent}% OFF</span>
          </div>
        )}

        {/* Featured badge */}
        {product.is_featured && !hasPromo && (
          <Badge
            variant="warning"
            className="absolute left-3 bottom-3"
          >
            Featured
          </Badge>
        )}

        {/* Low stock badge */}
        {product.is_available && product.stock_quantity !== undefined &&
          product.stock_quantity > 0 && product.stock_quantity <= 10 && (
            <Badge
              variant="destructive"
              className="absolute left-3 bottom-3"
            >
              Sisa: {product.stock_quantity}
            </Badge>
          )}

        {/* Out of stock overlay */}
        {!product.is_available && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <Badge variant="destructive" className="text-sm">
              Out of Stock
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-gray-900">
              {product.name}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {hasSizes && (
                <span className="text-green-600 font-medium">{displayVolume} {volumeUnit}</span>
              )}
              {product.calories !== undefined && product.calories > 0 && (
                <>
                  {hasSizes && <span className="text-gray-300">|</span>}
                  <span>{product.calories} kal</span>
                </>
              )}
            </div>
          </div>
          <div className="shrink-0 text-right">
            {hasPromo && promoPrice !== null ? (
              <>
                <span className="text-sm text-gray-400 line-through">
                  {formatCurrency(displayPrice)}
                </span>
                <span className="block text-lg font-bold text-red-500">
                  {formatCurrency(promoPrice)}
                </span>
              </>
            ) : (
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(displayPrice)}
              </span>
            )}
          </div>
        </div>

        <p className="mb-3 line-clamp-2 text-sm text-gray-600">
          {product.description}
        </p>

        {/* Size selector */}
        {hasSizes && (
          <div className="mb-3 flex items-center justify-center gap-1" role="group" aria-label="Size selector">
            {(["small", "medium", "large"] as SizeType[]).map((size) => (
              <button
                key={size}
                onClick={(e) => handleSizeChange(e, size)}
                className={cn(
                  "flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all",
                  selectedSize === size
                    ? "bg-green-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
                aria-pressed={selectedSize === size}
              >
                {size === "small" ? "S" : size === "medium" ? "M" : "L"}
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="mt-auto flex items-center justify-between">
          {/* Quantity selector */}
          <div
            className="flex items-center gap-2"
            role="group"
            aria-label="Quantity selector"
          >
            <button
              onClick={handleDecrement}
              disabled={quantity <= 1 || !product.is_available}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span
              className="w-8 text-center font-semibold text-gray-900"
              aria-live="polite"
              aria-label={`Quantity: ${quantity}`}
            >
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              disabled={quantity >= 99 || !product.is_available}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200 disabled:opacity-50"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Add to cart button */}
          <button
            onClick={handleAddToCart}
            disabled={!product.is_available}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white transition-all hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            aria-label={`Add ${quantity} ${product.name} to cart`}
          >
            <ShoppingCart className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </Link>
  );
}

export default ProductCard;
