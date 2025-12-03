"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { CategoryBrowse } from "@/components/home/CategoryBrowse";
import { PromoBanner } from "@/components/home/PromoBanner";
import { CustomerReviews } from "@/components/home/CustomerReviews";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { CTABanner } from "@/components/home/CTABanner";
import { StoreInfoSection } from "@/components/home/StoreInfoSection";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/hooks/use-store";
import { 
  ChevronLeft, 
  ChevronRight,
  Star,
} from "lucide-react";
import { productsApi, type Product as ApiProduct, type BestsellerProduct } from "@/lib/api/customer";

// Fallback bestseller products (used when API fails or while loading)
const fallbackBestsellerProducts: BestsellerProduct[] = [
  {
    id: "1",
    name: "Berry Blast",
    price: "8.50",
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

export default function HomePage() {
  const { t } = useTranslation();
  const { format } = useCurrency();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [carouselProducts, setCarouselProducts] = useState<Array<{id: string; name: string; price: string; color: string; thumbnail_image?: string; bottle_image?: string}>>([]);
  const [bestsellerProducts, setBestsellerProducts] = useState<BestsellerProduct[]>([]);
  const [isLoadingBestsellers, setIsLoadingBestsellers] = useState(true);

  // Get current product safely - only show when we have products
  const safeCurrentIndex = bestsellerProducts.length > 0 ? currentIndex % bestsellerProducts.length : 0;
  const currentProduct = bestsellerProducts.length > 0 ? bestsellerProducts[safeCurrentIndex] : null;

  // Fetch bestseller products for hero
  useEffect(() => {
    const fetchBestsellers = async () => {
      try {
        setIsLoadingBestsellers(true);
        const response = await productsApi.getBestsellers(3);
        if (response.items && response.items.length > 0) {
          setBestsellerProducts(response.items);
          setCurrentIndex(0); // Reset index when products change
        } else {
          // Use fallback if no items returned
          setBestsellerProducts(fallbackBestsellerProducts);
        }
      } catch (err) {
        console.error("Failed to fetch bestsellers, using fallback:", err);
        // Use fallback on error
        setBestsellerProducts(fallbackBestsellerProducts);
      } finally {
        setIsLoadingBestsellers(false);
      }
    };
    fetchBestsellers();
  }, []);

  // Fetch products for carousel
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsApi.getAll();
        if (response.items && response.items.length > 0) {
          const transformed = response.items.map((p: ApiProduct) => ({
            id: String(p.id),
            name: p.name,
            price: String(p.base_price || p.price || 0),
            color: p.image_color || p.image_url || "bg-green-500",
            thumbnail_image: p.thumbnail_image,
            bottle_image: p.bottle_image,
          }));
          setCarouselProducts(transformed);
        }
      } catch (err) {
        console.error("Failed to fetch products for carousel:", err);
      }
    };
    fetchProducts();
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
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[70vh] sm:min-h-[80vh] lg:min-h-[90vh] flex items-center">
          {/* Loading State */}
          {isLoadingBestsellers && (
            <div className="absolute inset-0 z-0 bg-gradient-to-r from-green-50 to-green-100 animate-pulse" />
          )}
          
          {/* Background Product Image - Full Size */}
          {!isLoadingBestsellers && bestsellerProducts.length > 0 && (
            <div className="absolute inset-0 z-0">
              {bestsellerProducts.map((product, index) => (
                <div
                  key={product.id}
                  className={`absolute inset-0 transition-all duration-700 ease-out ${
                    index === currentIndex 
                      ? 'opacity-100 scale-100' 
                      : 'opacity-0 scale-105 pointer-events-none'
                  }`}
                >
                  <Image
                    src={product.hero_image}
                    alt={product.name}
                    fill
                    className="object-cover object-center"
                    sizes="100vw"
                    priority={index === 0}
                  />
                  {/* Gradient overlay for text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent lg:via-white/70"></div>
                </div>
              ))}
            </div>
          )}

          <div className="container relative z-10 mx-auto px-4 py-10 sm:py-20">
            <div className="grid gap-8 lg:gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left Content */}
              <div className="relative z-10 max-w-2xl">
                <div className="mb-4 sm:mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-orange-800">
                  <span>{t("home.hero.badge")}</span>
                  <span role="img" aria-label="juice">🍹</span>
                </div>
                
                <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold leading-tight tracking-tight text-gray-900">
                  {t("home.hero.title1")} <br />
                  {t("home.hero.title2")} <br />
                  {t("home.hero.title3")}
                </h1>
                
                <p className="mt-4 sm:mt-6 text-sm sm:text-lg text-gray-600 max-w-md">
                  {t("home.hero.subtitle")}
                </p>
                
                <div className="mt-6 sm:mt-10 flex flex-wrap items-center gap-4">
                  <Link href="/menu">
                    <Button 
                      size="xl" 
                      className={`${currentProduct?.button_bg || 'bg-green-600'} ${currentProduct?.button_hover || 'hover:bg-green-700'} text-white shadow-lg ${currentProduct?.shadow_color || 'shadow-green-600/20'} h-12 sm:h-14 px-6 sm:px-8 rounded-full transition-all duration-500 ease-out text-sm sm:text-base`}
                    >
                      {t("home.hero.orderNow")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Content - Bottle + Details Card */}
              <div className="relative flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-4">
                {/* Product Bottle Image - Hidden on very small screens, shown from sm up */}
                <div className="relative h-[250px] w-[140px] sm:h-[350px] sm:w-[180px] lg:h-[500px] lg:w-[250px] hidden sm:block">
                  {bestsellerProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={`absolute inset-0 transition-all duration-500 ease-out ${
                        index === currentIndex 
                          ? 'opacity-100 scale-100' 
                          : 'opacity-0 scale-95 pointer-events-none'
                      }`}
                    >
                      <Image
                        src={product.bottle_image}
                        alt={product.name}
                        fill
                        className="object-contain drop-shadow-2xl"
                        sizes="(max-width: 640px) 140px, (max-width: 1024px) 180px, 250px"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </div>

                {/* Floating Details Card - Only show when product is loaded */}
                {currentProduct && (
                <div className="relative z-20 w-full max-w-[280px] sm:w-48 lg:w-64 rounded-2xl sm:rounded-3xl bg-white/95 backdrop-blur-sm p-4 sm:p-5 shadow-xl sm:shadow-2xl">
                  <div className="mb-2 sm:mb-3">
                    <h3 className="text-xs sm:text-sm font-medium text-gray-500">Details</h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span 
                        className={`text-xl sm:text-2xl lg:text-3xl font-bold transition-all duration-500 ease-out ${currentProduct.accent_color}`}
                      >
                        {format(parseFloat(currentProduct.price))}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-medium text-gray-900 transition-all duration-300 truncate">
                      {currentProduct.name}
                    </p>
                  </div>
                  
                  <div className="mb-2 sm:mb-3 flex gap-0.5 sm:gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star 
                        key={i} 
                        className={`h-3 w-3 sm:h-4 sm:w-4 fill-current transition-colors duration-500 ${
                          i <= currentProduct.rating ? 'text-orange-400' : 'text-gray-200'
                        }`} 
                      />
                    ))}
                  </div>

                  <p className="text-[10px] sm:text-xs text-gray-500 mb-3 sm:mb-4 line-clamp-2">
                    {currentProduct.description}
                  </p>

                  {/* Navigation Arrows */}
                  <div className="flex gap-2">
                    <button 
                      onClick={goToPrev}
                      disabled={isTransitioning}
                      className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isTransitioning 
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed' 
                          : 'border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                      }`}
                      aria-label={t("common.previous")}
                    >
                      <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </button>
                    <button 
                      onClick={goToNext}
                      disabled={isTransitioning}
                      className={`flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isTransitioning 
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed' 
                          : 'border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                      }`}
                      aria-label={t("common.next")}
                    >
                      <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Dots Indicator */}
                  <div className="mt-3 sm:mt-4 flex justify-center gap-1.5 sm:gap-2">
                    {bestsellerProducts.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (!isTransitioning && index !== currentIndex) {
                            setIsTransitioning(true);
                            setCurrentIndex(index);
                            setTimeout(() => setIsTransitioning(false), 500);
                          }
                        }}
                        className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex 
                            ? `w-4 sm:w-6 ${currentProduct.color}` 
                            : 'w-1.5 sm:w-2 bg-gray-200 hover:bg-gray-300'
                        }`}
                        aria-label={`Go to product ${index + 1}`}
                        aria-current={index === currentIndex ? 'true' : 'false'}
                      />
                    ))}
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Browse Categories Section */}
        <CategoryBrowse />

        {/* Lineup Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            {carouselProducts.length > 0 && (
              <ProductCarousel 
                products={carouselProducts} 
                speed={25}
              />
            )}
          </div>
        </section>

        {/* Why Choose Us */}
        <WhyChooseUs />

        {/* Customer Reviews */}
        <CustomerReviews />

        {/* CTA Banner */}
        <CTABanner />

        {/* Store Info with Map */}
        <StoreInfoSection />
      </main>
      
      <Footer />
    </div>
  );
}
