"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { useCurrency } from "@/lib/hooks/use-store";

interface Product {
  id: string | number;
  name: string;
  price: string;
  color: string;
  thumbnail_image?: string;
  bottle_image?: string;
}

interface ProductCarouselProps {
  products: Product[];
  speed?: number; // duration in seconds for one complete loop
}

export function ProductCarousel({ products, speed = 30 }: ProductCarouselProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const [isPaused, setIsPaused] = useState(false);
  
  // Duplicate products for seamless infinite scroll
  const shouldDuplicate = products.length >= 4;
  const displayProducts = shouldDuplicate ? [...products, ...products] : products;

  const handleProductClick = (productId: string | number) => {
    router.push(`/products/${productId}`);
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">
            {t("home.featuredProducts.title")} <span role="img" aria-label="fire">🔥</span>
          </h2>
          <p className="mt-2 text-gray-500">{t("home.featuredProducts.subtitle")}</p>
        </div>
        <Link 
          href="/menu"
          className="group flex items-center gap-2 text-green-600 font-semibold hover:text-green-700 transition-colors"
        >
          {t("home.featuredProducts.viewAll")}
          <ArrowRight className="h-5 w-5 transition-transform" />
        </Link>
      </div>

      {/* Infinite Scroll Carousel */}
      <div 
        className="overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ 
          maskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)',
          WebkitMaskImage: 'linear-gradient(to right, transparent, black 3%, black 97%, transparent)'
        }}
      >
        <div 
          className="flex gap-6 w-max"
          style={{
            animation: shouldDuplicate ? `scroll ${speed}s linear infinite` : undefined,
            animationPlayState: isPaused ? 'paused' : 'running',
          }}
        >
          {displayProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="w-72 shrink-0"
            >
              <div 
                className="group relative block rounded-3xl bg-gray-50 p-6 transition-all hover:bg-white hover:shadow-xl hover:shadow-gray-200/50 cursor-pointer"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="mb-6 flex h-48 items-center justify-center">
                  {(product.thumbnail_image || product.bottle_image) ? (
                    <img
                      src={product.thumbnail_image || product.bottle_image}
                      alt={product.name}
                      className="h-40 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                    />
                  ) : (
                    <div 
                      className={`h-40 w-20 rounded-full ${product.color} opacity-80 shadow-lg transition-transform duration-300 group-hover:scale-110`}
                    />
                  )}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                <div className="mt-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">{t("common.starting")}</p>
                    <p className="text-lg font-bold text-gray-900">{formatCurrency(parseInt(product.price))}</p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-900 shadow-sm transition-colors group-hover:bg-green-600 group-hover:text-white">
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>
    </div>
  );
}
