"use client";

import Link from "next/link";
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
  Play, 
  ChevronLeft, 
  ChevronRight,
  Star,
} from "lucide-react";
import { menuItems } from "@/lib/data";

// Top 3 bestseller products with their colors
const bestsellerProducts = [
  {
    id: 1,
    name: "Berry Blast",
    price: "8.50",
    rating: 5,
    color: "bg-red-500",
    gradientFrom: "from-red-400",
    gradientTo: "to-red-600",
    buttonBg: "bg-red-600",
    buttonHover: "hover:bg-red-700",
    shadowColor: "shadow-red-600/20",
    accentColor: "text-red-600",
    image: "/images/berry-blast.png", // placeholder for future image
  },
  {
    id: 2,
    name: "Green Goddess",
    price: "9.00",
    rating: 5,
    color: "bg-green-500",
    gradientFrom: "from-green-400",
    gradientTo: "to-green-600",
    buttonBg: "bg-green-600",
    buttonHover: "hover:bg-green-700",
    shadowColor: "shadow-green-600/20",
    accentColor: "text-green-600",
    image: "/images/green-goddess.png",
  },
  {
    id: 3,
    name: "Tropical Paradise",
    price: "8.75",
    rating: 5,
    color: "bg-yellow-500",
    gradientFrom: "from-yellow-400",
    gradientTo: "to-orange-500",
    buttonBg: "bg-orange-500",
    buttonHover: "hover:bg-orange-600",
    shadowColor: "shadow-orange-500/20",
    accentColor: "text-orange-500",
    image: "/images/tropical-paradise.png",
  },
];

export default function HomePage() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const currentProduct = bestsellerProducts[currentIndex];

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
        <section className="relative overflow-hidden pt-10 pb-20 lg:pt-20">
          <div className="container mx-auto px-4">
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
                  <button className="group flex items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${currentProduct.color}/10 ${currentProduct.accentColor} transition-all duration-500`}>
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    {t("home.hero.howItWorks")}
                  </button>
                </div>
              </div>

              {/* Right Content - Product Carousel */}
              <div className="relative lg:h-[600px]">
                {/* Main Bottle Image with smooth transition */}
                <div className="relative z-10 mx-auto h-[400px] w-[200px] lg:h-[500px] lg:w-[250px]">
                  {bestsellerProducts.map((product, index) => (
                    <div
                      key={product.id}
                      className={`absolute inset-0 rounded-[3rem] bg-gradient-to-b ${product.gradientFrom} ${product.gradientTo} shadow-2xl transition-all duration-500 ease-out ${
                        index === currentIndex 
                          ? 'opacity-100 scale-100' 
                          : 'opacity-0 scale-95'
                      }`}
                      style={{
                        boxShadow: index === currentIndex 
                          ? `0 25px 50px -12px ${product.color.replace('bg-', 'rgb(').replace('-500', ' / 0.25)')}` 
                          : 'none'
                      }}
                    >
                      {/* Glass reflection effect */}
                      <div className="absolute left-4 top-4 bottom-4 w-4 rounded-full bg-white/20 blur-sm"></div>
                      {/* Highlight */}
                      <div className="absolute right-6 top-8 h-20 w-2 rounded-full bg-white/10 blur-sm"></div>
                    </div>
                  ))}
                </div>

                {/* Floating Ingredients - animate with product change */}
                <div 
                  className={`absolute top-1/4 left-10 h-12 w-12 rounded-full ${currentProduct.color} blur-sm transition-all duration-500 ease-out`}
                  style={{ opacity: 0.6 }}
                ></div>
                <div 
                  className={`absolute bottom-1/3 right-20 h-8 w-8 rounded-full ${currentProduct.color} blur-sm transition-all duration-500 ease-out`}
                  style={{ opacity: 0.4 }}
                ></div>
                <div 
                  className={`absolute top-10 right-10 h-16 w-16 rounded-full ${currentProduct.color}/20 blur-xl transition-all duration-500 ease-out`}
                ></div>

                {/* Floating Details Card */}
                <div className="absolute right-0 top-1/3 z-20 w-64 rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Details</h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span 
                        className={`text-3xl font-bold transition-all duration-500 ease-out ${currentProduct.accentColor}`}
                      >
                        ${currentProduct.price}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 transition-all duration-300">
                      {currentProduct.name}
                    </p>
                  </div>
                  
                  <div className="mb-6 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star 
                        key={i} 
                        className={`h-4 w-4 fill-current transition-colors duration-500 ${
                          i <= currentProduct.rating ? 'text-orange-400' : 'text-gray-200'
                        }`} 
                      />
                    ))}
                  </div>

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

                {/* Decorative Curve Line - changes with product */}
                <svg className="absolute -right-20 top-10 -z-10 h-full w-full transition-colors duration-500" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path 
                    d="M50 0 C 80 20, 100 50, 80 100" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    fill="none" 
                    className={`${currentProduct.accentColor} opacity-10 transition-colors duration-500`}
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Decorative Background Elements - transition with product */}
          <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-green-50/50 blur-3xl transition-colors duration-700"></div>
          <div 
            className={`absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full blur-3xl transition-all duration-700 ${
              currentIndex === 0 ? 'bg-red-50/50' : 
              currentIndex === 1 ? 'bg-green-50/50' : 
              'bg-orange-50/50'
            }`}
          ></div>
        </section>

        {/* Browse Categories Section */}
        <CategoryBrowse />

        {/* Lineup Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <ProductCarousel 
              products={menuItems} 
              speed={25}
            />
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
