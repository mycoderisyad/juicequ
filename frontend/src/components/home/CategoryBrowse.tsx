"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslation } from "@/lib/i18n";
import { productsApi, type Category } from "@/lib/api/customer";
import { Sparkles, ArrowRight } from "lucide-react";

// Fallback colors - used when category doesn't have color from database
const fallbackColorPalette = [
  { 
    blobColor: "bg-rose-200",
    subtitleColor: "text-rose-600/70",
    bgGradient: "from-rose-50 to-rose-100/50",
    iconBg: "bg-rose-100 text-rose-500",
    hoverBorder: "hover:border-rose-200",
    shadowColor: "hover:shadow-rose-100/50"
  },
  { 
    blobColor: "bg-orange-200",
    subtitleColor: "text-orange-600/70",
    bgGradient: "from-orange-50 to-orange-100/50",
    iconBg: "bg-orange-100 text-orange-500",
    hoverBorder: "hover:border-orange-200",
    shadowColor: "hover:shadow-orange-100/50"
  },
  { 
    blobColor: "bg-violet-200",
    subtitleColor: "text-violet-600/70",
    bgGradient: "from-violet-50 to-violet-100/50",
    iconBg: "bg-violet-100 text-violet-500",
    hoverBorder: "hover:border-violet-200",
    shadowColor: "hover:shadow-violet-100/50"
  },
  { 
    blobColor: "bg-emerald-200",
    subtitleColor: "text-emerald-600/70",
    bgGradient: "from-emerald-50 to-emerald-100/50",
    iconBg: "bg-emerald-100 text-emerald-500",
    hoverBorder: "hover:border-emerald-200",
    shadowColor: "hover:shadow-emerald-100/50"
  },
  { 
    blobColor: "bg-amber-200",
    subtitleColor: "text-amber-600/70",
    bgGradient: "from-amber-50 to-amber-100/50",
    iconBg: "bg-amber-100 text-amber-500",
    hoverBorder: "hover:border-amber-200",
    shadowColor: "hover:shadow-amber-100/50"
  },
  { 
    blobColor: "bg-sky-200",
    subtitleColor: "text-sky-600/70",
    bgGradient: "from-sky-50 to-sky-100/50",
    iconBg: "bg-sky-100 text-sky-500",
    hoverBorder: "hover:border-sky-200",
    shadowColor: "hover:shadow-sky-100/50"
  },
];

// Default emoji when icon is not available from database
const defaultEmoji = "🍹";

// Fallback subtitles - used when category doesn't have subtitle from database
const fallbackSubtitles: Record<string, { en: string; id: string }> = {
  smoothies: { en: "Creamy & Dreamy", id: "Lembut & Nikmat" },
  juices: { en: "Pure Refreshment", id: "Segar Murni" },
  bowls: { en: "Healthy & Filling", id: "Sehat & Mengenyangkan" },
  default: { en: "Fresh & Tasty", id: "Segar & Lezat" },
};

export function CategoryBrowse() {
  const { t, locale } = useTranslation();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await productsApi.getCategories();
        if (response.categories && response.categories.length > 0) {
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

  // Get fallback color based on index
  const getFallbackColor = (index: number) => {
    return fallbackColorPalette[index % fallbackColorPalette.length];
  };

  // Get subtitle - prioritize from database, fallback to hardcoded
  const getCategorySubtitle = (category: Category) => {
    if (category.subtitle) return category.subtitle;
    
    const key = category.name.toLowerCase();
    const subtitle = fallbackSubtitles[key] || fallbackSubtitles.default;
    return locale === "id" ? subtitle.id : subtitle.en;
  };

  // Get category colors - prioritize from database, fallback to palette
  const getCategoryColors = (category: Category, index: number) => {
    const fallback = getFallbackColor(index);
    
    if (category.color) {
      const baseColor = category.color;
      return {
        blobColor: `bg-${baseColor}-200`,
        subtitleColor: `text-${baseColor}-600/70`,
        bgGradient: `from-${baseColor}-50 to-${baseColor}-100/50`,
        iconBg: `bg-${baseColor}-100 text-${baseColor}-500`,
        hoverBorder: `hover:border-${baseColor}-200`,
        shadowColor: `hover:shadow-${baseColor}-100/50`
      };
    }
    
    return fallback;
  };

  // Don't render if no categories
  if (isLoading || categories.length === 0) {
    return null;
  }

  return (
    <section 
      className="relative py-12 sm:py-16 lg:py-20 bg-stone-50 overflow-hidden"
      aria-labelledby="browse-categories-title"
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-lime-100/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-24 bg-emerald-100/50 blur-3xl rounded-full -z-10" />
          
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-stone-200 text-stone-600 text-xs font-bold uppercase tracking-wider mb-4 shadow-sm">
            <span className="text-amber-400"><Sparkles size={14} /></span>
            {t("home.browseCategories.badge")}
          </span>
          
          <h2 
            id="browse-categories-title"
            className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-emerald-950 tracking-tight mb-4"
          >
            {t("home.browseCategories.title")} <span className="italic text-emerald-600">{t("home.browseCategories.titleAccent")}</span>
          </h2>
          <p className="text-stone-500 text-base sm:text-lg max-w-2xl mx-auto px-4">
            {t("home.browseCategories.subtitle")}
          </p>
        </div>

        {/* Category Cards */}
        <nav aria-label={t("home.browseCategories.title")}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {categories.map((category, index) => {
              const colors = getCategoryColors(category, index);
              const categoryIcon = category.icon || defaultEmoji;
              const subtitle = getCategorySubtitle(category);
              const description = category.description || t("home.browseCategories.defaultDescription");
              
              return (
                <Link
                  key={category.id}
                  href={`/menu?category=${category.id}`}
                  aria-label={`${t("home.browseCategories.browseCategory")} ${category.name}`}
                  className={`
                    group relative rounded-3xl sm:rounded-4xl p-6 sm:p-8 lg:p-10 
                    border border-stone-100 bg-linear-to-br ${colors.bgGradient}
                    transition-all duration-500 cursor-pointer 
                    ${colors.hoverBorder} hover:shadow-2xl ${colors.shadowColor} 
                    hover:-translate-y-2 overflow-hidden
                    focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2
                  `}
                >
                  {/* Decorative blob */}
                  <div className={`absolute -right-10 -bottom-10 w-48 h-48 rounded-full mix-blend-multiply filter blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700 ${colors.blobColor}`} />

                  {/* Icon */}
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl ${colors.iconBg} flex items-center justify-center mb-6 sm:mb-8 shadow-sm group-hover:scale-110 transition-transform duration-300 relative z-10 text-3xl sm:text-4xl`}>
                    {categoryIcon}
                  </div>

                  {/* Content */}
                  <div className="relative z-10">
                    <div className={`text-xs sm:text-sm font-bold uppercase tracking-wider mb-2 ${colors.subtitleColor}`}>
                      {subtitle}
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-serif font-medium text-stone-800 mb-3 group-hover:text-black transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-stone-500 mb-6 sm:mb-8 leading-relaxed text-sm sm:text-base group-hover:text-stone-600">
                      {description}
                    </p>

                    {/* Action button */}
                    <div className="flex items-center gap-2 font-semibold text-stone-800 group/btn">
                      <span className="border-b-2 border-transparent group-hover:border-stone-800 transition-all text-sm sm:text-base">
                        {t("home.browseCategories.viewMenu")}
                      </span>
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-stone-800 group-hover:text-white transition-all">
                        <ArrowRight size={14} />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </section>
  );
}
