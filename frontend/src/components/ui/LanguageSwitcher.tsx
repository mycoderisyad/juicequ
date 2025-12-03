"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { localeNames, localeFlags, type Locale } from "@/locales";
import { ChevronDown, Globe, Check } from "lucide-react";

interface LanguageSwitcherProps {
  variant?: "default" | "minimal";
}

export function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const languages: Locale[] = ["id", "en"];

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Minimal variant - just text with dropdown
  if (variant === "minimal") {
    return (
      <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-green-600 transition-colors"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={t("nav.selectLanguage")}
          id="language-switcher-button"
        >
          <Globe className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{locale.toUpperCase()}</span>
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>

        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <ul 
              className="absolute right-0 bottom-full z-50 mb-2 min-w-[140px] overflow-hidden rounded-lg border border-gray-100 bg-white shadow-lg py-1"
              role="listbox"
              aria-labelledby="language-switcher-button"
              aria-activedescendant={`lang-${locale}`}
            >
              {languages.map((lang) => (
                <li key={lang} role="option" aria-selected={locale === lang} id={`lang-${lang}`}>
                  <button
                    onClick={() => {
                      setLocale(lang);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                      locale === lang ? "text-green-600 font-medium" : "text-gray-700"
                    }`}
                    lang={lang}
                  >
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true">{localeFlags[lang]}</span>
                      <span>{locale === lang ? localeNames[lang] : lang.toUpperCase()}</span>
                    </div>
                    {locale === lang && <Check className="h-4 w-4" />}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-200"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t("nav.selectLanguage")}
        id="language-switcher-button"
      >
        <Globe className="h-4 w-4" aria-hidden="true" />
        <span className="hidden md:inline">{locale.toUpperCase()}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <ul 
            className="absolute right-0 top-full z-50 mt-2 min-w-[160px] overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg"
            role="listbox"
            aria-labelledby="language-switcher-button"
            aria-activedescendant={`lang-${locale}`}
          >
            {languages.map((lang) => (
              <li key={lang} role="option" aria-selected={locale === lang} id={`lang-${lang}`}>
                <button
                  onClick={() => {
                    setLocale(lang);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-gray-50 ${
                    locale === lang ? "bg-green-50 text-green-700" : "text-gray-700"
                  }`}
                  lang={lang}
                >
                  <span className="text-lg" aria-hidden="true">{localeFlags[lang]}</span>
                  <span className="font-medium">{localeNames[lang]}</span>
                  {locale === lang && (
                    <Check className="ml-auto h-4 w-4 text-green-600" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
