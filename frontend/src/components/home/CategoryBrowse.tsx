"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { productsApi, type Category } from "@/lib/api/customer";

// Color palette untuk kategori
const colorPalette = [
  { bgColor: "bg-pink-100 hover:bg-pink-200", iconBg: "bg-pink-200" },
  { bgColor: "bg-orange-100 hover:bg-orange-200", iconBg: "bg-orange-200" },
  { bgColor: "bg-purple-100 hover:bg-purple-200", iconBg: "bg-purple-200" },
  { bgColor: "bg-amber-100 hover:bg-amber-200", iconBg: "bg-amber-200" },
  { bgColor: "bg-green-100 hover:bg-green-200", iconBg: "bg-green-200" },
  { bgColor: "bg-yellow-100 hover:bg-yellow-200", iconBg: "bg-yellow-200" },
  { bgColor: "bg-blue-100 hover:bg-blue-200", iconBg: "bg-blue-200" },
  { bgColor: "bg-teal-100 hover:bg-teal-200", iconBg: "bg-teal-200" },
  { bgColor: "bg-red-100 hover:bg-red-200", iconBg: "bg-red-200" },
  { bgColor: "bg-indigo-100 hover:bg-indigo-200", iconBg: "bg-indigo-200" },
];

// Default emoji jika tidak ada icon dari database
const defaultEmoji = "🍹";

export function CategoryBrowse() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsApi.getCategories();
        if (response.categories && response.categories.length > 0) {
          // Filter out "All" category and only show active ones
          const filteredCategories = response.categories
            .filter(cat => cat.name.toLowerCase() !== "all");
          setCategories(filteredCategories);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Get color based on index
  const getCategoryColor = (index: number) => {
    return colorPalette[index % colorPalette.length];
  };

  // Don't render if no categories
  if (isLoading || categories.length === 0) {
    return null;
  }

  return (
    <section 
      className="py-10 sm:py-16 lg:py-20 bg-gradient-to-b from-white via-orange-50/30 to-white"
      aria-labelledby="browse-categories-title"
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-8 sm:mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-orange-800 mb-3 sm:mb-4">
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-pulse" aria-hidden="true"></span>
            <h2 id="browse-categories-title">{t("home.browseCategories.title")}</h2>
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-500 rounded-full animate-pulse" aria-hidden="true"></span>
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
            {t("home.browseCategories.subtitle")}
          </p>
        </div>
        {/* Category Cards */}
        <nav aria-label={t("home.browseCategories.title")}>
          <ul className="flex flex-wrap justify-center gap-3 sm:gap-4 lg:gap-6 max-w-6xl mx-auto" role="list">
            {categories.map((category, index) => {
              const colors = getCategoryColor(index);
              const categoryIcon = category.icon || defaultEmoji;
              
              return (
                <li key={category.id} className="w-[calc(50%-6px)] sm:w-[calc(50%-8px)] lg:w-[calc(25%-18px)]">
                  <Link
                    href={`/menu?category=${category.id}`}
                    aria-label={`${t("home.browseCategories.browseCategory")} ${category.name}`}
                    className={`
                      group relative flex flex-col items-center justify-center
                      rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8
                      ${colors.bgColor}
                      border-2 border-white/50
                      transition-all duration-500 ease-out
                      cursor-pointer overflow-hidden
                      focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2
                      h-full min-h-[120px] sm:min-h-[160px] lg:min-h-[200px]
                    `}
                  >
                    {/* Background decoration */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true"></div>
                    
                    {/* Emoji Icon */}
                    <div 
                      className={`
                        relative z-10 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 
                        rounded-xl sm:rounded-2xl ${colors.iconBg}
                        flex items-center justify-center
                        mb-3 sm:mb-4 lg:mb-6 text-2xl sm:text-4xl lg:text-5xl
                        group-hover:scale-110 group-hover:rotate-6 
                        transition-all duration-500 ease-out
                        shadow-md sm:shadow-lg group-hover:shadow-xl
                      `}
                      aria-hidden="true"
                    >
                      {categoryIcon}
                    </div>
                    
                    {/* Category Name */}
                    <span className="relative z-10 text-sm sm:text-base lg:text-lg font-bold text-gray-800 text-center">
                      {category.name}
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
