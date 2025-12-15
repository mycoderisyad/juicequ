"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, MessageCircle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function CTABanner() {
  const { t } = useTranslation();

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 bg-stone-50 overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-80 h-80 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-lime-100/30 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="relative overflow-hidden rounded-3xl sm:rounded-[2rem] lg:rounded-[2.5rem] bg-white border border-stone-100 shadow-[0_4px_40px_rgba(0,0,0,0.04)] p-8 sm:p-12 md:p-16 lg:p-20">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 sm:w-80 lg:w-[500px] h-64 sm:h-80 lg:h-[500px] bg-emerald-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-48 sm:w-64 lg:w-80 h-48 sm:h-64 lg:h-80 bg-lime-50 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
          
          {/* Floating decorative elements */}
          <div className="absolute right-8 sm:right-16 lg:right-24 top-1/2 -translate-y-1/2 hidden md:block">
            <div className="relative">
              <div className="h-40 w-16 sm:h-52 sm:w-20 lg:h-64 lg:w-24 rounded-full bg-emerald-100 shadow-lg transform rotate-12" />
              <div className="absolute -left-12 sm:-left-16 top-6 sm:top-8 h-32 w-12 sm:h-44 sm:w-16 lg:h-52 lg:w-20 rounded-full bg-lime-100 shadow-md transform -rotate-6" />
              <div className="absolute -right-8 sm:-right-12 top-3 sm:top-4 h-28 w-10 sm:h-36 sm:w-14 lg:h-44 lg:w-16 rounded-full bg-emerald-50 shadow-sm transform rotate-6" />
            </div>
          </div>

          <div className="relative z-10 max-w-2xl">
            {/* Badge */}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
              <Sparkles size={14} className="text-amber-500" />
              {t("home.cta.badge") || "Special Offer"}
            </span>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-emerald-950 tracking-tight mb-4">
              {t("home.cta.title")}
            </h2>
            <p className="text-stone-500 text-base sm:text-lg mb-8 sm:mb-10 leading-relaxed max-w-xl">
              {t("home.cta.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/menu"
                className="group inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 text-sm sm:text-base"
              >
                {t("home.cta.orderNow")}
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-white border border-stone-200 text-stone-700 font-semibold rounded-full hover:bg-stone-50 hover:border-stone-300 transition-all text-sm sm:text-base"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                {t("home.cta.chatWithAI")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
