"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { 
  StoreSettingsPanel, 
  OperationalSettingsPanel, 
  PaymentSettingsPanel, 
  NotificationsPanel,
  ApiKeysPanel,
  type StoreSettings,
  type OperationalSettings,
  type PaymentSettings,
  type ApiKeysSettings,
  type CurrencyInfo,
} from "@/components/admin";
import { settingsApi } from "@/lib/api/admin";
import { currencyApi } from "@/lib/api/currency";

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ORDER_TYPES = ["dine_in", "takeaway", "delivery"];

function useSettings() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    store_name: "",
    store_tagline: "",
    store_description: "",
    store_address: "",
    store_phone: "",
    store_email: "",
    store_latitude: 0,
    store_longitude: 0,
    store_city: "",
    store_province: "",
    store_postal_code: "",
    currency_code: "IDR",
    currency_symbol: "Rp",
    currency_locale: "id-ID",
    tax_rate: 0,
  });
  
  const [operationalSettings, setOperationalSettings] = useState<OperationalSettings>({
    opening_time: "08:00",
    closing_time: "22:00",
    days_open: DAYS_OF_WEEK,
    order_types: ORDER_TYPES,
    is_store_open: true,
    accept_orders: true,
    delivery_available: false,
    minimum_order: 0,
  });
  
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    cash_enabled: true,
    card_enabled: true,
    digital_enabled: true,
    bank_transfer_enabled: false,
    tax_rate: 11,
    service_charge: 0,
  });
  
  const [apiKeysSettings, setApiKeysSettings] = useState<ApiKeysSettings>({
    exchangerate_api_key_configured: false,
    exchangerate_api_key_preview: "",
  });
  
  const [currencyInfo, setCurrencyInfo] = useState<CurrencyInfo>({
    base_currency: "USD",
    display_currency_code: "IDR",
    exchange_rates_updated: "",
    has_cached_rates: false,
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const allSettings = await settingsApi.getAll();

      if (allSettings.store) {
        setStoreSettings({
          store_name: allSettings.store.name || "",
          store_tagline: allSettings.store.tagline || "",
          store_description: allSettings.store.description || "",
          store_address: allSettings.store.address || "",
          store_phone: allSettings.store.phone || "",
          store_email: allSettings.store.email || "",
          store_latitude: allSettings.store.latitude || 0,
          store_longitude: allSettings.store.longitude || 0,
          store_city: allSettings.store.city || "",
          store_province: allSettings.store.province || "",
          store_postal_code: allSettings.store.postal_code || "",
          currency_code: allSettings.store.currency_code || "IDR",
          currency_symbol: allSettings.store.currency_symbol || "Rp",
          currency_locale: allSettings.store.currency_locale || "id-ID",
          tax_rate: allSettings.payments?.tax_rate || 0,
        });
      }
      
      if (allSettings.operations) {
        setOperationalSettings({
          opening_time: allSettings.operations.opening_hours || "08:00",
          closing_time: allSettings.operations.closing_hours || "22:00",
          days_open: allSettings.operations.days_open || DAYS_OF_WEEK,
          order_types: allSettings.operations.order_types || ORDER_TYPES,
          is_store_open: allSettings.operations.is_open ?? true,
          accept_orders: allSettings.operations.accept_orders ?? true,
          delivery_available: allSettings.operations.delivery_available ?? false,
          minimum_order: allSettings.operations.minimum_order || 0,
        });
      }
      
      if (allSettings.payments) {
        setPaymentSettings({
          cash_enabled: allSettings.payments.cash_enabled ?? true,
          card_enabled: allSettings.payments.card_enabled ?? true,
          digital_enabled: allSettings.payments.digital_enabled ?? true,
          bank_transfer_enabled: allSettings.payments.bank_transfer_enabled ?? false,
          tax_rate: allSettings.payments.tax_rate || 11,
          service_charge: allSettings.payments.service_charge || 0,
        });
      }
      
      // API Keys settings
      if (allSettings.api_keys) {
        setApiKeysSettings({
          exchangerate_api_key_configured: allSettings.api_keys.exchangerate_api_key_configured ?? false,
          exchangerate_api_key_preview: allSettings.api_keys.exchangerate_api_key_preview || "",
        });
      }
      
      // Currency info
      if (allSettings.currency) {
        setCurrencyInfo({
          base_currency: allSettings.currency.base_currency || "USD",
          display_currency_code: allSettings.currency.display_currency_code || "IDR",
          exchange_rates_updated: allSettings.currency.exchange_rates_updated || "",
          has_cached_rates: allSettings.currency.has_cached_rates ?? false,
        });
      }
    } catch {
      setError("Failed to load settings. Using defaults.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const showSuccess = (message: string) => {
    setSuccess(message);
    setTimeout(() => setSuccess(null), 3000);
  };

  const saveStoreSettings = async () => {
    try {
      setIsSaving("store");
      await settingsApi.updateStore({
        name: storeSettings.store_name,
        tagline: storeSettings.store_tagline,
        description: storeSettings.store_description,
        address: storeSettings.store_address,
        phone: storeSettings.store_phone,
        email: storeSettings.store_email,
        latitude: storeSettings.store_latitude,
        longitude: storeSettings.store_longitude,
        city: storeSettings.store_city,
        province: storeSettings.store_province,
        postal_code: storeSettings.store_postal_code,
        currency_code: storeSettings.currency_code,
        currency_symbol: storeSettings.currency_symbol,
        currency_locale: storeSettings.currency_locale,
      });
      showSuccess("Store settings saved successfully!");
    } catch {
      setError("Failed to save store settings");
    } finally {
      setIsSaving(null);
    }
  };

  const saveOperationalSettings = async () => {
    try {
      setIsSaving("operational");
      await settingsApi.updateOperations({
        opening_hours: operationalSettings.opening_time,
        closing_hours: operationalSettings.closing_time,
        days_open: operationalSettings.days_open,
        order_types: operationalSettings.order_types,
        is_open: operationalSettings.is_store_open,
        accept_orders: operationalSettings.accept_orders,
        delivery_available: operationalSettings.delivery_available,
        minimum_order: operationalSettings.minimum_order,
      });
      showSuccess("Operational settings saved successfully!");
    } catch {
      setError("Failed to save operational settings");
    } finally {
      setIsSaving(null);
    }
  };

  const savePaymentSettings = async () => {
    try {
      setIsSaving("payment");
      await settingsApi.updatePayments({
        cash_enabled: paymentSettings.cash_enabled,
        card_enabled: paymentSettings.card_enabled,
        digital_enabled: paymentSettings.digital_enabled,
        bank_transfer_enabled: paymentSettings.bank_transfer_enabled,
        tax_rate: paymentSettings.tax_rate,
        service_charge: paymentSettings.service_charge,
      });
      showSuccess("Payment settings saved successfully!");
    } catch {
      setError("Failed to save payment settings");
    } finally {
      setIsSaving(null);
    }
  };

  const saveApiKey = async (apiKey: string) => {
    const result = await currencyApi.updateApiKey(apiKey);
    // Refresh settings to update status
    await fetchSettings();
    return result;
  };

  const refreshRates = async () => {
    await currencyApi.refreshRates();
    // Refresh settings to update status
    await fetchSettings();
  };

  return {
    storeSettings, setStoreSettings,
    operationalSettings, setOperationalSettings,
    paymentSettings, setPaymentSettings,
    apiKeysSettings, currencyInfo,
    isLoading, isSaving, error, success,
    saveStoreSettings, saveOperationalSettings, savePaymentSettings,
    saveApiKey, refreshRates,
  };
}

export default function AdminSettingsPage() {
  const settings = useSettings();

  if (settings.isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your store configuration</p>
      </div>

      {settings.error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-600">
          <AlertCircle className="h-5 w-5" />
          {settings.error}
        </div>
      )}

      {settings.success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-600">
          <Check className="h-5 w-5" />
          {settings.success}
        </div>
      )}

      <div className="space-y-6">
        <StoreSettingsPanel
          settings={settings.storeSettings}
          onChange={settings.setStoreSettings}
          onSave={settings.saveStoreSettings}
          isSaving={settings.isSaving === "store"}
        />
        <OperationalSettingsPanel
          settings={settings.operationalSettings}
          onChange={settings.setOperationalSettings}
          onSave={settings.saveOperationalSettings}
          isSaving={settings.isSaving === "operational"}
        />
        <PaymentSettingsPanel
          settings={settings.paymentSettings}
          onChange={settings.setPaymentSettings}
          onSave={settings.savePaymentSettings}
          isSaving={settings.isSaving === "payment"}
        />
        <ApiKeysPanel
          settings={settings.apiKeysSettings}
          currencyInfo={settings.currencyInfo}
          onSaveApiKey={settings.saveApiKey}
          onRefreshRates={settings.refreshRates}
        />
        <NotificationsPanel />
      </div>
    </div>
  );
}
