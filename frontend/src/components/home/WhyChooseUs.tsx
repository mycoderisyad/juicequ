"use client";

import { Leaf, Heart, Clock, Shield, Recycle, Zap } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const featureIcons = [
  { icon: Leaf, color: "text-green-600", bgColor: "bg-green-100", key: "fresh" },
  { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100", key: "preOrder" },
  { icon: Heart, color: "text-red-500", bgColor: "bg-red-100", key: "healthy" },
  { icon: Zap, color: "text-orange-500", bgColor: "bg-orange-100", key: "freshDaily" },
  { icon: Shield, color: "text-purple-600", bgColor: "bg-purple-100", key: "quality" },
  { icon: Recycle, color: "text-teal-600", bgColor: "bg-teal-100", key: "eco" },
];

export function WhyChooseUs() {
  const { t } = useTranslation();

  return (
    <section className="py-10 sm:py-16 lg:py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
            {t("home.whyChooseUs.title")}
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto px-4">
            {t("home.whyChooseUs.subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-4 sm:gap-6 lg:gap-8 grid-cols-2 lg:grid-cols-3">
          {featureIcons.map((feature, index) => (
            <div
              key={index}
              className="group p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all duration-300"
            >
              <div className={`inline-flex p-2.5 sm:p-4 rounded-xl sm:rounded-2xl ${feature.bgColor} mb-3 sm:mb-5`}>
                <feature.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${feature.color}`} />
              </div>
              <h3 className="text-sm sm:text-lg lg:text-xl font-bold text-gray-900 mb-1 sm:mb-2">
                {t(`home.whyChooseUs.features.${feature.key}.title` as "home.whyChooseUs.features.fresh.title")}
              </h3>
              <p className="text-xs sm:text-sm lg:text-base text-gray-600 line-clamp-3">
                {t(`home.whyChooseUs.features.${feature.key}.description` as "home.whyChooseUs.features.fresh.description")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
