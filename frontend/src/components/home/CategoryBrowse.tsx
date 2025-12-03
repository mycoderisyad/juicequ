"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { productsApi } from "@/lib/api/customer";

const categoryData: Record<string, { emoji: string; bgColor: string; iconBg: string }> = {
  smoothies: { 
    emoji: "🍓",
    bgColor: "bg-pink-100 hover:bg-pink-200",
    iconBg: "bg-pink-200"
  },
  juices: { 
    emoji: "🍊",
    bgColor: "bg-orange-100 hover:bg-orange-200",
    iconBg: "bg-orange-200"
  },
  bowls: { 
    emoji: "🥗",
    bgColor: "bg-purple-100 hover:bg-purple-200",
    iconBg: "bg-purple-200"
  },
  snacks: { 
    emoji: "🍪",
    bgColor: "bg-amber-100 hover:bg-amber-200",
    iconBg: "bg-amber-200"
  },
  detox: { 
    emoji: "💉",
    bgColor: "bg-green-100 hover:bg-green-200",
    iconBg: "bg-green-200"
  },
  energy: { 
    emoji: "⚡",
    bgColor: "bg-yellow-100 hover:bg-yellow-200",
    iconBg: "bg-yellow-200"
  },
};

// Default styling for unknown categories
const defaultCategoryStyle = {
  emoji: "🍹",
  bgColor: "bg-gray-100 hover:bg-gray-200",
  iconBg: "bg-gray-200"
};

export function CategoryBrowse() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsApi.getCategories();
        if (response.categories && response.categories.length > 0) {
          // Extract category names, skip "All"
          const categoryNames = response.categories
            .map(cat => cat.name)
            .filter(name => name.toLowerCase() !== "all");
          setCategories(categoryNames);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const getCategoryLabel = (category: string) => {
    const lowerCategory = category.toLowerCase();
    switch (lowerCategory) {
      case "smoothies":
        return t("home.categories.smoothies");
      case "juices":
        return t("home.categories.juices");
      case "bowls":
        return t("home.categories.bowls");
      case "snacks":
        return t("home.categories.snacks");
      default:
        return category;
    }
  };

  // Don't render if no categories
  if (isLoading || categories.length === 0) {
    return null;
  }

  return (
    <section 
      className="py-20 bg-gradient-to-b from-white via-orange-50/30 to-white"
      aria-labelledby="browse-categories-title"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800 mb-4">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" aria-hidden="true"></span>
            <h2 id="browse-categories-title">{t("home.browseCategories.title")}</h2>
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" aria-hidden="true"></span>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            {t("home.browseCategories.subtitle")}
          </p>
        </div>
        {/* Category Cards */}
        <nav aria-label={t("home.browseCategories.title")}>
          <ul className="flex flex-wrap justify-center gap-6 max-w-6xl mx-auto" role="list">
            {categories.map((category) => {
              const lowerCategory = category.toLowerCase();
              const data = categoryData[lowerCategory] || defaultCategoryStyle;
              const categoryLabel = getCategoryLabel(category);
              
              return (
                <li key={category} className="w-full sm:w-[calc(50%-12px)] lg:w-[calc(25%-18px)] min-w-60 max-w-[300px]">
                  <Link
                    href={`/menu?category=${lowerCategory}`}
                    aria-label={`${t("home.browseCategories.browseCategory")} ${categoryLabel}`}
                    className={`
                      group relative flex flex-col items-center justify-center
                      rounded-3xl p-8 lg:p-10
                      ${data.bgColor}
                      border-2 border-white/50
                      transition-all duration-500 ease-out
                      cursor-pointer overflow-hidden
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                    `}
                  >
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
                    
                    {/* Emoji Icon */}
                    <div 
                      className={`
                        relative z-10 w-20 h-20 lg:w-24 lg:h-24 
                        rounded-2xl ${data.iconBg}
                        flex items-center justify-center
                        mb-6 text-5xl lg:text-6xl
                        group-hover:scale-110 group-hover:rotate-6 
                        transition-all duration-500 ease-out
                        shadow-lg group-hover:shadow-xl
                      `}
                      aria-hidden="true"
                    >
                      {data.emoji}
                    </div>
                    
                    {/* Category Name */}
                    <span className="relative z-10 text-lg lg:text-xl font-bold text-gray-800 text-center">
                      {categoryLabel}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </section>
  );
}
