"use client";

import { useState, useMemo, useEffect, useCallback, Suspense, useRef } from "react";
import type React from "react";
import { useSearchParams } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Plus, Minus, ShoppingCart, RefreshCw, AlertCircle, ChevronDown, SlidersHorizontal, X, Check, ListFilter, Tag, SearchX, Star } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { productsApi, type Product as ApiProduct, type Category } from "@/lib/api/customer";
import Link from "next/link";
import Image from "next/image";
import { useCurrency } from "@/lib/hooks/use-store";
import { getImageUrl } from "@/lib/image-utils";

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
  };
}

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
  const addItem = useCartStore((state) => state.addItem);
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState<string>(() => getInitialSearch(searchParams));
  const [activeCategory, setActiveCategory] = useState<string>(() => getInitialCategory(searchParams));
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  
  // Filter dropdowns state
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isPriceOpen, setIsPriceOpen] = useState(false);
  const [priceRange, setPriceRange] = useState<{ min: number | null; max: number | null }>({ min: null, max: null });
  const [sortOrder, setSortOrder] = useState<"default" | "low-high" | "high-low">(() => getInitialSort(searchParams));
  
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const priceDropdownRef = useRef<HTMLDivElement>(null);
  
  // API state
  const [products, setProducts] = useState<DisplayProduct[]>([]);
  const [categories, setCategories] = useState<DisplayCategory[]>([{ id: "all", name: "All", icon: <ListFilter className="h-4 w-4" /> }]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setProducts([]);
      setError("Failed to load products from server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getQuantity = (id: string) => quantities[id] || 1;

  const incrementQuantity = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 1) + 1 }));
  };

  const decrementQuantity = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) - 1) }));
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

  // Get active category name
  const activeCategoryName = categories.find(c => c.id.toLowerCase() === activeCategory.toLowerCase())?.name || "All";
  const activeCategoryIcon = categories.find(c => c.id.toLowerCase() === activeCategory.toLowerCase())?.icon;
  
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
    e.preventDefault();
    e.stopPropagation();
    const qty = getQuantity(item.id);
    for (let i = 0; i < qty; i++) {
      addItem({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        color: item.color,
        image: item.thumbnail_image,
      });
    }
    // Reset quantity after adding
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  // Loading skeleton
  if (isLoading) {
    return <MenuLoadingSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1 pt-24 pb-10">
        <div className="container mx-auto px-4">
          {/* Error Banner */}
          {error && (
            <div className="mb-6 flex items-center justify-between rounded-xl bg-yellow-50 p-4 text-yellow-800">
              <span>{error}</span>
              <button
                onClick={fetchData}
                className="flex items-center gap-2 text-sm font-medium hover:underline"
              >
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-900">{t("menu.title")}</h1>
            <p className="mt-2 text-gray-600">{t("menu.subtitle")}</p>
          </div>

          {/* Search and Filter */}
          <div className="mb-8 space-y-4">
            {/* Search Bar */}
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder={t("menu.searchPlaceholder")}
                className="pl-12 h-12 rounded-xl"
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                    activeCategory !== "all"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {activeCategoryIcon && <span>{activeCategoryIcon}</span>}
                  <span className="font-medium">{activeCategoryName}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isCategoryOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-56 rounded-xl bg-white shadow-lg border border-gray-100 py-2 max-h-64 overflow-y-auto">
                    {categories.map((category) => {
                      const isActive = activeCategory.toLowerCase() === category.id.toLowerCase();
                      return (
                        <button
                          key={category.id}
                          onClick={() => {
                            setActiveCategory(category.id);
                            setIsCategoryOpen(false);
                          }}
                          className={`w-full flex items-center justify-between px-4 py-2.5 text-left hover:bg-gray-50 transition-colors ${
                            isActive ? "bg-green-50 text-green-700" : "text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            {category.icon && <span>{category.icon}</span>}
                            <span className="font-medium">{category.name}</span>
                          </div>
                          {isActive && <Check className="h-4 w-4 text-green-600" />}
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
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${
                    priceRange.min !== null || priceRange.max !== null || sortOrder !== "default"
                      ? "bg-green-50 border-green-200 text-green-700"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                  }`}
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="font-medium">Harga</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isPriceOpen ? "rotate-180" : ""}`} />
                </button>
                
                {isPriceOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl bg-white shadow-lg border border-gray-100 p-4">
                    {/* Sort Order */}
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Urutkan</p>
                      <div className="flex flex-col gap-1">
                        {[
                          { value: "default", label: "Default" },
                          { value: "low-high", label: "Harga: Rendah ke Tinggi" },
                          { value: "high-low", label: "Harga: Tinggi ke Rendah" },
                        ].map((option) => (
                          <button
                            key={option.value}
                            onClick={() => setSortOrder(option.value as typeof sortOrder)}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                              sortOrder === option.value
                                ? "bg-green-50 text-green-700"
                                : "text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            <span>{option.label}</span>
                            {sortOrder === option.value && <Check className="h-4 w-4 text-green-600" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* Price Range */}
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rentang Harga</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="Min"
                            value={priceRange.min ?? ""}
                            onChange={(e) => setPriceRange(prev => ({ 
                              ...prev, 
                              min: e.target.value ? parseInt(e.target.value) : null 
                            }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                          />
                        </div>
                        <span className="text-gray-400">-</span>
                        <div className="flex-1">
                          <input
                            type="number"
                            placeholder="Max"
                            value={priceRange.max ?? ""}
                            onChange={(e) => setPriceRange(prev => ({ 
                              ...prev, 
                              max: e.target.value ? parseInt(e.target.value) : null 
                            }))}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-green-500"
                          />
                        </div>
                      </div>
                    </div>
                    
                    {/* Apply/Clear Buttons */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => {
                          setPriceRange({ min: null, max: null });
                          setSortOrder("default");
                        }}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setIsPriceOpen(false)}
                        className="flex-1 px-3 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 transition-colors"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Active Filters Count & Clear */}
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span>Hapus Filter</span>
                </button>
              )}
              
              {/* Results Count */}
              <div className="ml-auto text-sm text-gray-500">
                {filteredItems.length} produk ditemukan
              </div>
            </div>
          </div>

          {/* Product Grid */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <SearchX className="mb-4 h-16 w-16 text-gray-300" />
              <h3 className="text-xl font-semibold text-gray-900">{t("menu.noResults.title")}</h3>
              <p className="mt-2 text-gray-500">
                {t("menu.noResults.description")}
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 text-green-600 hover:underline"
              >
                {t("menu.noResults.clearFilters")}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-stone-100 bg-white shadow-sm">
                  
                  {/* Product Image & Badges */}
                  <Link href={`/products/${item.id}`} className="relative aspect-square overflow-hidden bg-stone-50">
                    {item.thumbnail_image && !item.thumbnail_image.startsWith('bg-') ? (
                      <img
                        src={getImageUrl(item.thumbnail_image)}
                        alt={item.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <div className={`h-32 w-32 rounded-full ${item.color} opacity-80 shadow-lg transition-transform duration-500 group-hover:scale-110`}></div>
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
                         Stok: <span className={item.stock_quantity && item.stock_quantity <= 10 ? "text-orange-500" : "text-stone-700"}>
                           {item.stock_quantity || 0}
                         </span>
                       </span>
                       {/* Price */}
                       <span className="text-lg font-bold text-emerald-600">
                         {formatCurrency(parseInt(item.price))}
                       </span>
                    </div>

                    {/* Controls */}
                    <div className="mt-auto flex items-center gap-3">
                      {/* Quantity Selector */}
                      <div className="flex items-center rounded-full border border-stone-200 bg-stone-50 px-1 py-1">
                        <button
                          onClick={(e) => decrementQuantity(e, item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-stone-600 shadow-sm transition-colors hover:bg-stone-100 hover:text-emerald-600 focus:outline-none"
                          aria-label={t("menu.decreaseQuantity")}
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                        <span className="w-8 text-center text-sm font-bold text-stone-900">
                          {getQuantity(item.id)}
                        </span>
                        <button
                          onClick={(e) => incrementQuantity(e, item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-stone-600 shadow-sm transition-colors hover:bg-stone-100 hover:text-emerald-600 focus:outline-none"
                          aria-label={t("menu.increaseQuantity")}
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                        </button>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => handleAddToCart(e, item)}
                        className="flex flex-1 h-10 items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all hover:bg-emerald-700 hover:shadow-emerald-300 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={!item.is_available || (item.stock_quantity !== undefined && item.stock_quantity <= 0)}
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>{formatCurrency(parseFloat(item.price) * getQuantity(item.id))}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
