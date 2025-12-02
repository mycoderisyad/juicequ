"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Settings, 
  Store,
  Clock,
  CreditCard,
  Bell,
  Save,
  Loader2,
  AlertCircle,
  Check
} from "lucide-react";
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
const PAYMENT_METHODS = ["cash", "credit_card", "debit_card", "e_wallet", "bank_transfer"];
const ORDER_TYPES = ["dine_in", "takeaway", "delivery"];

export default function AdminSettingsPage() {
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    store_name: "",
    store_address: "",
    store_phone: "",
    store_email: "",
    tax_rate: 0,
    currency: "USD",
  });
  const [operationalSettings, setOperationalSettings] = useState<OperationalSettings>({
    opening_time: "08:00",
    closing_time: "22:00",
    days_open: DAYS_OF_WEEK,
    order_types: ORDER_TYPES,
  });
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    payment_methods: ["cash"],
    minimum_order: 0,
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
    } catch (err) {
      console.error("Failed to fetch settings:", err);
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
    } catch (err) {
      console.error("Failed to save store settings:", err);
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
    } catch (err) {
      console.error("Failed to save operational settings:", err);
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
    } catch (err) {
      console.error("Failed to save payment settings:", err);
      setError("Failed to save payment settings");
    } finally {
      setIsSaving(null);
    }
  };

  const toggleDay = (day: string) => {
    setOperationalSettings(prev => ({
      ...prev,
      days_open: prev.days_open.includes(day)
        ? prev.days_open.filter(d => d !== day)
        : [...prev.days_open, day],
    }));
  };

  const toggleOrderType = (type: string) => {
    setOperationalSettings(prev => ({
      ...prev,
      order_types: prev.order_types.includes(type)
        ? prev.order_types.filter(t => t !== type)
        : [...prev.order_types, type],
    }));
  };

  const togglePaymentMethod = (method: string) => {
    setPaymentSettings(prev => ({
      ...prev,
      payment_methods: prev.payment_methods.includes(method)
        ? prev.payment_methods.filter(m => m !== method)
        : [...prev.payment_methods, method],
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500">Manage your store configuration</p>
      </div>

      {/* Notifications */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-red-600">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="mb-6 flex items-center gap-2 rounded-lg bg-green-50 p-4 text-green-600">
          <Check className="h-5 w-5" />
          {success}
        </div>
      )}

      <div className="space-y-6">
        {/* Store Information */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Store className="h-5 w-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Store Information</h2>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Store Name
              </label>
              <input
                type="text"
                value={storeSettings.store_name}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, store_name: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="JuiceQu"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={storeSettings.store_email}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, store_email: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="contact@juicequ.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                value={storeSettings.store_phone}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, store_phone: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="+1 234 567 890"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                value={storeSettings.currency}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="IDR">IDR (Rp)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                value={storeSettings.store_address}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, store_address: e.target.value }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="123 Juice Street, Fresh City"
                rows={2}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Tax Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={storeSettings.tax_rate}
                onChange={(e) => setStoreSettings(prev => ({ ...prev, tax_rate: parseFloat(e.target.value) || 0 }))}
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="10"
              />
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveStoreSettings}
              disabled={isSaving === "store"}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving === "store" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Store Settings
            </button>
          </div>
        </div>

        {/* Operational Hours */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Operational Hours</h2>
          </div>
          
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Opening Time
                </label>
                <input
                  type="time"
                  value={operationalSettings.opening_time}
                  onChange={(e) => setOperationalSettings(prev => ({ ...prev, opening_time: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Closing Time
                </label>
                <input
                  type="time"
                  value={operationalSettings.closing_time}
                  onChange={(e) => setOperationalSettings(prev => ({ ...prev, closing_time: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Days Open
              </label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day}
                    onClick={() => toggleDay(day)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                      operationalSettings.days_open.includes(day)
                        ? "bg-green-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {day.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Order Types
              </label>
              <div className="flex flex-wrap gap-2">
                {ORDER_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => toggleOrderType(type)}
                    className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      operationalSettings.order_types.includes(type)
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {type.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={saveOperationalSettings}
              disabled={isSaving === "operational"}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving === "operational" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Operational Settings
            </button>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Accepted Payment Methods
              </label>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    onClick={() => togglePaymentMethod(method)}
                    className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      paymentSettings.payment_methods.includes(method)
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {method.replace(/_/g, " ")}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="max-w-xs">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Minimum Order Amount
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={paymentSettings.minimum_order}
                  onChange={(e) => setPaymentSettings(prev => ({ ...prev, minimum_order: parseFloat(e.target.value) || 0 }))}
                  className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end">
            <button
              onClick={savePaymentSettings}
              disabled={isSaving === "payment"}
              className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving === "payment" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Payment Settings
            </button>
          </div>
        </div>

        {/* Notifications (Static) */}
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2">
            <Bell className="h-5 w-5 text-orange-600" />
            <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
          </div>
          
          <div className="space-y-4">
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Email notifications for new orders</span>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded text-green-600 focus:ring-green-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Push notifications for low stock</span>
              <input
                type="checkbox"
                defaultChecked
                className="h-5 w-5 rounded text-green-600 focus:ring-green-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-gray-700">Daily sales summary email</span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded text-green-600 focus:ring-green-500"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
