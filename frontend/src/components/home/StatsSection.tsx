"use client";

import { Zap, Gift, Users, TrendingUp } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export function StatsSection() {
  const { t } = useTranslation();

  const stats = [
    { icon: Users, value: "50,000+", labelKey: "home.stats.happyCustomers" as const, suffix: "" },
    { icon: Zap, value: "100,000+", labelKey: "home.stats.juicesDelivered" as const, suffix: "" },
    { icon: Gift, value: "25+", labelKey: "home.stats.menuVarieties" as const, suffix: "" },
    { icon: TrendingUp, value: "4.9", labelKey: "home.stats.averageRating" as const, suffix: "/5" },
  ];

  return (
    <section className="py-16 bg-gray-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex p-4 rounded-2xl bg-white/10 mb-4">
                <stat.icon className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-3xl md:text-4xl font-bold text-white mb-1">
                {stat.value}
                <span className="text-green-400">{stat.suffix}</span>
              </div>
              <div className="text-gray-400 text-sm">{t(stat.labelKey)}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
