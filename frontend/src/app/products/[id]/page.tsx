"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, RefreshCw, X, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { productsApi, type Product as ApiProduct } from "@/lib/api/customer";
import { useCurrency } from "@/lib/hooks/use-store";
import { getImageUrl } from "@/lib/image-utils";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n";

type SizeType = "small" | "medium" | "large";

interface DisplayProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  calories: number;
  caloriesBySize?: { small?: number; medium?: number; large?: number };
  allergyWarning?: string | null;
  category: string;
  color: string;
  ingredients?: string[];
  thumbnail_image?: string;
  hero_image?: string;
  bottle_image?: string;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
  // Size variants
  has_sizes?: boolean;
  prices?: { small: number; medium: number; large: number };
  volumes?: { small: number; medium: number; large: number };
  volume_unit?: string;
  stock_quantity?: number;
  is_available?: boolean;
}

// Transform API product to display format
function transformProduct(product: ApiProduct): DisplayProduct {
  const priceValue = product.base_price || product.price || 0;
  return {
    id: String(product.id),
    name: product.name,
    description: product.description,
    price: priceValue.toString(),
    calories: product.calories || 0,
    caloriesBySize: product.calories_by_size || product.size_calories,
    allergyWarning: product.allergy_warning || null,
    category: product.category_id || product.category || "",
    color: product.image_color || product.image_url || "bg-green-500",
    ingredients: product.ingredients,
    thumbnail_image: product.thumbnail_image,
    hero_image: product.hero_image,
    bottle_image: product.bottle_image,
    nutrition: product.nutrition,
    // Size variants
    has_sizes: product.has_sizes ?? true,
    prices: product.prices,
    volumes: product.volumes,
    volume_unit: product.volume_unit || "ml",
    stock_quantity: product.stock_quantity,
    is_available: product.is_available ?? true,
  };
}

export default function ProductPage() {
  const params = useParams();
  const { t } = useTranslation();
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const { format } = useCurrency();
  const [product, setProduct] = useState<DisplayProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<SizeType>("medium");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalQuantities, setModalQuantities] = useState<{ small: number; medium: number; large: number }>({
    small: 0,
    medium: 0,
    large: 0,
  });
  const [modalSugar, setModalSugar] = useState<string>("Normal");
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const sugarOptions = [
    t("product.sugar.normal", "Normal"),
    t("product.sugar.less", "Less sugar"),
    t("product.sugar.none", "No sugar"),
    t("product.sugar.extra", "Extra sweet"),
  ];
  
  const idParam = params?.id;
  const idString = Array.isArray(idParam) ? idParam[0] : idParam;

  // Helper functions for size-based pricing
  const hasSizes = product?.has_sizes ?? true;
  
  const getPrice = useCallback((size: SizeType): number => {
    if (!product) return 0;
    if (product.prices && product.prices[size]) {
      return product.prices[size];
    }
    // Default calculation based on base price
    const basePrice = parseFloat(product.price) || 0;
    const multipliers = { small: 0.8, medium: 1.0, large: 1.2 };
    return Math.round(basePrice * multipliers[size]);
  }, [product]);

  const getCalories = useCallback(
    (size: SizeType): number | undefined => {
      if (!product) return undefined;
      if (product.caloriesBySize && product.caloriesBySize[size] !== undefined) {
        return product.caloriesBySize[size];
      }
      return product.calories;
    },
    [product]
  );

  const getVolume = useCallback((size: SizeType): number => {
    if (!product) return 0;
    if (product.volumes && product.volumes[size]) {
      return product.volumes[size];
    }
    // Default volumes
    const defaultVolumes = { small: 250, medium: 350, large: 500 };
    return defaultVolumes[size];
  }, [product]);

  const getCartCount = useCallback(
    (productId: string) =>
      cartItems.filter((i) => i.productId === productId).reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const displayPrice = getPrice(selectedSize);
  const displayVolume = getVolume(selectedSize);
  const displayCalories = getCalories(selectedSize);
  const volumeUnit = product?.volume_unit || "ml";
  const cartCount = product ? getCartCount(product.id) : 0;

  const fetchProduct = useCallback(async () => {
    if (!idString) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await productsApi.getById(idString);
      setProduct(transformProduct(response));
    } catch (err) {
      console.error("Failed to fetch product:", err);
      setError("Product not found or failed to load.");
    } finally {
      setIsLoading(false);
    }
  }, [idString]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const getCartQuantitiesBySize = useCallback(
    (productId: string) => {
      const base = { small: 0, medium: 0, large: 0 } as const;
      const entries = cartItems.filter((i) => i.productId === productId && i.size);
      return entries.reduce(
        (acc, item) => {
          if (item.size && acc[item.size] !== undefined) {
            acc[item.size] += item.quantity;
          }
          return acc;
        },
        { ...base }
      );
    },
    [cartItems]
  );

  const drawerTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  const modalTotal = useMemo(() => {
    if (!product) return 0;
    return (["small", "medium", "large"] as const).reduce((sum, size) => {
      const qty = modalQuantities[size];
      if (qty <= 0) return sum;
      const price = getPrice(size);
      return sum + price * qty;
    }, 0);
  }, [getPrice, modalQuantities, product]);

  const openModal = () => {
    if (!product) return;
    const existing = getCartQuantitiesBySize(product.id);
    const totalExisting = existing.small + existing.medium + existing.large;
    setModalQuantities(
      totalExisting > 0 ? existing : { small: 0, medium: 0, large: 0, [selectedSize]: 1 }
    );
    setModalSugar("Normal");
    setModalOpen(true);
  };

  const updateModalQty = (size: SizeType, delta: number) => {
    setModalQuantities((prev) => ({ ...prev, [size]: Math.max(0, prev[size] + delta) }));
  };

  const handleModalConfirm = () => {
    if (!product) return;
    const image = product.thumbnail_image || product.bottle_image || product.hero_image;
    // Replace existing entries for this product with the new selection
    cartItems.filter((i) => i.productId === product.id).forEach((i) => removeItem(i.id));

    (["small", "medium", "large"] as const).forEach((size) => {
      const qty = modalQuantities[size];
      if (qty > 0) {
        const price = getPrice(size);
        const volume = getVolume(size);
        addItem({
          id: `${product.id}-${size}`,
          productId: product.id,
          name: `${product.name} (${size === "small" ? "S" : size === "medium" ? "M" : "L"})`,
          price,
          color: product.color,
          image,
          size,
          volume,
          volumeUnit,
          notes: `Sugar: ${modalSugar}`,
          quantity: qty,
        });
      }
    });
    setModalOpen(false);
    setShowCartDrawer(true);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex-1 py-10">
          <div className="container mx-auto px-4">
            <Skeleton className="mb-8 h-6 w-32" />
            <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
              <Skeleton className="aspect-square w-full rounded-[3rem]" />
              <div className="flex flex-col justify-center space-y-6">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Not found state
  if (!product) {
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-center p-10">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <Link href="/menu" className="mt-4 text-emerald-600 hover:underline">
            Back to Menu
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-yellow-50 p-4 text-yellow-800">
              <span>{error}</span>
              <button
                onClick={fetchProduct}
                className="flex items-center gap-2 text-sm font-medium hover:underline"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}
          
          <Link href="/menu" className="mb-8 inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Link>

          <div className="grid gap-10 lg:grid-cols-2 lg:gap-20">
            {/* Product Image */}
            <div className="relative aspect-square overflow-hidden rounded-[3rem] bg-gray-50">
              {(product.thumbnail_image || product.bottle_image || product.hero_image) ? (
                <img
                  src={getImageUrl(product.thumbnail_image || product.bottle_image || product.hero_image)}
                  alt={product.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <>
                  <div className={`absolute inset-0 ${product.color} opacity-20`}></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`h-64 w-64 rounded-full ${product.color} opacity-80 shadow-2xl`}></div>
                  </div>
                </>
              )}
            </div>

            {/* Product Details */}
            <div className="flex flex-col justify-center">
              <div className="mb-6">
                <h1 className="mb-2 text-4xl font-bold text-gray-900">{product.name}</h1>
                <div className="flex items-center gap-4">
                  <span className="text-3xl font-bold text-emerald-600">{format(displayPrice)}</span>
                  {hasSizes && (
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700">
                      {displayVolume} {volumeUnit}
                    </span>
                  )}
                  {displayCalories !== undefined && (
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-medium text-amber-800">
                      {displayCalories} cal
                    </span>
                  )}
                </div>
              </div>

              <p className="mb-8 text-lg leading-relaxed text-gray-600">
                {product.description}
              </p>

              {product.allergyWarning && (
                <div className="mb-8 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  <AlertTriangle className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">Allergy notice</p>
                    <p className="mt-1">{product.allergyWarning}</p>
                  </div>
                </div>
              )}

              {/* Size Selector */}
              {hasSizes && (
                <div className="mb-8">
                  <h3 className="mb-3 font-semibold text-gray-900">Select Size</h3>
                  <div className="flex gap-3" role="group" aria-label="Size selector">
                    {(["small", "medium", "large"] as SizeType[]).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "flex-1 py-3 px-4 rounded-xl border-2 transition-all",
                          selectedSize === size
                            ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        )}
                        aria-pressed={selectedSize === size}
                      >
                        <div className="text-lg font-bold">
                          {size === "small" ? "S" : size === "medium" ? "M" : "L"}
                        </div>
                        <div className="text-sm opacity-75">
                          {getVolume(size)} {volumeUnit}
                        </div>
                        <div className="text-sm font-medium mt-1">
                          {format(getPrice(size))}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {product.ingredients && product.ingredients.length > 0 && (
                <div className="mb-8">
                  <h3 className="mb-3 font-semibold text-gray-900">Ingredients</h3>
                  <div className="flex flex-wrap gap-2">
                    {product.ingredients.map((tag) => (
                      <span key={tag} className="rounded-full border border-gray-200 px-4 py-1 text-sm text-gray-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                <Button
                  onClick={openModal}
                  disabled={!product.is_available || (product.stock_quantity !== undefined && product.stock_quantity <= 0)}
                  className="h-12 flex-1 rounded-full bg-emerald-600 text-lg font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {cartCount > 0 ? `${cartCount} ${t("cart.items")}` : t("product.addToCart")}
                </Button>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* Mini Cart Drawer (show only when items exist) */}
      {cartItems.length > 0 && (
        <div className={`fixed left-0 right-0 bottom-0 z-40 transition-all duration-300 ${showCartDrawer ? "h-64" : "h-14"}`}>
          <div className="mx-auto max-w-5xl rounded-t-2xl border border-stone-200 bg-white shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                </p>
                <p className="text-xs text-gray-500">Total: {format(drawerTotal)}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCartDrawer((v) => !v)}>
                  {showCartDrawer ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                </Button>
                <Link href="/cart">
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Checkout
                  </Button>
                </Link>
              </div>
            </div>
            {showCartDrawer && (
              <div className="max-h-44 overflow-y-auto border-t border-stone-100 px-4 py-3 space-y-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-semibold text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} x {format(item.price)} {item.notes ? `· ${item.notes}` : ""}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900">{format(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add to Cart Modal */}
      {modalOpen && product && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-modal-title"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-emerald-600">{product.category}</p>
                <h3 id="product-modal-title" className="text-xl font-bold text-gray-900">{product.name}</h3>
              </div>
              <button 
                onClick={() => setModalOpen(false)} 
                aria-label={t("product.closeModal", "Close dialog")} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  {t("product.selectSizeAndQuantity", "Choose size & quantity")}
                </p>
                {(["small", "medium", "large"] as const).map((size) => (
                  <div key={size} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {size === "small" ? "Small (S)" : size === "medium" ? "Medium (M)" : "Large (L)"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getVolume(size)} {volumeUnit} · {format(getPrice(size))}{" "}
                        {getCalories(size) !== undefined && `· ${getCalories(size)} cal`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateModalQty(size, -1)}
                        className="h-8 w-8 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100"
                        aria-label={t("menu.decreaseQuantity", "Decrease quantity")}
                      >
                        <span aria-hidden="true">-</span>
                      </button>
                      <span className="w-6 text-center font-semibold text-gray-900" aria-live="polite">{modalQuantities[size]}</span>
                      <button
                        onClick={() => updateModalQty(size, 1)}
                        className="h-8 w-8 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100"
                        aria-label={t("menu.increaseQuantity", "Increase quantity")}
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  {t("product.sugarOptions", "Sugar preference")}
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("product.sugarOptions", "Sugar preference")}>
                  {sugarOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setModalSugar(opt)}
                      role="radio"
                      aria-checked={modalSugar === opt}
                      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                        modalSugar === opt
                          ? "border-emerald-500 text-emerald-700 bg-emerald-50"
                          : "border-stone-200 text-stone-600 hover:border-stone-300"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-stone-50 px-4 py-3">
                <div>
                  <p className="text-xs text-gray-500">{t("common.total", "Total")}</p>
                  <p className="text-xl font-bold text-gray-900">{format(modalTotal)}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setModalOpen(false)}>
                    {t("common.cancel", "Cancel")}
                  </Button>
                  <Button
                    onClick={handleModalConfirm}
                    disabled={modalTotal <= 0}
                    className="bg-emerald-600 text-white hover:bg-emerald-700"
                  >
                    {cartCount > 0 ? t("cart.updateCart", "Update Cart") : t("product.addToCart")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
