"use client";

import React, { createContext, useContext, useState, useCallback, useSyncExternalStore } from 'react';
import { locales, defaultLocale, type Locale, type TranslationKeys } from '@/locales';

type NestedKeyOf<T> = T extends object
  ? { [K in keyof T]: K extends string
      ? T[K] extends object
        ? `${K}` | `${K}.${NestedKeyOf<T[K]>}`
        : `${K}`
      : never
    }[keyof T]
  : never;

type TranslationKey = NestedKeyOf<TranslationKeys>;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return path;
    }
    current = (current as Record<string, unknown>)[key];
  }
  
  if (typeof current === 'string') {
    return current;
  }
  
  return path;
}

// Helper for hydration-safe mounting check
function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return defaultLocale;
  const savedLocale = localStorage.getItem('juicequ-locale') as Locale | null;
  return savedLocale && locales[savedLocale] ? savedLocale : defaultLocale;
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getInitialLocale);
  const mounted = useIsMounted();

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('juicequ-locale', newLocale);
    document.documentElement.lang = newLocale;
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    const translations = locales[locale];
    let value = getNestedValue(translations as unknown as Record<string, unknown>, key);
    
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        value = value.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(paramValue));
      });
    }
    
    return value;
  }, [locale]);

  if (!mounted) {
    return (
      <I18nContext.Provider value={{ locale: defaultLocale, setLocale, t }}>
        {children}
      </I18nContext.Provider>
    );
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t, locale, setLocale } = useI18n();
  return { t, locale, setLocale };
}
