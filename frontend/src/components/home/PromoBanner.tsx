"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X, Sparkles } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function PromoBanner() {
  const { t } = useTranslation();
  const [currentPromo, setCurrentPromo] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const promos = [
    {
      id: 1,
      titleKey: "home.promo.firstOrder" as const,
      descriptionKey: "home.promo.getDiscount" as const,
      code: "WELCOME20",
      bgColor: "bg-gradient-to-r from-green-600 to-green-500",
    },
    {
      id: 2,
      titleKey: "home.promo.buy2get1" as const,
      descriptionKey: "home.promo.allSmoothies" as const,
      code: "B2G1FREE",
      bgColor: "bg-gradient-to-r from-orange-500 to-red-500",
    },
    {
      id: 3,
      titleKey: "home.promo.freeDelivery" as const,
      descriptionKey: "home.promo.minOrder" as const,
      code: "FREEONGKIR",
      bgColor: "bg-gradient-to-r from-purple-600 to-pink-500",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promos.length]);

  if (!isVisible) return null;

  const promo = promos[currentPromo];

  return (
    <div className={`${promo.bgColor} text-white py-3 px-4 relative`}>
      <div className="container mx-auto flex items-center justify-center gap-4 text-sm">
        <Sparkles className="h-4 w-4 animate-pulse" />
        <span className="font-semibold">{t(promo.titleKey)}</span>
        <span className="hidden sm:inline">{t(promo.descriptionKey)}</span>
        <span className="rounded-full bg-white/20 px-3 py-1 font-mono text-xs font-bold">
          {promo.code}
        </span>
        <Link 
          href="/menu" 
          className="hidden sm:flex items-center gap-1 font-medium hover:underline"
        >
          {t("home.promo.orderNow")} <ArrowRight className="h-3 w-3" />
        </Link>
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-white/20"
          aria-label="Close banner"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {/* Progress dots */}
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
        {promos.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPromo(i)}
            className={`h-1 rounded-full transition-all ${
              i === currentPromo ? "w-4 bg-white" : "w-1 bg-white/50"
            }`}
            aria-label={`Go to promo ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
