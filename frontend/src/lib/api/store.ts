/**
 * Store public API endpoints.
 * Get public store information (no auth required).
 */
import apiClient from "./config";

// Types
export interface StoreInfo {
  store_name: string;
  store_tagline: string;
  store_description: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_logo: string;
  store_latitude: number;
  store_longitude: number;
  store_city: string;
  store_province: string;
  store_postal_code: string;
  currency_code: string;
  currency_symbol: string;
  currency_locale: string;
  opening_time: string;
  closing_time: string;
  days_open: string[];
  is_store_open: boolean;
  accept_orders: boolean;
  delivery_available: boolean;
  minimum_order: number;
  social_instagram: string;
  social_facebook: string;
  social_twitter: string;
  social_whatsapp: string;
}

export interface StoreLocation {
  address: string;
  city: string;
  province: string;
  postal_code: string;
  latitude: number;
  longitude: number;
  full_address: string;
}

export interface StoreHours {
  opening_time: string;
  closing_time: string;
  days_open: string[];
  is_store_open: boolean;
  is_currently_open: boolean;
  accept_orders: boolean;
}

export interface CurrencyInfo {
  code: string;
  symbol: string;
  locale: string;
}

export interface SocialLinks {
  instagram: string;
  facebook: string;
  twitter: string;
  whatsapp: string;
}

export interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
}

export interface PaymentInfo {
  methods: PaymentMethod[];
  tax_rate: number;
  service_charge: number;
}

// Store API
export const storeApi = {
  /**
   * Get all public store information.
   */
  getInfo: async (): Promise<StoreInfo> => {
    const response = await apiClient.get("/customer/store");
    return response.data;
  },

  /**
   * Get store location for map.
   */
  getLocation: async (): Promise<StoreLocation> => {
    const response = await apiClient.get("/customer/store/location");
    return response.data;
  },

  /**
   * Get store operating hours.
   */
  getHours: async (): Promise<StoreHours> => {
    const response = await apiClient.get("/customer/store/hours");
    return response.data;
  },

  /**
   * Get currency settings.
   */
  getCurrency: async (): Promise<CurrencyInfo> => {
    const response = await apiClient.get("/customer/store/currency");
    return response.data;
  },

  /**
   * Get social media links.
   */
  getSocial: async (): Promise<SocialLinks> => {
    const response = await apiClient.get("/customer/store/social");
    return response.data;
  },

  /**
   * Get available payment methods.
   */
  getPaymentMethods: async (): Promise<PaymentInfo> => {
    const response = await apiClient.get("/customer/store/payment-methods");
    return response.data;
  },
};

export default storeApi;
