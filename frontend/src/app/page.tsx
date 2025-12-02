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
import { useTranslation } from "@/lib/i18n";
import { 
  ChevronLeft, 
  ChevronRight,
  Star,
} from "lucide-react";
import { productsApi, type Product as ApiProduct } from "@/lib/api/customer";

// Top 3 bestseller products with their colors
// Images stored in: /public/images/products/hero/
const bestsellerProducts = [
  {
    id: 1,
    name: "Berry Blast",
    price: "8.50",
    rating: 5,
    description: "Fresh berries blended to perfection.",
    color: "bg-red-500",
    gradientFrom: "from-red-400",
    gradientTo: "to-red-600",
    buttonBg: "bg-red-600",
    buttonHover: "hover:bg-red-700",
    shadowColor: "shadow-red-600/20",
    accentColor: "text-red-600",
    bgAccent: "bg-red-50/50",
    bgImage: "/images/products/hero/berry-blast.webp",
    bottleImage: "/images/products/bottles/berry-blast.webp",
  },
  {
    id: 2,
    name: "Green Goddess",
    price: "9.00",
    rating: 5,
    description: "Healthy green smoothie with spinach and apple.",
    color: "bg-green-500",
    gradientFrom: "from-green-400",
    gradientTo: "to-green-600",
    buttonBg: "bg-green-600",
    buttonHover: "hover:bg-green-700",
    shadowColor: "shadow-green-600/20",
    accentColor: "text-green-600",
    bgAccent: "bg-green-50/50",
    bgImage: "/images/products/hero/green-goddess.webp",
    bottleImage: "/images/products/bottles/green-goddess.webp",
  },
  {
    id: 3,
    name: "Tropical Paradise",
    price: "8.75",
    rating: 5,
    description: "Refreshing blend of pineapple, mango, and coconut.",
    color: "bg-yellow-500",
    gradientFrom: "from-yellow-400",
    gradientTo: "to-orange-500",
    buttonBg: "bg-orange-500",
    buttonHover: "hover:bg-orange-600",
    shadowColor: "shadow-orange-500/20",
    accentColor: "text-orange-500",
    bgAccent: "bg-orange-50/50",
    bgImage: "/images/products/hero/tropical-paradise.webp",
    bottleImage: "/images/products/bottles/tropical-paradise.webp",
  },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [carouselProducts, setCarouselProducts] = useState<Array<{id: string; name: string; price: string; color: string}>>([]);

  const currentProduct = bestsellerProducts[currentIndex];

  // Fetch products for carousel
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await productsApi.getAll();
        if (response.items && response.items.length > 0) {
          const transformed = response.items.map((p: ApiProduct) => ({
            id: String(p.id),
            name: p.name,
            price: (p.base_price || p.price || 0).toLocaleString('id-ID'),
            color: p.image_color || p.image_url || "bg-green-500",
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
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % bestsellerProducts.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

  const goToPrev = useCallback(() => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + bestsellerProducts.length) % bestsellerProducts.length);
    setTimeout(() => setIsTransitioning(false), 500);
  }, [isTransitioning]);

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
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
          {/* Background Product Image - Full Size */}
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
                  src={product.bgImage}
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

          <div className="container relative z-10 mx-auto px-4 py-20">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              {/* Left Content */}
              <div className="relative z-10 max-w-2xl">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-sm font-medium text-orange-800">
                  <span>{t("home.hero.badge")}</span>
                  <span role="img" aria-label="juice">🍹</span>
                </div>
                
                <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900 sm:text-7xl">
                  {t("home.hero.title1")} <br />
                  {t("home.hero.title2")} <br />
                  {t("home.hero.title3")}
                </h1>
                
                <p className="mt-6 text-lg text-gray-600 max-w-md">
                  {t("home.hero.subtitle")}
                </p>
                
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Link href="/menu">
                    <Button 
                      size="xl" 
                      className={`${currentProduct.buttonBg} ${currentProduct.buttonHover} text-white shadow-lg ${currentProduct.shadowColor} h-14 px-8 rounded-full transition-all duration-500 ease-out`}
                    >
                      {t("home.hero.orderNow")}
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Content - Bottle + Details Card */}
              <div className="relative flex items-center justify-center lg:justify-end">
                {/* Product Bottle Image */}
                <div className="relative h-[400px] w-[200px] lg:h-[500px] lg:w-[250px] mr-4">
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
                        src={product.bottleImage}
                        alt={product.name}
                        fill
                        className="object-contain drop-shadow-2xl"
                        sizes="(max-width: 1024px) 200px, 250px"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </div>

                {/* Floating Details Card */}
                <div className="relative z-20 w-56 lg:w-64 rounded-3xl bg-white/95 backdrop-blur-sm p-5 shadow-2xl">
                  <div className="mb-3">
                    <h3 className="text-sm font-medium text-gray-500">Details</h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span 
                        className={`text-2xl lg:text-3xl font-bold transition-all duration-500 ease-out ${currentProduct.accentColor}`}
                      >
                        ${currentProduct.price}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 transition-all duration-300">
                      {currentProduct.name}
                    </p>
                  </div>
                  
                  <div className="mb-3 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 fill-current transition-colors duration-500 ${
                          i <= currentProduct.rating ? 'text-orange-400' : 'text-gray-200'
                        }`} 
                      />
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                    {currentProduct.description}
                  </p>

                  {/* Navigation Arrows */}
                  <div className="flex gap-2">
                    <button 
                      onClick={goToPrev}
                      disabled={isTransitioning}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isTransitioning 
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed' 
                          : 'border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                      }`}
                      aria-label={t("common.previous")}
                    >
                      <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button 
                      onClick={goToNext}
                      disabled={isTransitioning}
                      className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                        isTransitioning 
                          ? 'border-gray-100 text-gray-300 cursor-not-allowed' 
                          : 'border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900'
                      }`}
                      aria-label={t("common.next")}
                    >
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>

                  {/* Dots Indicator */}
                  <div className="mt-4 flex justify-center gap-2">
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
                        className={`h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex 
                            ? `w-6 ${currentProduct.color}` 
                            : 'w-2 bg-gray-200 hover:bg-gray-300'
                        }`}
                        aria-label={`Go to product ${index + 1}`}
                        aria-current={index === currentIndex ? 'true' : 'false'}
                      />
                    ))}
                  </div>
                </div>
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
      </main>
      
      <Footer />
    </div>
  );
}
