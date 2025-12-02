"use client";

import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { categories } from "@/lib/data";

// Category card data with colors and emoji icons
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
    <section className="py-16 bg-linear-to-b from-white to-orange-50/30">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            {t("home.browseCategories.title")} <span role="img" aria-label="categories">🛒</span>
          </h2>
          <p className="mt-2 text-gray-500">{t("home.browseCategories.subtitle")}</p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
          {browseCategories.map((category) => {
            const data = categoryData[category] || categoryData.Smoothies;
            
            return (
              <Link
                key={category}
                href={`/menu?category=${category}`}
                className={`
                  group flex flex-col items-center justify-center
                  rounded-2xl p-6 md:p-8
                  ${data.bgColor}
                  transition-all duration-300 ease-out
                  hover:scale-105 hover:shadow-lg
                  cursor-pointer
                `}
              >
                {/* Emoji Icon */}
                <div className={`
                  w-16 h-16 md:w-20 md:h-20 
                  rounded-full ${data.iconBg}
                  flex items-center justify-center
                  mb-4 text-4xl md:text-5xl
                  group-hover:scale-110 transition-transform duration-300
                `}>
                  {data.emoji}
                </div>
                
                {/* Category Name */}
                <span className="text-sm md:text-base font-semibold text-gray-800 text-center">
                  {getCategoryLabel(category)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
