import id from './id.json';
import en from './en.json';

export const locales = {
  id,
  en,
} as const;

export type Locale = keyof typeof locales;
export type TranslationKeys = typeof id;

export const defaultLocale: Locale = 'id';

export const localeNames: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
};

export const localeFlags: Record<Locale, string> = {
  id: '🇮🇩',
  en: '🇺🇸',
};
