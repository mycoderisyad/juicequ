/**
 * Currency utility functions.
 * Format prices consistently using store currency settings.
 */

export interface CurrencySettings {
  code: string;
  symbol: string;
  locale: string;
}

// Default currency settings (Indonesia)
const DEFAULT_CURRENCY: CurrencySettings = {
  code: "IDR",
  symbol: "Rp",
  locale: "id-ID",
};

// In-memory cache for currency settings
let cachedCurrency: CurrencySettings | null = null;

/**
 * Set currency settings (should be called once app loads store settings).
 */
export function setCurrencySettings(settings: CurrencySettings) {
  cachedCurrency = settings;
}

/**
 * Get current currency settings.
 */
export function getCurrencySettings(): CurrencySettings {
  return cachedCurrency || DEFAULT_CURRENCY;
}

/**
 * Format a number as currency using Intl.NumberFormat.
 * @param amount - The amount to format
 * @param options - Optional override settings
 */
export function formatCurrency(
  amount: number,
  options?: Partial<CurrencySettings>
): string {
  const settings = { ...getCurrencySettings(), ...options };
  
  try {
    return new Intl.NumberFormat(settings.locale, {
      style: "currency",
      currency: settings.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback if locale/currency is invalid
    return `${settings.symbol} ${amount.toLocaleString()}`;
  }
}

/**
 * Format currency with custom decimal places.
 */
export function formatCurrencyPrecise(
  amount: number,
  decimals: number = 2,
  options?: Partial<CurrencySettings>
): string {
  const settings = { ...getCurrencySettings(), ...options };
  
  try {
    return new Intl.NumberFormat(settings.locale, {
      style: "currency",
      currency: settings.code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    return `${settings.symbol} ${amount.toFixed(decimals)}`;
  }
}

/**
 * Format a number with thousand separators (no currency symbol).
 */
export function formatNumber(
  amount: number,
  locale?: string
): string {
  const settings = getCurrencySettings();
  return new Intl.NumberFormat(locale || settings.locale).format(amount);
}

/**
 * Parse a formatted currency string back to number.
 */
export function parseCurrency(value: string): number {
  // Remove all non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d.,]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

/**
 * Format price for display (shorter version for compact UI).
 * E.g., 1500000 -> "1.5M" or "Rp 1,5jt"
 */
export function formatPriceCompact(
  amount: number,
  options?: Partial<CurrencySettings>
): string {
  const settings = { ...getCurrencySettings(), ...options };
  
  if (amount >= 1000000000) {
    return `${settings.symbol} ${(amount / 1000000000).toFixed(1)}B`;
  }
  if (amount >= 1000000) {
    return `${settings.symbol} ${(amount / 1000000).toFixed(1)}M`;
  }
  if (amount >= 1000) {
    return `${settings.symbol} ${(amount / 1000).toFixed(0)}K`;
  }
  return formatCurrency(amount, options);
}

const currencyUtils = {
  formatCurrency,
  formatCurrencyPrecise,
  formatNumber,
  formatPriceCompact,
  parseCurrency,
  setCurrencySettings,
  getCurrencySettings,
};

export default currencyUtils;
