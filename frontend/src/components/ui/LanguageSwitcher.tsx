"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { localeNames, localeFlags, type Locale } from "@/locales";
import { ChevronDown, Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const languages: Locale[] = ["id", "en"];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">{localeFlags[locale]}</span>
        <span className="hidden md:inline">{locale.toUpperCase()}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLocale(lang);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 ${
                  locale === lang ? "bg-green-50 text-green-700" : "text-gray-700"
                }`}
              >
                <span className="text-lg">{localeFlags[lang]}</span>
                <span className="font-medium">{localeNames[lang]}</span>
                {locale === lang && (
                  <span className="ml-auto text-green-600">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
