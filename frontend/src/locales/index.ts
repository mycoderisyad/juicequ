import id from './id.json';
import en from './en.json';
import jv from './jv.json';
import su from './su.json';

export const locales = {
  id,
  en,
  jv,
  su,
} as const;

export type Locale = keyof typeof locales;
export type TranslationKeys = typeof id;

export const defaultLocale: Locale = 'id';

export const localeNames: Record<Locale, string> = {
  id: 'Bahasa Indonesia',
  en: 'English',
  jv: 'Basa Jawa',
  su: 'Basa Sunda',
};

export const localeFlags: Record<Locale, string> = {
  id: 'ID',
  en: 'US',
  jv: 'ID',
  su: 'ID',
};

// STT language codes for each locale
export const localeSttCodes: Record<Locale, string> = {
  id: 'id-ID',
  en: 'en-US',
  jv: 'jv-ID',
  su: 'su-ID',
};

// Whether the locale is a regional language (may need LLM translation)
export const isRegionalLocale: Record<Locale, boolean> = {
  id: false,
  en: false,
  jv: true,
  su: true,
};
