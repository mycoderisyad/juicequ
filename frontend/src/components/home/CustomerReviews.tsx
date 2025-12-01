"use client";

import { useState, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const reviews = [
  {
    id: 1,
    name: "Sarah Wijaya",
    avatar: "SW",
    rating: 5,
    review: "JuiceQu adalah tempat juice favorit saya! Rasanya segar dan bahan-bahannya berkualitas. Green Goddess adalah pilihan terbaik untuk detox pagi hari.",
    product: "Green Goddess",
    date: "2 hari lalu",
    verified: true,
  },
  {
    id: 2,
    name: "Budi Santoso",
    avatar: "BS",
    rating: 5,
    review: "Pengiriman cepat dan juice-nya masih segar sampai rumah. Berry Blast favorit anak-anak saya. Pasti akan order lagi!",
    product: "Berry Blast",
    date: "1 minggu lalu",
    verified: true,
  },
  {
    id: 3,
    name: "Amanda Putri",
    avatar: "AP",
    rating: 5,
    review: "Suka banget dengan Tropical Paradise! Rasa manggis dan nanas-nya pas banget. Cocok diminum saat cuaca panas.",
    product: "Tropical Paradise",
    date: "3 hari lalu",
    verified: true,
  },
  {
    id: 4,
    name: "Reza Pratama",
    avatar: "RP",
    rating: 4,
    review: "Protein Power sangat membantu recovery setelah gym. Rasanya enak dan tidak terlalu manis. Recommended!",
    product: "Protein Power",
    date: "5 hari lalu",
    verified: true,
  },
  {
    id: 5,
    name: "Dina Maharani",
    avatar: "DM",
    rating: 5,
    review: "Acai Bowl-nya enak banget! Toppingnya banyak dan fresh. Worth the price. Pelayanannya juga ramah.",
    product: "Acai Bowl",
    date: "1 minggu lalu",
    verified: true,
  },
];

export function CustomerReviews() {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const reviewsPerPage = 3;
  const maxIndex = Math.ceil(reviews.length / reviewsPerPage) - 1;

  const goNext = () => setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1));
  const goPrev = () => setCurrentIndex((prev) => (prev <= 0 ? maxIndex : prev - 1));

  // Auto slide
  useEffect(() => {
    const interval = setInterval(goNext, 6000);
    return () => clearInterval(interval);
  }, []);

  const visibleReviews = reviews.slice(
    currentIndex * reviewsPerPage,
    (currentIndex + 1) * reviewsPerPage
  );

  return (
    <section className="py-20 bg-gradient-to-b from-white to-green-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-medium mb-4">
            {t("home.reviews.badge")}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t("home.reviews.title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("home.reviews.subtitle")}
          </p>
        </div>

        {/* Stats */}
        <div className="flex justify-center gap-8 md:gap-16 mb-12">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-600">4.9</div>
            <div className="flex justify-center mt-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <div className="text-sm text-gray-500 mt-1">{t("home.reviews.averageRating")}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-600">5000+</div>
            <div className="text-sm text-gray-500 mt-2">{t("home.reviews.happyCustomers")}</div>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold text-green-600">98%</div>
            <div className="text-sm text-gray-500 mt-2">{t("home.reviews.wouldRecommend")}</div>
          </div>
        </div>

        {/* Reviews Grid */}
        <div className="relative">
          <div className="grid gap-6 md:grid-cols-3">
            {visibleReviews.map((review) => (
              <div
                key={review.id}
                className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-100 hover:shadow-xl transition-shadow"
              >
                <Quote className="h-8 w-8 text-green-200 mb-4" />
                <p className="text-gray-700 mb-6 line-clamp-4">{review.review}</p>
                
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold">
                    {review.avatar}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900">{review.name}</span>
                      {review.verified && (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                          {t("common.verified")}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex">
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-400">• {review.product}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-2 mt-8">
            <button
              onClick={goPrev}
              className="h-10 w-10 rounded-full bg-white shadow-md flex items-center justify-center text-gray-600 hover:bg-gray-50"
              aria-label="Previous reviews"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1.5">
              {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentIndex(i)}
                  className={`h-2 rounded-full transition-all ${
                    i === currentIndex ? "w-6 bg-green-600" : "w-2 bg-gray-300"
                  }`}
                  aria-label={`Go to page ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={goNext}
              className="h-10 w-10 rounded-full bg-green-600 shadow-md flex items-center justify-center text-white hover:bg-green-700"
              aria-label="Next reviews"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
