"use client";

import { useState, useMemo, useEffect, useCallback, Suspense, useRef } from "react";
import type React from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingBag, RefreshCw, AlertCircle, ChevronDown, SlidersHorizontal, X, Check, ListFilter, Tag, SearchX, Star, ChevronUp } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { productsApi, type Product as ApiProduct, type Category } from "@/lib/api/customer";
import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/lib/hooks/use-store";
import { getImageUrl } from "@/lib/image-utils";
import { Button } from "@/components/ui/button";

interface DisplayProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  calories: number;
  category_id: string;
  category_name: string;
  color: string;
  thumbnail_image?: string;
  stock_quantity?: number;
  is_available?: boolean;
  rating?: number;
  reviews?: number;
  // Size variants
  has_sizes?: boolean;
  prices?: { small: number; medium: number; large: number };
  volumes?: { small: number; medium: number; large: number };
  volume_unit?: string;
}

interface DisplayCategory {
  id: string;
  name: string;
  icon?: React.ReactNode;
}

function getInitialCategory(searchParams: URLSearchParams): string {
  const categoryParam = searchParams.get("category");
  if (categoryParam) {
    return categoryParam;
  }
  return "all";
}

function getInitialSort(searchParams: URLSearchParams): "default" | "low-high" | "high-low" {
  const sortParam = searchParams.get("sort");
  if (sortParam === "price_asc" || sortParam === "low-high") {
    return "low-high";
  } else if (sortParam === "price_desc" || sortParam === "high-low") {
    return "high-low";
  } else if (sortParam === "popular") {
    return "default";
  }
  return "default";
}

function getInitialSearch(searchParams: URLSearchParams): string {
  return searchParams.get("search") || "";
}

// Transform API product to display format
function transformProduct(product: ApiProduct): DisplayProduct {
  // Use base_price as primary, fallback to price if available
  const priceValue = product.base_price || product.price || 0;
  return {
    id: String(product.id),
    name: product.name,
    description: product.description,
    price: priceValue.toString(),
    calories: product.calories || 0,
    category_id: product.category_id || "uncategorized",
    category_name: product.category_name || product.category || "Uncategorized",
    color: product.image_color || product.image_url || "bg-green-500",
    thumbnail_image: product.thumbnail_image || product.bottle_image || product.hero_image,
    stock_quantity: product.stock_quantity,
    is_available: product.is_available ?? true,
    rating: product.rating,
    reviews: product.reviews,
    // Size variants
    has_sizes: product.has_sizes ?? true,
    prices: product.prices,
    volumes: product.volumes,
    volume_unit: product.volume_unit || "ml",
  };
}

const PAGE_SIZE = 8;

export default function MenuPage() {
  return (
    <Suspense fallback={<MenuLoadingSkeleton />}>
      <MenuContent />
    </Suspense>
  );
}

function MenuLoadingSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          <div className="mb-10 text-center">
            <Skeleton className="mx-auto h-10 w-48" />
            <Skeleton className="mx-auto mt-2 h-6 w-64" />
          </div>
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <Skeleton className="h-12 w-full max-w-md" />
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-24 rounded-full" />
              ))}
            </div>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="rounded-3xl border border-gray-100 p-4">
                <Skeleton className="mb-4 aspect-square w-full rounded-2xl" />
                <Skeleton className="mb-2 h-6 w-3/4" />
                <Skeleton className="mb-4 h-4 w-1/2" />
                <Skeleton className="h-12 w-full" />
              </div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function MenuContent() {
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>(() => getInitialSearch(searchParams));
  const [activeCategory, setActiveCategory] = useState<string>(() => getInitialCategory(searchParams));

  // Filter dropdowns state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [sortOrder, setSortOrder] = useState<"default" | "low-high" | "high-low">(() => getInitialSort(searchParams));

  // Size selector state: item_id -> selected size
  const [selectedSizes, setSelectedSizes] = useState<Record<string, "small" | "medium" | "large">>({});
  const cartItems = useCartStore((state) => state.items);
  const addItem = useCartStore((state) => state.addItem);
  const removeItem = useCartStore((state) => state.removeItem);
  const [modalProduct, setModalProduct] = useState<DisplayProduct | null>(null);
  const [modalQuantities, setModalQuantities] = useState<{ small: number; medium: number; large: number }>({ small: 0, medium: 0, large: 0 });
  const [modalSugar, setModalSugar] = useState<string>("Normal");
  const [showCartDrawer, setShowCartDrawer] = useState(false);
  const sugarOptions = [
    t("product.sugar.normal"),
    t("product.sugar.less"),
    t("product.sugar.none"),
    t("product.sugar.extra"),
  ];

  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);

  // API state
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [categories, setCategories] = useState<DisplayCategory[]>([{ id: "all", name: "All", icon: <ListFilter className="h-4 w-4" /> }]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setIsCategoryOpen(false);
      }
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(event.target as Node)) {
        setIsPriceOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync state with URL params when they change (e.g., from voice command)
  useEffect(() => {
    const urlCategory = getInitialCategory(searchParams);
    const urlSort = getInitialSort(searchParams);
    const urlSearch = getInitialSearch(searchParams);

    if (urlCategory !== activeCategory) {
      setActiveCategory(urlCategory);
    }
    if (urlSort !== sortOrder) {
      setSortOrder(urlSort);
    }
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeCategory, priceRange.min, priceRange.max, sortOrder]);

  // Fetch products and categories from API
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Fetch both products and categories
      const [productsResponse, categoriesResponse] = await Promise.all([
        productsApi.getAll(),
        productsApi.getCategories(),
      ]);

      if (productsResponse.items && productsResponse.items.length > 0) {
        const transformed = productsResponse.items.map(transformProduct);
        setProducts(transformed);
      } else {
        setProducts([]);
      }

      // Set categories from API (backend already includes "All" category)
      if (categoriesResponse.categories && categoriesResponse.categories.length > 0) {
        const apiCategories: DisplayCategory[] = categoriesResponse.categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: <Tag className="h-4 w-4" />,
        }));
        setCategories(apiCategories);
      }
    } catch {
      setProducts([]);
      setError("Failed to load products from server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getSelectedSize = (id: string): "small" | "medium" | "large" => selectedSizes[id] || "medium";

  const setSelectedSize = (id: string, size: "small" | "medium" | "large") => {
    setSelectedSizes(prev => ({ ...prev, [id]: size }));
  };

  const getItemPrice = (item: DisplayProduct, size: "small" | "medium" | "large"): number => {
    if (item.prices && item.prices[size]) {
      return item.prices[size];
    }
    // Default calculation based on base price
    const basePrice = parseFloat(item.price) || 0;
    const multipliers = { small: 0.8, medium: 1.0, large: 1.2 };
    return Math.round(basePrice * multipliers[size]);
  };

  const getItemVolume = (item: DisplayProduct, size: "small" | "medium" | "large"): number => {
    if (item.volumes && item.volumes[size]) {
      return item.volumes[size];
    }
    // Default volumes
    const defaultVolumes = { small: 250, medium: 350, large: 500 };
    return defaultVolumes[size];
  };

  const getCartCount = (productId: string) =>
    cartItems
      .filter((i) => i.productId === productId)
      .reduce((acc, item) => acc + item.quantity, 0);
  const drawerTotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  const getCartQuantitiesBySize = (productId: string) => {
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
  };

  const openAddModal = (e: React.MouseEvent, item: DisplayProduct) => {
    e.preventDefault();
    e.stopPropagation();
    const size = getSelectedSize(item.id);
    const existing = getCartQuantitiesBySize(item.id);
    const totalExisting = existing.small + existing.medium + existing.large;
    setModalProduct(item);
    setModalQuantities(
      totalExisting > 0 ? existing : { small: 0, medium: 0, large: 0, [size]: 1 }
    );
    setModalSugar("Normal");
  };

  const updateModalQty = (size: "small" | "medium" | "large", delta: number) => {
    setModalQuantities((prev) => ({ ...prev, [size]: Math.max(0, prev[size] + delta) }));
  };

  const modalTotal = useMemo(() => {
    if (!modalProduct) return 0;
    return (["small", "medium", "large"] as const).reduce((sum, size) => {
      const qty = modalQuantities[size];
      if (qty <= 0) return sum;
      const price = getItemPrice(modalProduct, size);
      return sum + price * qty;
    }, 0);
  }, [modalProduct, modalQuantities]);

  const handleModalConfirm = () => {
    if (!modalProduct) return;
    // Replace existing entries for this product with the new selection
    cartItems
      .filter((i) => i.productId === modalProduct.id)
      .forEach((i) => removeItem(i.id));

    (["small", "medium", "large"] as const).forEach((size) => {
      const qty = modalQuantities[size];
      if (qty > 0) {
        const price = getItemPrice(modalProduct, size);
        const volume = getItemVolume(modalProduct, size);
        const itemName = `${modalProduct.name} (${size === "small" ? "S" : size === "medium" ? "M" : "L"})`;
        addItem({
          id: `${modalProduct.id}-${size}`,
          productId: modalProduct.id,
          name: itemName,
          price,
          color: modalProduct.color,
          image: modalProduct.thumbnail_image,
          size,
          volume,
          volumeUnit: modalProduct.volume_unit,
          notes: `Sugar: ${modalSugar}`,
          quantity: qty,
        });
      }
    });
    setModalProduct(null);
  };

  const filteredItems = useMemo(() => {
    let filtered = products.filter((item) => {
      // Filter by category ID
      const matchesCategory = activeCategory === "all" ||
        item.category_id.toLowerCase() === activeCategory.toLowerCase();

      // Filter by search query
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);

      // Filter by price range
      const price = parseFloat(item.price);
      const matchesMinPrice = priceRange.min === null || price >= priceRange.min;
      const matchesMaxPrice = priceRange.max === null || price <= priceRange.max;

      return matchesCategory && matchesSearch && matchesMinPrice && matchesMaxPrice;
    });

    // Sort by price
    if (sortOrder === "low-high") {
      filtered = [...filtered].sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortOrder === "high-low") {
      filtered = [...filtered].sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    return filtered;
  }, [products, searchQuery, activeCategory, priceRange, sortOrder]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE)),
    [filteredItems.length]
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredItems.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredItems, currentPage]);

  const pageStart = filteredItems.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(filteredItems.length, currentPage * PAGE_SIZE);

  // Get active category name
  const activeCategoryName = categories.find(c => c.id.toLowerCase() === activeCategory.toLowerCase())?.name || "All";

  // Check if any filter is active
  const hasActiveFilters = activeCategory !== "all" || priceRange.min !== null || priceRange.max !== null || sortOrder !== "default";

  // Clear all filters
  const clearAllFilters = () => {
    setActiveCategory("all");
    setPriceRange({ min: null, max: null });
    setSortOrder("default");
    setSearchQuery("");
  };

  const handleAddToCart = (e: React.MouseEvent, item: DisplayProduct) => {
    openAddModal(e, item);
  };

  // Loading skeleton
  if (isLoading) {
    return <MenuLoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />

      <main id="main-content" className="flex-1 pt-28 pb-10 bg-stone-50">
        <div className="container mx-auto px-4 md:px-6">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-yellow-50 p-4 text-yellow-800" role="alert">
              <span>{error}</span>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 text-sm font-medium hover:underline"
                aria-label={t("menu.filter.retry")}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {t("menu.filter.retry")}
              </button>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-10 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {t("menu.badge") || "Fresh & Healthy"}
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif font-medium text-emerald-950 tracking-tight">
              {t("menu.title")}
            </h1>
            <p className="mt-3 text-stone-500 text-sm sm:text-base max-w-md mx-auto">{t("menu.subtitle")}</p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400" />
              <Input
                placeholder={t("menu.searchPlaceholder")}
                className="pl-12 h-12 rounded-full bg-white"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Dropdown */}
              <div className="relative" ref={categoryDropdownRef}>
                <button
                  onClick={() => {
                    setIsCategoryOpen(!isCategoryOpen);
                    setIsPriceOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all shadow-sm ${activeCategory !== "all"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-stone-200 text-stone-700 hover:border-stone-300"
                    }`}
                >
                  <span className="font-medium text-sm">{activeCategoryName}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                </button>

                {isCategoryOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-56 rounded-2xl bg-white shadow-lg border border-stone-100 py-2 max-h-64 overflow-y-auto">
                    {categories.map((category) => {
                      const isActive = activeCategory.toLowerCase() === category.id.toLowerCase();
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setActiveCategory(category.id);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-stone-50 transition-colors ${isActive ? "bg-emerald-50 text-emerald-700" : "text-stone-700"
                            }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{category.name}</span>
                          </div>
                          {isActive && <Check className="h-4 w-4 text-emerald-600" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Price Filter Dropdown */}
              <div className="relative" ref={priceDropdownRef}>
                <button
                  onClick={() => {
                    setIsPriceOpen(!isPriceOpen);
                    setIsCategoryOpen(false);
                  }}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-full border transition-all shadow-sm ${priceRange.min !== null || priceRange.max !== null || sortOrder !== "default"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                    : "bg-white border-stone-200 text-stone-700 hover:border-stone-300"
                    }`}
                >
                  <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
                  <span className="font-medium text-sm">{t("menu.filter.price")}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isPriceOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>

                {isPriceOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-white shadow-lg border border-stone-100 p-4">
                    {/* Sort Order */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">{t("menu.filter.sortBy")}</p>
                      <div className="flex flex-col gap-1" role="radiogroup" aria-label={t("menu.filter.sortBy")}>
                        {[
                          { value: "default", labelKey: "menu.filter.sortDefault" as const },
                          { value: "low-high", labelKey: "menu.filter.sortPriceLowHigh" as const },
                          { value: "high-low", labelKey: "menu.filter.sortPriceHighLow" as const },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSortOrder(option.value as typeof sortOrder)}
                            role="radio"
                            aria-checked={sortOrder === option.value}
                            className={`flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${sortOrder === option.value
                              ? "bg-emerald-50 text-emerald-700"
                              : "text-stone-700 hover:bg-stone-50"
                              }`}
                          >
                            <span>{t(option.labelKey)}</span>
                            {sortOrder === option.value && <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Price Range */}
                    <div className="border-t border-stone-100 pt-4">
                      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">{t("menu.filter.priceRange")}</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <label htmlFor="price-min" className="sr-only">Minimum price</label>
                          <input
                            id="price-min"
                            type="number"
                            placeholder="Min"
                            value={priceRange.min ?? ""}
                            onChange={(e) => setPriceRange(prev => ({
                              ...prev,
                              min: e.target.value ? parseInt(e.target.value) : null
                            }))}
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <span className="text-stone-400" aria-hidden="true">-</span>
                        <div className="flex-1">
                          <label htmlFor="price-max" className="sr-only">Maximum price</label>
                          <input
                            id="price-max"
                            type="number"
                            placeholder="Max"
                            value={priceRange.max ?? ""}
                            onChange={(e) => setPriceRange(prev => ({
                              ...prev,
                              max: e.target.value ? parseInt(e.target.value) : null
                            }))}
                            className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Apply/Clear Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-stone-100">
                      <button
                        onClick={() => {
                          setPriceRange({ min: null, max: null });
                          setSortOrder("default");
                        }}
                        className="flex-1 px-3 py-2 rounded-full text-sm font-medium text-stone-600 hover:bg-stone-100 transition-colors"
                      >
                        {t("menu.filter.reset")}
                      </button>
                      <button
                        onClick={() => setIsPriceOpen(false)}
                        className="flex-1 px-3 py-2 rounded-full text-sm font-medium bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                      >
                        {t("menu.filter.apply")}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Active Filters Count & Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span>{t("menu.filter.clearFilters")}</span>
                </button>
              )}

              {/* Results Count */}
              <div className="ml-auto text-sm text-stone-500" aria-live="polite">
                {filteredItems.length === 0
                  ? t("menu.filter.productsFound")
                  : `${pageStart}-${pageEnd} of ${filteredItems.length} ${t("menu.filter.productsFound")}`}
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <SearchX className="mb-4 h-16 w-16 text-stone-300" />
              <h3 className="text-xl font-serif font-medium text-emerald-950">{t("menu.noResults.title")}</h3>
              <p className="mt-2 text-stone-500">
                {t("menu.noResults.description")}
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 text-emerald-600 hover:underline font-medium"
              >
                {t("menu.noResults.clearFilters")}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginatedItems.map((item) => (
                <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm">

                  {/* Product Image & Badges */}
                  <Link href={`/products/${item.id}`} className="relative aspect-square overflow-hidden bg-stone-50">
                    {item.thumbnail_image && !item.thumbnail_image.startsWith('bg-') ? (
                      <img
                        src={getImageUrl(item.thumbnail_image)}
                        alt={`${item.name} - ${item.category_name}`}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center" aria-label={`${item.name} product`}>
                        <div className={`h-32 w-32 rounded-full ${item.color} opacity-80 shadow-lg transition-transform duration-500 group-hover:scale-110`} aria-hidden="true"></div>
                      </div>
                    )}

                    {/* Badges Container */}
                    <div className="absolute left-3 top-3 right-3 flex justify-between items-start z-10">
                      {/* Category Badge */}
                      <span className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-bold text-emerald-800 backdrop-blur-sm shadow-sm">
                        {item.category_name}
                      </span>

                      {/* Best Seller Badge (if rating >= 4.5) */}
                      {(item.rating && item.rating >= 4.5) && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                          <Star className="h-3 w-3 fill-current" />
                          Best Seller
                        </span>
                      )}
                    </div>
                  </Link>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-4">
                    <Link href={`/products/${item.id}`}>
                      <h3 className="font-serif text-lg font-bold text-emerald-950 line-clamp-1 mb-1 group-hover:text-emerald-600 transition-colors">
                        {item.name}
                      </h3>
                    </Link>

                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-stone-500">
                        {(item.has_sizes ?? true) && (
                          <span className="text-emerald-600 mr-2">
                            {getItemVolume(item, getSelectedSize(item.id))} {item.volume_unit || "ml"}
                          </span>
                        )}
                        <span className="text-xs text-stone-500">
                          Sto: <span className={item.stock_quantity && item.stock_quantity <= 10 ? "text-orange-500" : "text-stone-700"}>
                            {item.stock_quantity !== undefined ? item.stock_quantity : 0}
                          </span>
                        </span>
                      </span>
                      {/* Price */}
                      <span className="text-lg font-bold text-emerald-600">
                        {formatCurrency((item.has_sizes ?? true) ? getItemPrice(item, getSelectedSize(item.id)) : parseInt(item.price))}
                      </span>
                    </div>

                    {/* Size Selector */}
                    {(item.has_sizes ?? true) && (
                      <div className="mb-3 flex items-center justify-center gap-1" role="group" aria-label="Size selector">
                        {(["small", "medium", "large"] as const).map((size) => (
                          <button
                            key={size}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setSelectedSize(item.id, size);
                            }}
                            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all ${getSelectedSize(item.id) === size
                              ? "bg-emerald-600 text-white shadow-sm"
                              : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                              }`}
                            aria-pressed={getSelectedSize(item.id) === size}
                          >
                            {size === "small" ? "S" : size === "medium" ? "M" : "L"}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Controls */}
                    <div className="mt-auto flex items-center gap-3">
                      <button
                        onClick={(e) => handleAddToCart(e, item)}
                        className="flex flex-1 h-10 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-stone-400"
                        disabled={!item.is_available || (item.stock_quantity !== undefined && item.stock_quantity <= 0)}
                      >
                        <span>
                          {item.stock_quantity !== undefined && item.stock_quantity <= 0
                            ? "Stok Habis"
                            : (getCartCount(item.id) > 0
                              ? `${getCartCount(item.id)} ${t("cart.items")}`
                              : t("product.addToCart"))
                          }
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredItems.length > PAGE_SIZE && (
            <div className="mt-10 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                className="rounded-full border-stone-200 hover:bg-stone-50"
              >
                {t("common.previous")}
              </Button>
              <span className="text-sm text-stone-600 font-medium">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                className="rounded-full border-stone-200 hover:bg-stone-50"
              >
                {t("common.next")}
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Mini Cart Drawer (show only when items exist) */}
      {cartItems.length > 0 && (
        <div className={`fixed left-0 right-0 bottom-0 z-40 transition-all duration-300 ${showCartDrawer ? "h-64" : "h-14"}`}>
          <div className="mx-auto max-w-6xl rounded-t-2xl border border-stone-200 bg-white shadow-lg">
            <div className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {cartItems.length} {t("cart.items")}
                </p>
                <p className="text-xs text-gray-500">Total: {formatCurrency(drawerTotal)}</p>
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
                        {item.quantity} x {formatCurrency(item.price)} {item.notes ? `· ${item.notes}` : ""}
                      </p>
                    </div>
                    <span className="font-semibold text-gray-900">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add to Cart Modal */}
      {modalProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="w-full max-w-xl rounded-2xl bg-white shadow-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm font-medium text-emerald-600">{modalProduct.category_name}</p>
                <h3 id="modal-title" className="text-xl font-bold text-gray-900">{modalProduct.name}</h3>
              </div>
              <button
                onClick={() => setModalProduct(null)}
                aria-label={t("product.closeModal")}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  {t("product.selectSizeAndQuantity")}
                </p>
                {(["small", "medium", "large"] as const).map((size) => (
                  <div key={size} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 mb-2">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {size === "small" ? "Small (S)" : size === "medium" ? "Medium (M)" : "Large (L)"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {getItemVolume(modalProduct, size)} {modalProduct.volume_unit || "ml"} · {formatCurrency(getItemPrice(modalProduct, size))}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateModalQty(size, -1)}
                        className="h-8 w-8 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100"
                        aria-label={t("menu.decreaseQuantity")}
                      >
                        <span aria-hidden="true">-</span>
                      </button>
                      <span className="w-6 text-center font-semibold text-gray-900" aria-live="polite">{modalQuantities[size]}</span>
                      <button
                        onClick={() => updateModalQty(size, 1)}
                        className="h-8 w-8 rounded-full border border-stone-200 text-stone-600 hover:bg-stone-100"
                        aria-label={t("menu.increaseQuantity")}
                      >
                        <span aria-hidden="true">+</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">
                  {t("product.sugarOptions")}
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={t("product.sugarOptions")}>
                  {sugarOptions.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setModalSugar(opt)}
                      role="radio"
                      aria-checked={modalSugar === opt}
                      className={`rounded-full border px-3 py-1 text-sm ${modalSugar === opt ? "border-emerald-500 text-emerald-700 bg-emerald-50" : "border-stone-200 text-stone-600"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-stone-200 pt-4">
                <div>
                  <p className="text-sm text-gray-500">{t("common.total")}</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(modalTotal)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={() => setModalProduct(null)}>
                    {t("common.cancel")}
                  </Button>
                  <Button onClick={handleModalConfirm} disabled={modalTotal <= 0} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    {getCartCount(modalProduct.id) > 0 ? t("cart.updateCart") : t("product.addToCart")}
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
