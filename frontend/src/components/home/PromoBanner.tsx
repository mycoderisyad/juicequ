"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, X, Sparkles, Gift } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function PromoBanner() {
  const { t } = useTranslation();
  const [currentPromo, setCurrentPromo] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  const promos = [
    {
      id: 1,
      titleKey: "home.promo.firstOrder" as const,
      descriptionKey: "home.promo.getDiscount" as const,
      code: "WELCOME20",
      bgColor: "from-green-500 to-emerald-600",
      iconBg: "bg-green-400/30",
    },
    {
      id: 2,
      titleKey: "home.promo.buy2get1" as const,
      descriptionKey: "home.promo.allSmoothies" as const,
      code: "B2G1FREE",
      bgColor: "from-orange-500 to-red-500",
      iconBg: "bg-orange-400/30",
    },
    {
      id: 3,
      titleKey: "home.promo.freeDelivery" as const,
      descriptionKey: "home.promo.minOrder" as const,
      code: "FREEONGKIR",
      bgColor: "from-purple-500 to-pink-500",
      iconBg: "bg-purple-400/30",
    },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPromo((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promos.length]);

  const handleClose = () => {
    setIsVisible(false);
  };

  if (!isVisible || !mounted) return null;

  const promo = promos[currentPromo];

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:bottom-4 z-40 max-w-sm sm:max-w-md animate-in slide-in-from-bottom-4 duration-500">
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${promo.bgColor} p-4 shadow-2xl`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleClose();
          }}
          className="absolute right-2 top-2 z-10 rounded-full p-2 text-white/80 hover:text-white hover:bg-white/30 transition-colors cursor-pointer"
          aria-label="Close banner"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative flex items-start gap-3">
          <div className={`shrink-0 p-2.5 rounded-xl ${promo.iconBg}`}>
            <Gift className="h-5 w-5 text-white" />
          </div>
          
          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
              <span className="text-xs font-medium text-white/80 uppercase tracking-wide">Promo</span>
            </div>
            <h3 className="text-white font-bold text-sm sm:text-base leading-tight mb-1">
              {t(promo.titleKey)}
            </h3>
            <p className="text-white/80 text-xs sm:text-sm mb-3 line-clamp-2">
              {t(promo.descriptionKey)}
            </p>
            
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-3 py-1 font-mono text-xs font-bold text-white">
                {promo.code}
              </span>
              <Link 
                href="/menu" 
                className="inline-flex items-center gap-1 text-xs font-semibold text-white hover:underline"
              >
                {t("home.promo.orderNow")} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>

        <div className="flex justify-center gap-1.5 mt-3">
          {promos.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPromo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentPromo ? "w-6 bg-white" : "w-1.5 bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to promo ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
