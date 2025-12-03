"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, AlertCircle, Check } from "lucide-react";
import { StoreSettingsPanel, OperationalSettingsPanel, PaymentSettingsPanel, NotificationsPanel } from "@/components/admin";
import { settingsApi } from "@/lib/api/admin";

interface StoreSettings {
  store_name: string;
  store_address: string;
  store_phone: string;
  store_email: string;
  tax_rate: number;
  currency: string;
}

interface OperationalSettings {
  opening_time: string;
  closing_time: string;
  days_open: string[];
  order_types: string[];
}

interface PaymentSettings {
  payment_methods: string[];
  minimum_order: number;
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ORDER_TYPES = ["dine_in", "takeaway", "delivery"];

function useSettings() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    store_name: "", store_address: "", store_phone: "", store_email: "", tax_rate: 0, currency: "USD",
  });
  const [operationalSettings, setOperationalSettings] = useState<OperationalSettings>({
    opening_time: "08:00", closing_time: "22:00", days_open: DAYS_OF_WEEK, order_types: ORDER_TYPES,
  });
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    payment_methods: ["cash"], minimum_order: 0,
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
          store_address: allSettings.store.address || "",
          store_phone: allSettings.store.phone || "",
          store_email: allSettings.store.email || "",
          tax_rate: allSettings.payments?.tax_rate || 0,
          currency: "USD",
        });
      }
      if (allSettings.operations) {
        setOperationalSettings({
          opening_time: allSettings.operations.opening_hours || "08:00",
          closing_time: allSettings.operations.closing_hours || "22:00",
          days_open: DAYS_OF_WEEK,
          order_types: ORDER_TYPES,
        });
      }
      if (allSettings.payments) {
        const methods: string[] = [];
        if (allSettings.payments.cash_enabled) methods.push("cash");
        if (allSettings.payments.card_enabled) methods.push("credit_card");
        if (allSettings.payments.digital_enabled) methods.push("e_wallet");
        setPaymentSettings({
          payment_methods: methods.length > 0 ? methods : ["cash"],
          minimum_order: allSettings.operations?.minimum_order || 0,
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
        address: storeSettings.store_address,
        phone: storeSettings.store_phone,
        email: storeSettings.store_email,
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
        cash_enabled: paymentSettings.payment_methods.includes("cash"),
        card_enabled: paymentSettings.payment_methods.includes("credit_card") || paymentSettings.payment_methods.includes("debit_card"),
        digital_enabled: paymentSettings.payment_methods.includes("e_wallet") || paymentSettings.payment_methods.includes("bank_transfer"),
        tax_rate: storeSettings.tax_rate,
      });
      showSuccess("Payment settings saved successfully!");
    } catch {
      setError("Failed to save payment settings");
    } finally {
      setIsSaving(null);
    }
  };

  return {
    storeSettings, setStoreSettings,
    operationalSettings, setOperationalSettings,
    paymentSettings, setPaymentSettings,
    isLoading, isSaving, error, success,
    saveStoreSettings, saveOperationalSettings, savePaymentSettings,
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
        <NotificationsPanel />
      </div>
    </div>
  );
}
