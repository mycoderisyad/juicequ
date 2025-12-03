/**
 * Currency Store.
 * Manages exchange rates and currency conversion.
 * Base currency is IDR (prices stored in database are in IDR).
 * User can select display currency (USD, EUR, etc.) and prices will be converted.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { currencyApi } from "@/lib/api/currency";

interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  lastUpdate: string;
  isFallback: boolean;
}

interface CurrencySettings {
  code: string;
  symbol: string;
  locale: string;
}

interface CurrencyState {
  // Display currency (what user wants to see)
  displayCurrency: CurrencySettings;
  
  // Base currency (prices in database - IDR)
  baseCurrency: string;
  
  // Exchange rates (base: USD from API)
  exchangeRates: ExchangeRates | null;
  isLoadingRates: boolean;
  ratesError: string | null;
  
  // Available currencies
  availableCurrencies: CurrencySettings[];
  
  // Actions
  setDisplayCurrency: (settings: CurrencySettings) => void;
  fetchExchangeRates: () => Promise<void>;
  convertPrice: (amount: number, fromCurrency?: string) => number;
  formatPrice: (amount: number, fromCurrency?: string) => string;
  getRate: (fromCurrency: string, toCurrency: string) => number;
}

// Default to IDR (base currency)
const DEFAULT_DISPLAY_CURRENCY: CurrencySettings = {
  code: "IDR",
  symbol: "Rp",
  locale: "id-ID",
};

// Available currencies for selection
const AVAILABLE_CURRENCIES: CurrencySettings[] = [
  { code: "IDR", symbol: "Rp", locale: "id-ID" },
  { code: "USD", symbol: "$", locale: "en-US" },
  { code: "EUR", symbol: "€", locale: "de-DE" },
  { code: "GBP", symbol: "£", locale: "en-GB" },
  { code: "SGD", symbol: "S$", locale: "en-SG" },
  { code: "MYR", symbol: "RM", locale: "ms-MY" },
  { code: "JPY", symbol: "¥", locale: "ja-JP" },
  { code: "AUD", symbol: "A$", locale: "en-AU" },
  { code: "CNY", symbol: "¥", locale: "zh-CN" },
  { code: "THB", symbol: "฿", locale: "th-TH" },
];

// Cache duration: 30 minutes
const CACHE_DURATION_MS = 30 * 60 * 1000;

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set, get) => ({
      displayCurrency: DEFAULT_DISPLAY_CURRENCY,
      baseCurrency: "IDR", // Prices in DB are in IDR
      exchangeRates: null,
      isLoadingRates: false,
      ratesError: null,
      availableCurrencies: AVAILABLE_CURRENCIES,

      setDisplayCurrency: (settings) => {
        set({ displayCurrency: settings });
      },

      fetchExchangeRates: async () => {
        const state = get();
        
        // Check if we have recent rates
        if (state.exchangeRates) {
          const lastUpdate = new Date(state.exchangeRates.lastUpdate).getTime();
          if (Date.now() - lastUpdate < CACHE_DURATION_MS) {
            return; // Use cached rates
          }
        }

        set({ isLoadingRates: true, ratesError: null });

        try {
          // Fetch rates with USD as base (API standard)
          const rates = await currencyApi.getRates("USD");
          set({
            exchangeRates: {
              base: rates.base,
              rates: rates.rates,
              lastUpdate: new Date().toISOString(),
              isFallback: rates.is_fallback,
            },
            isLoadingRates: false,
          });
        } catch (error) {
          console.error("Failed to fetch exchange rates:", error);
          set({
            ratesError: "Failed to fetch exchange rates",
            isLoadingRates: false,
          });
        }
      },

      getRate: (fromCurrency: string, toCurrency: string) => {
        if (fromCurrency === toCurrency) return 1;

        const { exchangeRates } = get();
        if (!exchangeRates) {
          // Fallback rates if API not available
          const fallbackRates: Record<string, number> = {
            USD: 1,
            IDR: 15800,
            EUR: 0.92,
            GBP: 0.79,
            SGD: 1.34,
            MYR: 4.47,
            JPY: 149.5,
            AUD: 1.53,
            CNY: 7.24,
            THB: 35.5,
          };
          
          const fromRate = fallbackRates[fromCurrency] || 1;
          const toRate = fallbackRates[toCurrency] || 1;
          return toRate / fromRate;
        }

        const { rates, base } = exchangeRates;

        // If converting from base currency (USD)
        if (fromCurrency === base && rates[toCurrency]) {
          return rates[toCurrency];
        }

        // If converting to base currency (USD)
        if (toCurrency === base && rates[fromCurrency]) {
          return 1 / rates[fromCurrency];
        }

        // Cross rate calculation
        if (rates[fromCurrency] && rates[toCurrency]) {
          return rates[toCurrency] / rates[fromCurrency];
        }

        return 1;
      },

      convertPrice: (amount: number, fromCurrency?: string) => {
        const { displayCurrency, baseCurrency, getRate } = get();
        const from = fromCurrency || baseCurrency; // Default from IDR
        const to = displayCurrency.code;

        if (from === to) return amount;

        const rate = getRate(from, to);
        return amount * rate;
      },

      formatPrice: (amount: number, fromCurrency?: string) => {
        const { displayCurrency, convertPrice } = get();
        const convertedAmount = convertPrice(amount, fromCurrency);

        try {
          // For currencies like JPY, IDR - no decimals needed
          const noDecimalCurrencies = ["IDR", "JPY", "KRW", "VND"];
          const decimals = noDecimalCurrencies.includes(displayCurrency.code) ? 0 : 2;
          
          return new Intl.NumberFormat(displayCurrency.locale, {
            style: "currency",
            currency: displayCurrency.code,
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(convertedAmount);
        } catch {
          return `${displayCurrency.symbol} ${Math.round(convertedAmount).toLocaleString()}`;
        }
      },
    }),
    {
      name: "currency-store",
      partialize: (state) => ({
        displayCurrency: state.displayCurrency,
        exchangeRates: state.exchangeRates,
      }),
    }
  )
);

// Hook to use currency with auto-fetch
export function useCurrency() {
  const store = useCurrencyStore();

  // Fetch rates on first use if not IDR (no conversion needed for IDR)
  if (store.displayCurrency.code !== "IDR" && !store.exchangeRates && !store.isLoadingRates) {
    store.fetchExchangeRates();
  }

  return {
    ...store,
    // Convenience methods
    format: store.formatPrice,
    convert: store.convertPrice,
  };
}

export default useCurrencyStore;
