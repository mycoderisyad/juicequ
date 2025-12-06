"use client";

import { useTranslation } from "@/lib/i18n";

export function SkipLink() {
  const { t } = useTranslation();
  
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded-lg focus:bg-green-600 focus:px-4 focus:py-2 focus:text-white focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2"
    >
      {t("common.skipToMainContent", "Skip to main content")}
    </a>
  );
}
