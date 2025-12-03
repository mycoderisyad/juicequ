"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CategoryBrowse } from "@/components/home/CategoryBrowse";
import { PromoBanner } from "@/components/home/PromoBanner";
import { CustomerReviews } from "@/components/home/CustomerReviews";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { CTABanner } from "@/components/home/CTABanner";
import { StoreInfoSection } from "@/components/home/StoreInfoSection";
import { useCurrency } from "@/lib/hooks/use-store";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { productsApi, type BestsellerProduct } from "@/lib/api/customer";

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
  const { format } = useCurrency();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [selectedSize, setSelectedSize] = useState<'S' | 'M' | 'L'>('S');
  const [bestsellerProducts, setBestsellerProducts] = useState<BestsellerProduct[]>([]);
  const [isLoadingBestsellers, setIsLoadingBestsellers] = useState(true);

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
        <section className="relative min-h-[calc(100svh-100px)] sm:min-h-[calc(100vh-80px)] flex flex-col items-center justify-center sm:justify-start sm:pt-8 lg:pt-12 pb-2 sm:pb-8 bg-linear-to-b from-gray-50/50 to-white overflow-hidden">
          
          {/* Background Decorative Blobs - Color follows product */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
             {/* Left Blob */}
             <div 
               className={`absolute -left-40 bottom-20 w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] rounded-full transition-all duration-1500 ease-in-out ${currentProduct?.color?.replace('bg-', 'bg-') || 'bg-green-300'}`}
               style={{ opacity: 0.15, filter: 'blur(100px)' }}
             />
             {/* Right Blob */}
             <div 
               className={`absolute -right-40 bottom-10 w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] rounded-full transition-all duration-1500 ease-in-out ${currentProduct?.color?.replace('bg-', 'bg-') || 'bg-green-200'}`}
               style={{ opacity: 0.12, filter: 'blur(80px)' }}
             />
          </div>

          {/* Main Content Area - 3 Products View (This is the visual anchor) */}
          <div className="relative w-full max-w-5xl mx-auto flex items-center justify-center h-44 sm:h-64 lg:h-80 mt-0 sm:mt-4">

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
                        <Image src={prevProduct.bottle_image} alt={prevProduct.name} fill className="object-contain" />
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
                       <Image 
                         src={currentProduct.bottle_image} 
                         alt={currentProduct.name} 
                         fill 
                         className="object-contain drop-shadow-[0_25px_40px_rgba(0,0,0,0.15)] transition-all duration-700 ease-in-out"
                         priority
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
                        <Image src={nextProduct.bottle_image} alt={nextProduct.name} fill className="object-contain" />
                      </div>
                   </div>
                 )}
              </div>
          </div>

          {/* Title & Price (Below Products) */}
          <div className="text-center z-20 mb-3 sm:mb-4 mt-2 sm:mt-4">
             <h1 
               className="text-xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 tracking-tight transition-all duration-500 ease-in-out"
               style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
             >
                {currentProduct?.name || 'Green Glow'}
             </h1>
             <p className={`text-base sm:text-xl font-bold mt-1.5 sm:mt-1 transition-all duration-500 ease-in-out ${currentProduct?.accent_color || 'text-green-500'}`}>
                {currentProduct ? format(parseFloat(currentProduct.price)) : '$6.50'}
             </p>
          </div>

          {/* Size Selector */}
          <div className="flex items-center justify-center z-20 mt-2 sm:mt-0 mb-4 sm:mb-4">
             <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-full px-1.5 sm:px-2 py-1 sm:py-1.5 shadow-[0_2px_12px_rgba(0,0,0,0.06)] border border-gray-100">
                {(['S', 'M', 'L'] as const).map((size) => (
                  <button 
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold transition-all duration-300 ease-out ${
                      selectedSize === size 
                        ? `bg-white shadow-md ring-2 ring-gray-100 ${currentProduct?.accent_color || 'text-green-600'}` 
                        : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
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
              className={`inline-flex items-center justify-center rounded-full shadow-lg px-8 h-12 font-semibold text-sm transition-all duration-300 ease-out ${
                currentProduct?.bg_accent || 'bg-green-50'
              } ${
                currentProduct?.color?.replace('bg-', 'hover:bg-')?.replace('-500', '-100') || 'hover:bg-green-100'
              } ${
                currentProduct?.accent_color || 'text-green-600'
              } ${
                currentProduct?.color?.replace('bg-', 'ring-') || 'ring-green-500'
              } ring-2`}
            >
               Buy now
            </button>
          </Link>

          {/* Thumbnail Carousel */}
          <div className="w-full max-w-4xl mx-auto px-4 relative pb-2 sm:pb-6 mt-8 sm:mt-0">
              <button 
                onClick={goToPrev} 
                className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors duration-200 z-10"
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
                      <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden transition-all duration-500 ease-in-out ${
                        index === currentIndex 
                          ? `${product.bg_accent || 'bg-green-50'} shadow-lg ring-2 ring-offset-2 ${product.color?.replace('bg-', 'ring-') || 'ring-green-200'}` 
                          : 'bg-gray-50/80'
                      }`}>
                        <Image 
                          src={product.bottle_image} 
                          alt={product.name} 
                          fill 
                          className="object-contain p-2 transition-transform duration-300 group-hover:scale-110" 
                        />
                      </div>
                      <span className={`mt-2.5 text-xs font-semibold text-center transition-all duration-500 ease-in-out max-w-[100px] leading-tight ${
                        index === currentIndex ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {product.name}
                      </span>
                   </div>
                 ))}
              </div>

              <button 
                onClick={goToNext} 
                className="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-gray-300 hover:text-gray-600 transition-colors duration-200 z-10"
              >
                 <ChevronRight className="w-6 h-6 stroke-[1.5]" />
              </button>
          </div>

        </section>

        {/* Browse Categories Section */}
        <CategoryBrowse />

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
