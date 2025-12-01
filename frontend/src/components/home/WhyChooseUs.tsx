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
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t("home.whyChooseUs.title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("home.whyChooseUs.subtitle")}
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {featureIcons.map((feature, index) => (
            <div
              key={index}
              className="group p-6 rounded-3xl bg-gray-50 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all duration-300"
            >
              <div className={`inline-flex p-4 rounded-2xl ${feature.bgColor} mb-5`}>
                <feature.icon className={`h-6 w-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t(`home.whyChooseUs.features.${feature.key}.title` as "home.whyChooseUs.features.fresh.title")}
              </h3>
              <p className="text-gray-600">
                {t(`home.whyChooseUs.features.${feature.key}.description` as "home.whyChooseUs.features.fresh.description")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
