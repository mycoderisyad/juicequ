"use client";

import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, CheckCircle2, Leaf } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const reviews = [
  {
    id: 1,
    name: "Sarah Wijaya",
    role: "Green Goddess Lover",
    initials: "SW",
    rating: 5,
    review: "JuiceQu adalah tempat juice favorit saya! Rasanya segar dan bahan-bahannya berkualitas. Green Goddess adalah pilihan terbaik untuk detox pagi hari.",
    product: "Green Goddess",
    color: "bg-emerald-100 text-emerald-700",
    verified: true,
  },
  {
    id: 2,
    name: "Budi Santoso",
    role: "Health Enthusiast",
    initials: "BS",
    rating: 5,
    review: "Pengiriman cepat dan juice-nya masih segar sampai rumah. Berry Blast favorit anak-anak saya. Pasti akan order lagi untuk stok mingguan.",
    product: "Berry Blast",
    color: "bg-rose-100 text-rose-700",
    verified: true,
  },
  {
    id: 3,
    name: "Amanda Putri",
    role: "Yoga Instructor",
    initials: "AP",
    rating: 5,
    review: "Suka banget dengan Tropical Paradise! Rasa manggis dan nanas-nya pas banget. Cocok diminum saat cuaca panas setelah sesi yoga.",
    product: "Tropical Paradise",
    color: "bg-amber-100 text-amber-700",
    verified: true,
  },
  {
    id: 4,
    name: "Reza Pratama",
    role: "Fitness Coach",
    initials: "RP",
    rating: 5,
    review: "Protein Power sangat membantu recovery setelah gym. Rasanya enak dan tidak terlalu manis. Recommended untuk yang aktif olahraga!",
    product: "Protein Power",
    color: "bg-blue-100 text-blue-700",
    verified: true,
  },
  {
    id: 5,
    name: "Dina Maharani",
    role: "Content Creator",
    initials: "DM",
    rating: 5,
    review: "Acai Bowl-nya enak banget! Toppingnya banyak dan fresh. Worth the price. Pelayanannya juga ramah dan cepat.",
    product: "Acai Bowl",
    color: "bg-purple-100 text-purple-700",
    verified: true,
  },
];

export function CustomerReviews() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const reviewsPerPage = isMobile ? 1 : 3;
  const maxIndex = Math.ceil(reviews.length / reviewsPerPage) - 1;

  const goNext = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  const goPrev = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));

  const visibleReviews = reviews.slice(
    currentIndex * reviewsPerPage,
    (currentIndex + 1) * reviewsPerPage
  );

  const stats = [
    { value: '4.9', labelKey: 'home.reviews.averageRating', stars: true },
    { value: '5000+', labelKey: 'home.reviews.happyCustomers' },
    { value: '98%', labelKey: 'home.reviews.wouldRecommend' }
  ];

  return (
    <section className="relative py-12 sm:py-16 lg:py-20 bg-linear-to-b from-stone-50 to-white overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-lime-200/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-12 sm:mb-16 space-y-4">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-emerald-100 text-emerald-700 text-sm font-medium shadow-sm">
            <Leaf size={14} />
            {t("home.reviews.badge")}
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-serif font-medium text-emerald-950 tracking-tight">
            {t("home.reviews.title").split(' ').slice(0, 2).join(' ')} <br/>
            <span className="italic text-emerald-600">{t("home.reviews.title").split(' ').slice(2).join(' ')}</span>
          </h2>
          <p className="max-w-2xl mx-auto text-stone-500 text-base sm:text-lg leading-relaxed px-4">
            {t("home.reviews.subtitle")}
          </p>
        </div>

        {/* Stats Row */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-12 sm:mb-16">
          {stats.map((stat, idx) => (
            <div key={idx} className="flex flex-col items-center group cursor-default">
              <div className="text-3xl sm:text-4xl font-serif text-emerald-800 font-medium mb-1 transition-transform group-hover:-translate-y-1 duration-300">
                {stat.value}
              </div>
              <div className="flex flex-col items-center">
                {stat.stars && (
                  <div className="flex gap-0.5 mb-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} fill="currentColor" />
                    ))}
                  </div>
                )}
                <span className="text-xs sm:text-sm font-medium text-stone-400 uppercase tracking-wider">
                  {t(stat.labelKey as Parameters<typeof t>[0])}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {visibleReviews.map((review) => (
            <div 
              key={review.id}
              className="group relative bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300 border border-stone-100 hover:border-emerald-100 flex flex-col"
            >
              {/* Giant Quote Icon Background */}
              <Quote className="absolute top-6 right-6 sm:top-8 sm:right-8 text-stone-100 group-hover:text-emerald-50 transition-colors duration-300" size={60} />

              {/* Rating */}
              <div className="flex gap-1 mb-4 sm:mb-6 relative z-10">
                {[...Array(review.rating)].map((_, i) => (
                  <Star key={i} size={16} className="text-amber-400 fill-amber-400" />
                ))}
              </div>

              {/* Content */}
              <p className="text-stone-600 leading-relaxed mb-6 sm:mb-8 relative z-10 grow text-sm sm:text-base">
                &ldquo;{review.review}&rdquo;
              </p>

              {/* Product Tag */}
              <div className="mb-4 sm:mb-6 relative z-10">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-400 bg-stone-50 px-2 py-1 rounded-md">
                  <CheckCircle2 size={12} className="text-emerald-500" />
                  {t("common.verified")} Order: {review.product}
                </span>
              </div>

              {/* User Profile */}
              <div className="flex items-center gap-3 sm:gap-4 relative z-10 mt-auto border-t border-stone-100 pt-4 sm:pt-6">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-serif text-base sm:text-lg font-bold shadow-inner ${review.color}`}>
                  {review.initials}
                </div>
                <div>
                  <h4 className="font-bold text-stone-800 text-base sm:text-lg leading-none mb-1">
                    {review.name}
                  </h4>
                  <p className="text-stone-400 text-xs sm:text-sm">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-10 sm:mt-16 flex justify-center items-center gap-4">
          <button 
            onClick={goPrev}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-emerald-200 text-emerald-700 flex items-center justify-center hover:bg-emerald-50 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Previous reviews"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex gap-2">
            {Array.from({ length: maxIndex + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i === currentIndex 
                    ? "bg-emerald-600" 
                    : "bg-emerald-200 hover:bg-emerald-300 cursor-pointer"
                }`}
                aria-label={`Go to page ${i + 1}`}
              />
            ))}
          </div>

          <button 
            onClick={goNext}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 hover:bg-emerald-700 hover:scale-105 transition-all focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
            aria-label="Next reviews"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
