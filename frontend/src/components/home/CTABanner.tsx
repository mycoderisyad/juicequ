"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function CTABanner() {
  const { t } = useTranslation();

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-r from-green-600 via-green-500 to-teal-500 p-8 md:p-16">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          
          {/* Floating juice bottles decoration */}
          <div className="absolute right-10 top-1/2 -translate-y-1/2 hidden lg:block">
            <div className="relative">
              <div className="h-48 w-20 rounded-full bg-white/20 shadow-2xl transform rotate-12" />
              <div className="absolute -left-16 top-8 h-40 w-16 rounded-full bg-white/15 shadow-xl transform -rotate-6" />
              <div className="absolute -right-12 top-4 h-36 w-14 rounded-full bg-white/10 shadow-lg transform rotate-6" />
            </div>
          </div>

          <div className="relative z-10 max-w-2xl">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
              {t("home.cta.title")}
            </h2>
            <p className="text-lg text-white/90 mb-8">
              {t("home.cta.subtitle")}
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/menu"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-green-600 font-semibold rounded-full hover:bg-gray-100 transition-colors shadow-lg"
              >
                {t("home.cta.orderNow")}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/chat"
                className="inline-flex items-center gap-2 px-8 py-4 bg-white/20 text-white font-semibold rounded-full hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                {t("home.cta.chatWithAI")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
