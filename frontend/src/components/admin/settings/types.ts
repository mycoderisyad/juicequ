export interface StoreSettings {
  store_name: string;
  store_tagline: string;
  store_description: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  store_latitude: number;
  store_longitude: number;
  store_city: string;
  store_province: string;
  store_district: string;
  store_village: string;
  store_postal_code: string;
  currency_code: string;
  currency_symbol: string;
  currency_locale: string;
  tax_rate: number;
}

export interface OperationalSettings {
  opening_time: string;
  closing_time: string;
  days_open: string[];
  order_types: string[];
  is_store_open: boolean;
  accept_orders: boolean;
  delivery_available: boolean;
  minimum_order: number;
}

export interface PaymentSettings {
  cash_enabled: boolean;
  card_enabled: boolean;
  digital_enabled: boolean;
  bank_transfer_enabled: boolean;
  tax_rate: number;
  service_charge: number;
}

export interface SocialSettings {
  social_instagram: string;
  social_facebook: string;
  social_twitter: string;
  social_whatsapp: string;
}

export interface ApiKeysSettings {
  exchangerate_api_key_configured: boolean;
  exchangerate_api_key_preview: string;
}

export interface CurrencyInfo {
  base_currency: string;
  display_currency_code: string;
  exchange_rates_updated: string;
  has_cached_rates: boolean;
}
