/**
 * Currency Exchange API.
 * Fetch exchange rates and convert currencies.
 */
import apiClient from "./config";

// Types
export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  time_last_update_utc: string;
  is_fallback: boolean;
  is_cached: boolean;
}

export interface ConvertResult {
  original_amount: number;
  converted_amount: number;
  from_currency: string;
  to_currency: string;
  rate: number;
  is_fallback: boolean;
}

export interface SingleRate {
  from: string;
  to: string;
  rate: number;
  is_fallback: boolean;
}

export interface ApiKeyStatus {
  has_api_key: boolean;
  api_key_preview: string | null;
  has_cached_rates: boolean;
  last_update: string | null;
  base_currency: string;
}

// Currency API
export const currencyApi = {
  /**
   * Get exchange rates.
   */
  getRates: async (baseCurrency: string = "USD"): Promise<ExchangeRates> => {
    const response = await apiClient.get("/currency/rates", {
      params: { base: baseCurrency },
    });
    return response.data;
  },

  /**
   * Convert currency.
   */
  convert: async (
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<ConvertResult> => {
    const response = await apiClient.post("/currency/convert", {
      amount,
      from_currency: fromCurrency,
      to_currency: toCurrency,
    });
    return response.data;
  },

  /**
   * Get single exchange rate.
   */
  getRate: async (
    fromCurrency: string,
    toCurrency: string
  ): Promise<SingleRate> => {
    const response = await apiClient.get("/currency/rate", {
      params: {
        from: fromCurrency,
        to: toCurrency,
      },
    });
    return response.data;
  },

  /**
   * Refresh exchange rates (admin only).
   */
  refreshRates: async (): Promise<{
    message: string;
    base: string;
    rates_count: number;
    is_fallback: boolean;
    success: boolean;
  }> => {
    const response = await apiClient.post("/currency/refresh");
    return response.data;
  },

  /**
   * Get API key status (admin only).
   */
  getApiKeyStatus: async (): Promise<ApiKeyStatus> => {
    const response = await apiClient.get("/currency/api-key-status");
    return response.data;
  },

  /**
   * Update API key (admin only).
   */
  updateApiKey: async (
    apiKey: string
  ): Promise<{
    message: string;
    is_valid: boolean;
    success: boolean;
  }> => {
    const response = await apiClient.put("/currency/api-key", {
      exchangerate_api_key: apiKey,
    });
    return response.data;
  },
};

export default currencyApi;
