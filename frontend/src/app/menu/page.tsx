"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { menuItems, categories, type MenuItem, type Category } from "@/lib/data";
import Link from "next/link";

export default function MenuPage() {
  const addItem = useCartStore((state) => state.addItem);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category>("All");

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
    e.preventDefault(); // Prevent navigation if clicking the button inside a Link
    addItem({
      id: item.id,
      name: item.name,
      price: parseFloat(item.price),
      color: item.color
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Header />
      
      <main className="flex-1 py-10">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-bold text-gray-900">Our Menu</h1>
            <p className="mt-2 text-gray-600">Freshly blended for you</p>
          </div>

          {/* Search and Filter */}
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input 
                placeholder="Search for smoothies, juices..." 
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
                      ? "bg-green-600 text-white shadow-lg shadow-green-600/20" 
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
              <h3 className="text-xl font-semibold text-gray-900">No items found</h3>
              <p className="mt-2 text-gray-500">
                Try adjusting your search or filter to find what you&apos;re looking for.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setActiveCategory("All");
                }}
                className="mt-4 text-green-600 hover:underline"
              >
                Clear filters
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
                      <span className="sr-only">Add to favorites</span>
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
                        <p className="text-sm text-gray-500">{item.calories} cal</p>
                      </div>
                      <span className="text-lg font-bold text-green-600">${item.price}</span>
                    </div>
                    
                    <p className="mb-4 line-clamp-2 text-sm text-gray-600">
                      {item.description}
                    </p>

                    <div className="mt-auto">
                      <Button 
                        onClick={(e) => handleAddToCart(e, item)}
                        className="w-full rounded-full bg-gray-900 text-white hover:bg-gray-800"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add to Cart
                      </Button>
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
