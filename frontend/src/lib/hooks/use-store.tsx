/**
 * Store Settings Hook.
 * Provides access to store settings throughout the app.
 */
"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from "react";
import storeApi, { type StoreInfo, type CurrencyInfo, type StoreHours } from "@/lib/api/store";
import { setCurrencySettings } from "@/lib/currency";
import { useCurrencyStore } from "@/store/currency-store";

interface StoreContextType {
  storeInfo: StoreInfo | null;
  currency: CurrencyInfo | null;
  hours: StoreHours | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isStoreOpen: boolean;
}

const StoreContext = createContext<StoreContextType | null>(null);

interface StoreProviderProps {
  children: ReactNode;
}

export function StoreProvider({ children }: StoreProviderProps) {
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [currency, setCurrency] = useState<CurrencyInfo | null>(null);
  const [hours, setHours] = useState<StoreHours | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStoreData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [infoData, currencyData, hoursData] = await Promise.all([
        storeApi.getInfo().catch(() => null),
        storeApi.getCurrency().catch(() => null),
        storeApi.getHours().catch(() => null),
      ]);

      if (infoData) {
        setStoreInfo(infoData);
      }

      if (currencyData) {
        setCurrency(currencyData);
        // Update global currency settings
        setCurrencySettings({
          code: currencyData.code,
          symbol: currencyData.symbol,
          locale: currencyData.locale,
        });
      }

      if (hoursData) {
        setHours(hoursData);
      }
    } catch (err) {
      console.error("Failed to fetch store data:", err);
      setError("Gagal memuat data toko");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStoreData();
  }, [fetchStoreData]);

  const isStoreOpen = hours?.is_currently_open ?? true;

  const value: StoreContextType = {
    storeInfo,
    currency,
    hours,
    isLoading,
    error,
    refetch: fetchStoreData,
    isStoreOpen,
  };

  return (
    <StoreContext.Provider value={value}>
      {children}
    </StoreContext.Provider>
  );
}

/**
 * Hook to access store settings.
 */
export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider");
  }
  return context;
}

/**
 * Hook for currency with dynamic conversion.
 * Uses currency store for display currency selection and exchange rates.
 * Base currency is IDR (prices in database).
 */
export function useCurrency() {
  const currencyStore = useCurrencyStore();
  
  // Fetch exchange rates if user selected non-IDR currency
  useEffect(() => {
    if (currencyStore.displayCurrency.code !== "IDR" && !currencyStore.exchangeRates && !currencyStore.isLoadingRates) {
      currencyStore.fetchExchangeRates();
    }
  }, [currencyStore]);
  
  const format = useCallback((amount: number, fromCurrency: string = "IDR") => {
    return currencyStore.formatPrice(amount, fromCurrency);
  }, [currencyStore]);
  
  const convert = useCallback((amount: number, fromCurrency: string = "IDR") => {
    return currencyStore.convertPrice(amount, fromCurrency);
  }, [currencyStore]);
  
  return { 
    currency: currencyStore.displayCurrency,
    displayCurrency: currencyStore.displayCurrency,
    availableCurrencies: currencyStore.availableCurrencies,
    setDisplayCurrency: currencyStore.setDisplayCurrency,
    exchangeRates: currencyStore.exchangeRates,
    isLoading: currencyStore.isLoadingRates,
    format,
    convert,
  };
}

/**
 * Hook for store hours and open status.
 */
export function useStoreHours() {
  const { hours, isStoreOpen } = useStore();
  
  const formatTime = useCallback((time: string) => {
    const [hour, minute] = time.split(":");
    const h = parseInt(hour);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minute} ${ampm}`;
  }, []);
  
  return {
    hours,
    isOpen: isStoreOpen,
    formatTime,
  };
}

export default useStore;
