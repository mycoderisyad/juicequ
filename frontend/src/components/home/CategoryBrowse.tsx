"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { categories } from "@/lib/data";

const categoryData: Record<string, { emoji: string; bgColor: string; iconBg: string }> = {
  Smoothies: { 
    emoji: "🍓",
    bgColor: "bg-pink-100 hover:bg-pink-200",
    iconBg: "bg-pink-200"
  },
  Juices: { 
    emoji: "🍊",
    bgColor: "bg-orange-100 hover:bg-orange-200",
    iconBg: "bg-orange-200"
  },
  Bowls: { 
    emoji: "🥗",
    bgColor: "bg-purple-100 hover:bg-purple-200",
    iconBg: "bg-purple-200"
  },
  Snacks: { 
    emoji: "🍪",
    bgColor: "bg-amber-100 hover:bg-amber-200",
    iconBg: "bg-amber-200"
  },
};

export function CategoryBrowse() {
  const { t } = useTranslation();

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "Smoothies":
        return t("home.categories.smoothies");
      case "Juices":
        return t("home.categories.juices");
      case "Bowls":
        return t("home.categories.bowls");
      case "Snacks":
        return t("home.categories.snacks");
      default:
        return category;
    }
  };

  // Skip "All" category for browse section
  const browseCategories = categories.filter(cat => cat !== "All");

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
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto" role="list">
            {browseCategories.map((category) => {
              const data = categoryData[category] || categoryData.Smoothies;
              const categoryLabel = getCategoryLabel(category);
              
              return (
                <li key={category}>
                  <Link
                    href={`/menu?category=${category.toLowerCase()}`}
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

                    {/* Arrow indicator */}
                    <div className="absolute bottom-4 right-4 w-8 h-8 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" aria-hidden="true">
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
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
