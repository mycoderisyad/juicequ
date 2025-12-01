"use client";

import Link from "next/link";
import { Button } from "@/components/ui";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { PromoBanner } from "@/components/home/PromoBanner";
import { CustomerReviews } from "@/components/home/CustomerReviews";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { CTABanner } from "@/components/home/CTABanner";
import { StatsSection } from "@/components/home/StatsSection";
import { useTranslation } from "@/lib/i18n";
import { 
  Play, 
  ChevronLeft, 
  ChevronRight,
  Star,
} from "lucide-react";
import { menuItems } from "@/lib/data";

export default function HomePage() {
  const { t } = useTranslation();
  
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
                    <Button size="xl" className="bg-red-700 hover:bg-red-800 text-white shadow-lg shadow-red-700/20 h-14 px-8 rounded-full">
                      {t("home.hero.orderNow")}
                    </Button>
                  </Link>
                  <button className="group flex items-center gap-3 rounded-full bg-white px-6 py-4 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-gray-200 transition-all hover:shadow-md">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-red-700 transition-colors group-hover:bg-red-700 group-hover:text-white">
                      <Play className="h-4 w-4 fill-current" />
                    </div>
                    {t("home.hero.howItWorks")}
                  </button>
                </div>
              </div>

              {/* Right Content (Image & Floating Elements) */}
              <div className="relative lg:h-[600px]">
                {/* Main Bottle Image Placeholder */}
                <div className="relative z-10 mx-auto h-[400px] w-[200px] lg:h-[500px] lg:w-[250px]">
                  <div className="absolute inset-0 rounded-[3rem] bg-linear-to-b from-red-400 to-red-600 opacity-90 shadow-2xl shadow-red-900/20"></div>
                  {/* Glass reflection effect */}
                  <div className="absolute left-4 top-4 bottom-4 w-4 rounded-full bg-white/20 blur-sm"></div>
                </div>

                {/* Floating Ingredients (Simulated with colored circles/shapes for now) */}
                <div className="absolute top-1/4 left-10 h-12 w-12 rounded-full bg-red-600 blur-sm animate-pulse"></div>
                <div className="absolute bottom-1/3 right-20 h-8 w-8 rounded-full bg-green-500 blur-sm"></div>
                <div className="absolute top-10 right-10 h-16 w-16 rounded-full bg-red-500/20 blur-xl"></div>

                {/* Floating Details Card */}
                <div className="absolute right-0 top-1/3 z-20 w-64 rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50 animate-in fade-in slide-in-from-right-10 duration-700">
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500">Details</h3>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-gray-900">$8.50</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">Berry Blast</p>
                  </div>
                  
                  <div className="mb-6 flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star key={i} className="h-4 w-4 fill-orange-400 text-orange-400" />
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-colors">
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 text-gray-400 hover:border-gray-900 hover:text-gray-900 transition-colors">
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Decorative Curve Line */}
                <svg className="absolute -right-20 top-10 -z-10 h-full w-full text-red-800/5" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <path d="M50 0 C 80 20, 100 50, 80 100" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </div>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute top-0 right-0 -z-10 h-[600px] w-[600px] rounded-full bg-green-50/50 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -z-10 h-[400px] w-[400px] rounded-full bg-red-50/50 blur-3xl"></div>
        </section>

        {/* Lineup Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <ProductCarousel products={menuItems} speed={25} />
          </div>
        </section>

        {/* Why Choose Us */}
        <WhyChooseUs />

        {/* Stats Section */}
        <StatsSection />

        {/* Customer Reviews */}
        <CustomerReviews />

        {/* CTA Banner */}
        <CTABanner />
      </main>
      
      <Footer />
    </div>
  );
}
