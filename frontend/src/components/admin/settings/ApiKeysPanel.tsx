"use client";

import { useState, useEffect } from "react";
import { Key, ExternalLink, Check, AlertCircle, Loader2, Save, RefreshCw } from "lucide-react";
import type { ApiKeysSettings, CurrencyInfo } from "./types";

interface ApiKeysPanelProps {
  settings: ApiKeysSettings;
  currencyInfo?: CurrencyInfo;
  onSaveApiKey: (apiKey: string) => Promise<{ success: boolean; is_valid: boolean }>;
  onRefreshRates: () => Promise<void>;
}

export function ApiKeysPanel({ settings, currencyInfo, onSaveApiKey, onRefreshRates }: ApiKeysPanelProps) {
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [saveResult, setSaveResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSave = async () => {
    if (!apiKey.trim()) return;
    
    setIsSaving(true);
    setSaveResult(null);
    
    try {
      const result = await onSaveApiKey(apiKey);
      setSaveResult({
        success: result.success && result.is_valid,
        message: result.is_valid 
          ? "API Key tersimpan dan terverifikasi!" 
          : "API Key tersimpan tapi verifikasi gagal. Periksa kembali key Anda."
      });
      if (result.success) setApiKey("");
    } catch {
      setSaveResult({ success: false, message: "Gagal menyimpan API Key" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshRates();
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (saveResult) {
      const timer = setTimeout(() => setSaveResult(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveResult]);

  return (
    <div className="rounded-[2.5rem] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-amber-100 p-2">
          <Key className="h-5 w-5 text-amber-600" />
        </div>
        <h2 className="font-serif text-lg font-semibold text-stone-900">API Keys & Exchange Rates</h2>
      </div>

      <div className="space-y-6">
        <div className="p-5 bg-stone-50 rounded-2xl">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-medium text-stone-900">ExchangeRate API</h3>
              <p className="text-sm text-stone-500">Untuk konversi mata uang real-time</p>
            </div>
            <a href="https://www.exchangerate-api.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 transition-colors">
              Dapatkan API Key <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="mb-4 p-4 rounded-xl bg-white border border-stone-200">
            <div className="flex items-center gap-2 mb-2">
              {settings.exchangerate_api_key_configured ? (
                <>
                  <div className="rounded-full bg-emerald-100 p-1">
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                  </div>
                  <span className="text-sm font-medium text-emerald-700">API Key Terkonfigurasi</span>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-amber-100 p-1">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                  </div>
                  <span className="text-sm font-medium text-amber-700">Belum Ada API Key</span>
                </>
              )}
            </div>
            {settings.exchangerate_api_key_preview && (
              <p className="text-xs text-stone-500">Key: {settings.exchangerate_api_key_preview}</p>
            )}
            {currencyInfo && (
              <div className="mt-2 text-xs text-stone-500 space-y-1">
                <p>Base Currency: <span className="font-medium text-stone-700">{currencyInfo.base_currency}</span></p>
                <p>Display: <span className="font-medium text-stone-700">{currencyInfo.display_currency_code}</span></p>
                {currencyInfo.exchange_rates_updated && (
                  <p>Last Update: <span className="font-medium text-stone-700">{new Date(currencyInfo.exchange_rates_updated).toLocaleString("id-ID")}</span></p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Masukkan API Key baru..."
                className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 pr-20 text-stone-900 placeholder:text-stone-400 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-stone-500 hover:text-stone-700 px-2 py-1 rounded-lg hover:bg-stone-100 transition-colors">
                {showKey ? "Hide" : "Show"}
              </button>
            </div>

            {saveResult && (
              <div className={`flex items-center gap-2 text-sm ${saveResult.success ? "text-emerald-600" : "text-red-600"}`}>
                {saveResult.success ? <Check className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {saveResult.message}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={isSaving || !apiKey.trim()} className="flex items-center gap-2 rounded-full bg-amber-600 px-5 py-2.5 text-white hover:bg-amber-700 disabled:opacity-50 transition-colors">
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan API Key
              </button>
              
              {settings.exchangerate_api_key_configured && (
                <button onClick={handleRefresh} disabled={isRefreshing} className="flex items-center gap-2 rounded-full border border-stone-200 bg-white px-5 py-2.5 text-stone-700 hover:bg-stone-50 disabled:opacity-50 transition-colors">
                  {isRefreshing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  Refresh Rates
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 p-4 bg-blue-50 rounded-xl">
            <p className="text-xs text-blue-700">
              <strong>Cara mendapatkan API Key:</strong><br/>
              1. Kunjungi <a href="https://www.exchangerate-api.com/" target="_blank" rel="noopener noreferrer" className="underline">exchangerate-api.com</a><br/>
              2. Daftar akun gratis (1,500 request/bulan)<br/>
              3. Copy API Key dari dashboard<br/>
              4. Paste di sini dan simpan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
