"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Input } from "@/components/ui/input";
import { Search, Plus, Minus, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useTranslation } from "@/lib/i18n";
import { menuItems, categories, type MenuItem, type Category } from "@/lib/data";
import Link from "next/link";

export default function MenuPage() {
  const addItem = useCartStore((state) => state.addItem);
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  const getQuantity = (id: number) => quantities[id] || 1;

  const incrementQuantity = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantities(prev => ({ ...prev, [id]: (prev[id] || 1) + 1 }));
  };

  const decrementQuantity = (e: React.MouseEvent, id: number) => {
    e.preventDefault();
    e.stopPropagation();
    setQuantities(prev => ({ ...prev, [id]: Math.max(1, (prev[id] || 1) - 1) }));
  };

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      // Filter by category
      const matchesCategory = activeCategory === "All" || item.category === activeCategory;
      
      // Filter by search query
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query);
      
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, activeCategory]);

  const handleAddToCart = (e: React.MouseEvent, item: MenuItem) => {
    e.preventDefault();
    e.stopPropagation();
    const qty = getQuantity(item.id);
    for (let i = 0; i < qty; i++) {
      addItem({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price),
        color: item.color
      });
    }
    // Reset quantity after adding
    setQuantities(prev => ({ ...prev, [item.id]: 1 }));
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-900">{t("menu.title")}</h1>
            <p className="mt-2 text-gray-600">{t("menu.subtitle")}</p>
          </div>

          {/* Search and Filter */}
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder={t("menu.searchPlaceholder")}
                className="pl-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-6 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                    activeCategory === category 
                      ? "bg-green-600 text-white" 
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-6xl">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900">{t("menu.noResults.title")}</h3>
              <p className="mt-2 text-gray-500">
                {t("menu.noResults.description")}
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-4 text-green-600 hover:underline"
              >
                {t("menu.noResults.clearFilters")}
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredItems.map((item) => (
                <Link href={`/products/${item.id}`} key={item.id} className="group relative flex flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white p-4 shadow-sm transition-all hover:shadow-xl hover:shadow-gray-200/50">
                  {/* Image Placeholder */}
                  <div className="relative mb-4 aspect-square overflow-hidden rounded-2xl bg-gray-50">
                    <div className={`absolute inset-0 ${item.color} opacity-20 transition-opacity group-hover:opacity-30`}></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`h-32 w-32 rounded-full ${item.color} opacity-80 shadow-lg transition-transform duration-500 group-hover:scale-110`}></div>
                    </div>
                    <button 
                      onClick={(e) => e.preventDefault()}
                      className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-900 backdrop-blur-sm transition-colors hover:bg-red-50 hover:text-red-500"
                    >
                      <span className="sr-only">{t("menu.addToFavorites")}</span>
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                    {/* Category Badge */}
                    <span className="absolute left-3 top-3 rounded-full bg-white/80 px-2 py-1 text-xs font-medium text-gray-700 backdrop-blur-sm">
                      {item.category}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col">
                    <div className="mb-2 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                        <p className="text-sm text-gray-500">{item.calories} {t("common.cal")}</p>
                      </div>
                      <span className="text-lg font-bold text-green-600">${item.price}</span>
                    </div>
                    
                    <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                      {item.description}
                    </p>

                    {/* Quantity Controls and Add to Cart */}
                    <div className="mt-auto flex items-center justify-between">
                      {/* Quantity Selector */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => decrementQuantity(e, item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-semibold text-gray-900">
                          {getQuantity(item.id)}
                        </span>
                        <button
                          onClick={(e) => incrementQuantity(e, item.id)}
                          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-600 transition-colors hover:bg-gray-200"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Add to Cart Button */}
                      <button
                        onClick={(e) => handleAddToCart(e, item)}
                        className="flex h-12 w-12 items-center justify-center rounded-full bg-green-600 text-white transition-all hover:bg-green-700 hover:scale-105 active:scale-95"
                      >
                        <ShoppingCart className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
