"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBrowse } from "@/components/home/CategoryBrowse";
import { PromoBanner } from "@/components/home/PromoBanner";
import { CustomerReviews } from "@/components/home/CustomerReviews";
import { CTABanner } from "@/components/home/CTABanner";
import { StoreInfoSection } from "@/components/home/StoreInfoSection";
import { useCurrency } from "@/lib/hooks/use-store";
import { useTranslation } from "@/lib/i18n";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { productsApi, type BestsellerProduct } from "@/lib/api/customer";
import { getImageUrl } from "@/lib/image-utils";

// Fallback bestseller products (used when API fails or while loading)
const fallbackBestsellerProducts: BestsellerProduct[] = [
  {
    id: "1",
    name: "Berry Blast",
    price: "8.50",
    prices: { small: 7.0, medium: 8.5, large: 10 },
    rating: 5,
    order_count: 100,
    description: "Fresh berries blended to perfection.",
    color: "bg-red-500",
    gradient_from: "from-red-400",
    gradient_to: "to-red-600",
    button_bg: "bg-red-600",
    button_hover: "hover:bg-red-700",
    shadow_color: "shadow-red-600/20",
    accent_color: "text-red-600",
    bg_accent: "bg-red-50/50",
    hero_image: "/images/products/hero/berry-blast.webp",
    bottle_image: "/images/products/bottles/berry-blast.webp",
    thumbnail_image: "bg-red-500",
  },
  {
    id: "2",
    name: "Green Goddess",
    price: "9.00",
    prices: { small: 7.5, medium: 9, large: 10.5 },
    rating: 5,
    order_count: 80,
    description: "Healthy green smoothie with spinach and apple.",
    color: "bg-green-500",
    gradient_from: "from-green-400",
    gradient_to: "to-green-600",
    button_bg: "bg-green-600",
    button_hover: "hover:bg-green-700",
    shadow_color: "shadow-green-600/20",
    accent_color: "text-green-600",
    bg_accent: "bg-green-50/50",
    hero_image: "/images/products/hero/green-goddess.webp",
    bottle_image: "/images/products/bottles/green-goddess.webp",
    thumbnail_image: "bg-green-500",
  },
  {
    id: "3",
    name: "Tropical Paradise",
    price: "8.75",
    prices: { small: 7.25, medium: 8.75, large: 10.25 },
    rating: 5,
    order_count: 75,
    description: "Refreshing blend of pineapple, mango, and coconut.",
    color: "bg-yellow-500",
    gradient_from: "from-yellow-400",
    gradient_to: "to-orange-500",
    button_bg: "bg-orange-500",
    button_hover: "hover:bg-orange-600",
    shadow_color: "shadow-orange-500/20",
    accent_color: "text-orange-500",
    bg_accent: "bg-orange-50/50",
    hero_image: "/images/products/hero/tropical-paradise.webp",
    bottle_image: "/images/products/bottles/tropical-paradise.webp",
    thumbnail_image: "bg-yellow-500",
  },
];

const sizeKeyMap: Record<'S' | 'M' | 'L', 'small' | 'medium' | 'large'> = {
  S: "small",
  M: "medium",
  L: "large",
};

const getPriceBySize = (product: BestsellerProduct, size: 'S' | 'M' | 'L') => {
  const key = sizeKeyMap[size];
  if (product.prices && product.prices[key] !== undefined) {
    return product.prices[key] as number;
  }
  const base = parseFloat(product.price);
  if (Number.isNaN(base)) return 0;
  const multipliers: Record<'S' | 'M' | 'L', number> = { S: 0.8, M: 1, L: 1.3 };
  return Math.round(base * multipliers[size] * 100) / 100;
};

export default function HomePage() {
  const { format } = useCurrency();
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
  const [bestsellerProducts, setBestsellerProducts] = useState<BestsellerProduct[]>([]);

  // Get current product safely - only show when we have products
  const safeCurrentIndex = bestsellerProducts.length > 0 ? currentIndex % bestsellerProducts.length : 0;
  const currentProduct = bestsellerProducts.length > 0 ? bestsellerProducts[safeCurrentIndex] : null;
  
  // Calculate prev and next products for the 3-cup view
  const prevIndex = bestsellerProducts.length > 0 ? (safeCurrentIndex - 1 + bestsellerProducts.length) % bestsellerProducts.length : 0;
  const nextIndex = bestsellerProducts.length > 0 ? (safeCurrentIndex + 1) % bestsellerProducts.length : 0;
  const prevProduct = bestsellerProducts.length > 0 ? bestsellerProducts[prevIndex] : null;
  const nextProduct = bestsellerProducts.length > 0 ? bestsellerProducts[nextIndex] : null;

  // Fetch bestseller products for hero
  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        const response = await productsApi.getBestsellers(3);
        if (response.items && response.items.length > 0) {
          setBestsellerProducts(response.items);
          setCurrentIndex(0);
        } else {
          setBestsellerProducts(fallbackBestsellerProducts);
        }
      } catch {
        setBestsellerProducts(fallbackBestsellerProducts);
      }
    };
    fetchBestsellers();
  }, []);

  const goToNext = useCallback(() => {
    if (isTransitioning || bestsellerProducts.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % bestsellerProducts.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, bestsellerProducts.length]);

  const goToPrev = useCallback(() => {
    if (isTransitioning || bestsellerProducts.length === 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + bestsellerProducts.length) % bestsellerProducts.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning, bestsellerProducts.length]);

  // Auto-rotate every 4 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      goToNext();
    }, 4000);

    return () => clearInterval(interval);
  }, [goToNext]);

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Promo Banner */}
      <PromoBanner />
      
      <Header />

      {/* Main Content */}
      <main id="main-content" className="flex-1">
        {/* Hero Section - Redesigned with smooth animations */}
        <section className="relative min-h-[calc(100svh-100px)] sm:min-h-[calc(100vh-80px)] flex flex-col items-center justify-center sm:justify-start sm:pt-8 lg:pt-12 pb-2 sm:pb-8 bg-stone-50 overflow-hidden">
          
          {/* Background Decorative Blobs - Emerald theme base with product accent */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             {/* Top decorative blob */}
             <div 
               className="absolute -top-20 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-100/40"
               style={{ filter: 'blur(100px)' }}
             />
             {/* Left Blob - follows product color */}
             <div 
               className={`absolute -left-40 bottom-20 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full transition-all duration-1500 ease-in-out ${currentProduct?.color?.replace('bg-', 'bg-') || 'bg-emerald-300'}`}
               style={{ opacity: 0.15, filter: 'blur(100px)' }}
             />
             {/* Right Blob */}
             <div 
               className={`absolute -right-40 bottom-10 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full transition-all duration-1500 ease-in-out ${currentProduct?.color?.replace('bg-', 'bg-') || 'bg-lime-200'}`}
               style={{ opacity: 0.12, filter: 'blur(80px)' }}
             />
             {/* Subtle pattern overlay */}
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.05),transparent_70%)]" />
          </div>

          {/* Hero Header - Badge and Title */}
          <div className="text-center z-20 px-4 mb-2 sm:mb-4 mt-8 sm:mt-10 lg:mt-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3 sm:mb-4 shadow-sm">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              {t("home.hero.badgeBestseller")}
            </span>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium text-emerald-950 tracking-tight">
              {t("home.hero.titleFresh")} <span className="italic text-emerald-600">{t("home.hero.titleHealthy")}</span>
            </h1>
            <p className="text-stone-500 text-sm sm:text-base mt-2 max-w-md mx-auto">
              {t("home.hero.subtitleBestseller")}
            </p>
          </div>

          {/* Main Content Area - 3 Products View (This is the visual anchor) */}
          <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center h-44 sm:h-64 lg:h-80 mt-4 sm:mt-8 lg:mt-10">

              {/* Products Container */}
              <div className="relative flex items-center justify-center w-full h-full">
                 {/* Previous Product (Left) */}
                 {prevProduct && (
                   <div 
                     className="absolute left-[8%] sm:left-[18%] lg:left-[22%] top-1/2 -translate-y-1/2 w-[90px] h-[110px] sm:w-40 sm:h-[200px] lg:w-[180px] lg:h-[220px] cursor-pointer z-10 transition-all duration-700 ease-in-out" 
                     onClick={goToPrev}
                     style={{ 
                       opacity: 0.4, 
                       filter: 'blur(1.5px)',
                       transform: 'translateY(-50%) scale(0.85)'
                     }}
                   >
                      <div className="relative w-full h-full transition-transform duration-300 hover:scale-110">
                        <img src={getImageUrl(prevProduct.bottle_image)} alt={prevProduct.name} className="object-contain w-full h-full" />
                      </div>
                   </div>
                 )}

                 {/* Main Product (Center) */}
                 <div className={`relative z-20 transition-all duration-500 ease-in-out ${
                   selectedSize === 'S' 
                     ? 'w-32 h-[160px] sm:w-[200px] sm:h-[260px] lg:w-60 lg:h-[300px]'
                     : selectedSize === 'M'
                       ? 'w-40 h-[200px] sm:w-[260px] sm:h-[340px] lg:w-[300px] lg:h-[380px]'
                       : 'w-48 h-[240px] sm:w-80 sm:h-[400px] lg:w-[360px] lg:h-[440px]'
                 }`}>
                     {currentProduct && (
                       <img 
                         src={getImageUrl(currentProduct.bottle_image)} 
                         alt={currentProduct.name} 
                         className="w-full h-full object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.15)] transition-all duration-700 ease-in-out"
                       />
                     )}
                 </div>

                 {/* Next Product (Right) */}
                 {nextProduct && (
                   <div 
                     className="absolute right-[8%] sm:right-[18%] lg:right-[22%] top-1/2 -translate-y-1/2 w-[90px] h-[110px] sm:w-40 sm:h-[200px] lg:w-[180px] lg:h-[220px] cursor-pointer z-10 transition-all duration-700 ease-in-out" 
                     onClick={goToNext}
                     style={{ 
                       opacity: 0.4, 
                       filter: 'blur(1.5px)',
                       transform: 'translateY(-50%) scale(0.85)'
                     }}
                   >
                      <div className="relative w-full h-full transition-transform duration-300 hover:scale-110">
                        <img src={getImageUrl(nextProduct.bottle_image)} alt={nextProduct.name} className="object-contain w-full h-full" />
                      </div>
                   </div>
                 )}
              </div>
          </div>

          {/* Product Name & Price (Below Products) */}
          <div className="text-center z-20 mb-3 sm:mb-4 mt-3 sm:mt-4 px-4">
               <h2 
                 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold tracking-tight transition-all duration-500 ease-in-out text-emerald-600"
               >
                  {currentProduct?.name || 'Green Glow'}
               </h2>
               <p className="text-lg sm:text-xl font-bold mt-1 sm:mt-2 transition-all duration-500 ease-in-out text-stone-800">
                  {currentProduct ? format(getPriceBySize(currentProduct, selectedSize)) : '$6.50'}
               </p>
          </div>

          {/* Size Selector */}
          <div className="flex items-center justify-center z-20 mb-4 sm:mb-4">
             <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-stone-100">
                {(['S', 'M', 'L'] as const).map((size) => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 ease-out ${
                      selectedSize === size 
                        ? `bg-white shadow-md ring-2 ring-emerald-100 ${currentProduct?.accent_color || 'text-emerald-600'}` 
                        : 'text-stone-400 hover:text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    {size}
                  </button>
                ))}
             </div>
          </div>

          {/* Buy Button */}
          <Link href="/menu" className="z-20 mb-6 sm:mb-6">
            <button 
              className="inline-flex items-center justify-center rounded-full shadow-lg px-8 h-12 font-semibold text-sm transition-colors duration-300 ease-out text-white bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30"
            >
               {t("home.hero.orderNow")}
            </button>
          </Link>

          {/* Thumbnail Carousel */}
          <div className="w-full max-w-4xl mx-auto px-4 relative pb-2 sm:pb-6 mt-4 sm:mt-0">
              <button 
                onClick={goToPrev} 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-stone-300 hover:text-emerald-600 transition-colors duration-200 z-10"
              >
                 <ChevronLeft className="w-6 h-6 stroke-[1.5]" />
              </button>
              
              <div className="flex justify-center items-center gap-6 sm:gap-10 py-4 px-12">
                 {bestsellerProducts.map((product, index) => (
                   <div 
                     key={product.id}
                     onClick={() => {
                        if (!isTransitioning && index !== currentIndex) {
                          setIsTransitioning(true);
                          setCurrentIndex(index);
                          setTimeout(() => setIsTransitioning(false), 800);
                        }
                     }}
                     className={`flex flex-col items-center cursor-pointer transition-all duration-500 ease-in-out group shrink-0 ${
                       index === currentIndex 
                         ? 'opacity-100' 
                         : 'opacity-40 hover:opacity-70'
                     }`}
                   >
                      <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 ease-in-out ${
                        index === currentIndex 
                          ? `bg-white shadow-lg ring-2 ring-offset-2 ring-emerald-200` 
                          : 'bg-stone-100/80'
                      }`}>
                        <img 
                          src={getImageUrl(product.bottle_image)} 
                          alt={product.name} 
                          className="object-contain w-full h-full p-2 transition-transform duration-300 group-hover:scale-110" 
                        />
                      </div>
                      <span className={`mt-2.5 text-xs font-semibold text-center transition-all duration-500 ease-in-out max-w-[100px] leading-tight ${
                        index === currentIndex ? 'text-emerald-950' : 'text-stone-400'
                      }`}>
                        {product.name}
                      </span>
                   </div>
                 ))}
              </div>

              <button 
                onClick={goToNext} 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-stone-300 hover:text-emerald-600 transition-colors duration-200 z-10"
              >
                 <ChevronRight className="w-6 h-6 stroke-[1.5]" />
              </button>
          </div>

        </section>
        <CategoryBrowse />
        <CustomerReviews />
        <StoreInfoSection />
        <CTABanner />
      </main>
      
      <Footer />
    </div>
  );
}
