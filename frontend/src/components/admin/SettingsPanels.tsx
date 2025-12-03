"use client";

import { Store, Clock, CreditCard, Bell, Save, Loader2, MapPin, Globe } from "lucide-react";

// ============== Types ==============

interface StoreSettings {
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
  store_postal_code: string;
  currency_code: string;
  currency_symbol: string;
  currency_locale: string;
  tax_rate: number;
}

interface OperationalSettings {
  opening_time: string;
  closing_time: string;
  days_open: string[];
  order_types: string[];
  is_store_open: boolean;
  accept_orders: boolean;
  delivery_available: boolean;
  minimum_order: number;
}

interface PaymentSettings {
  cash_enabled: boolean;
  card_enabled: boolean;
  digital_enabled: boolean;
  bank_transfer_enabled: boolean;
  tax_rate: number;
  service_charge: number;
}

interface SocialSettings {
  social_instagram: string;
  social_facebook: string;
  social_twitter: string;
  social_whatsapp: string;
}

// ============== Constants ==============

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const ORDER_TYPES = ["dine_in", "takeaway", "delivery"];
const CURRENCIES = [
  { code: "IDR", symbol: "Rp", locale: "id-ID", label: "IDR (Rp)" },
  { code: "USD", symbol: "$", locale: "en-US", label: "USD ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "EUR (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "GBP (£)" },
  { code: "SGD", symbol: "S$", locale: "en-SG", label: "SGD (S$)" },
  { code: "MYR", symbol: "RM", locale: "ms-MY", label: "MYR (RM)" },
];

// ============== Shared Components ==============

interface SaveButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label: string;
}

function SaveButton({ onClick, isLoading, label }: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-white hover:bg-green-700 disabled:opacity-50"
    >
      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      {label}
    </button>
  );
}

interface ToggleButtonProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
  activeColor?: string;
}

function ToggleButton({ label, isActive, onClick, activeColor = "bg-green-600" }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
        isActive ? `${activeColor} text-white` : "bg-gray-100 text-gray-700 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  type?: string; 
  placeholder?: string 
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        placeholder={placeholder}
      />
    </div>
  );
}

function NumberField({ label, value, onChange, step, placeholder, min, max }: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void; 
  step?: number; 
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder, rows = 2 }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string }[] 
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input 
        type="time" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" 
      />
    </div>
  );
}

function SwitchField({ label, checked, onChange, description }: { 
  label: string; 
  checked: boolean; 
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="font-medium text-gray-900">{label}</span>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-green-600" : "bg-gray-300"}`}
        role="switch"
        aria-checked={checked}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ============== Store Settings Panel ==============

interface StoreSettingsPanelProps {
  settings: StoreSettings;
  onChange: (settings: StoreSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function StoreSettingsPanel({ settings, onChange, onSave, isSaving }: StoreSettingsPanelProps) {
  const update = <K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  const handleCurrencyChange = (code: string) => {
    const currency = CURRENCIES.find(c => c.code === code);
    if (currency) {
      onChange({
        ...settings,
        currency_code: currency.code,
        currency_symbol: currency.symbol,
        currency_locale: currency.locale,
      });
    }
  };

  const getMapPreviewUrl = () => {
    if (!settings.store_latitude || !settings.store_longitude) return "";
    const bbox = `${settings.store_longitude - 0.005},${settings.store_latitude - 0.005},${settings.store_longitude + 0.005},${settings.store_latitude + 0.005}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${settings.store_latitude},${settings.store_longitude}`;
  };

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Store className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-semibold text-gray-900">Informasi Toko</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField 
            label="Nama Toko" 
            value={settings.store_name || ""} 
            onChange={(v) => update("store_name", v)} 
            placeholder="JuiceQu" 
          />
          <InputField 
            label="Tagline" 
            value={settings.store_tagline || ""} 
            onChange={(v) => update("store_tagline", v)} 
            placeholder="Fresh & Healthy Juices" 
          />
          <InputField 
            label="Email" 
            type="email" 
            value={settings.store_email || ""} 
            onChange={(v) => update("store_email", v)} 
            placeholder="hello@juicequ.com" 
          />
          <InputField 
            label="Telepon" 
            type="tel" 
            value={settings.store_phone || ""} 
            onChange={(v) => update("store_phone", v)} 
            placeholder="+62 21 1234 5678" 
          />
          <div className="sm:col-span-2">
            <TextAreaField 
              label="Deskripsi" 
              value={settings.store_description || ""} 
              onChange={(v) => update("store_description", v)} 
              placeholder="Deskripsi toko Anda..." 
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Location */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-red-600" />
          <h2 className="text-lg font-semibold text-gray-900">Lokasi</h2>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <TextAreaField 
              label="Alamat Lengkap" 
              value={settings.store_address || ""} 
              onChange={(v) => update("store_address", v)} 
              placeholder="Jl. Sudirman No. 123" 
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField 
                label="Kota" 
                value={settings.store_city || ""} 
                onChange={(v) => update("store_city", v)} 
                placeholder="Jakarta" 
              />
              <InputField 
                label="Provinsi" 
                value={settings.store_province || ""} 
                onChange={(v) => update("store_province", v)} 
                placeholder="DKI Jakarta" 
              />
            </div>
            <InputField 
              label="Kode Pos" 
              value={settings.store_postal_code || ""} 
              onChange={(v) => update("store_postal_code", v)} 
              placeholder="10220" 
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField 
                label="Latitude" 
                value={settings.store_latitude || 0} 
                onChange={(v) => update("store_latitude", v)} 
                step={0.0001}
                placeholder="-6.2088" 
              />
              <NumberField 
                label="Longitude" 
                value={settings.store_longitude || 0} 
                onChange={(v) => update("store_longitude", v)} 
                step={0.0001}
                placeholder="106.8456" 
              />
            </div>
            <p className="text-xs text-gray-500">
              Tip: Dapatkan koordinat dari Google Maps dengan klik kanan pada lokasi.
            </p>
          </div>

          {/* Map Preview */}
          <div className="rounded-xl overflow-hidden border border-gray-200">
            {settings.store_latitude && settings.store_longitude ? (
              <iframe
                src={getMapPreviewUrl()}
                width="100%"
                height="300"
                style={{ border: 0 }}
                loading="lazy"
                title="Map Preview"
                className="w-full"
              />
            ) : (
              <div className="flex h-[300px] items-center justify-center bg-gray-50 text-gray-500">
                <div className="text-center">
                  <MapPin className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-2">Masukkan koordinat untuk preview peta</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Currency */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">Mata Uang & Regional</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <SelectField
            label="Mata Uang"
            value={settings.currency_code || "IDR"}
            onChange={handleCurrencyChange}
            options={CURRENCIES.map(c => ({ value: c.code, label: c.label }))}
          />
          <InputField 
            label="Simbol" 
            value={settings.currency_symbol || "Rp"} 
            onChange={(v) => update("currency_symbol", v)} 
            placeholder="Rp" 
          />
          <InputField 
            label="Locale" 
            value={settings.currency_locale || "id-ID"} 
            onChange={(v) => update("currency_locale", v)} 
            placeholder="id-ID" 
          />
        </div>

        <div className="mt-4 p-4 bg-gray-50 rounded-xl">
          <p className="text-sm text-gray-600">
            Preview: <span className="font-semibold">
              {new Intl.NumberFormat(settings.currency_locale || "id-ID", {
                style: "currency",
                currency: settings.currency_code || "IDR",
              }).format(150000)}
            </span>
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Simpan Informasi Toko" />
      </div>
    </div>
  );
}

// ============== Operational Settings Panel ==============

interface OperationalSettingsPanelProps {
  settings: OperationalSettings;
  onChange: (settings: OperationalSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function OperationalSettingsPanel({ settings, onChange, onSave, isSaving }: OperationalSettingsPanelProps) {
  const toggleDay = (day: string) => {
    const days = settings.days_open?.includes(day)
      ? settings.days_open.filter((d) => d !== day)
      : [...(settings.days_open || []), day];
    onChange({ ...settings, days_open: days });
  };

  const toggleOrderType = (type: string) => {
    const types = settings.order_types?.includes(type)
      ? settings.order_types.filter((t) => t !== type)
      : [...(settings.order_types || []), type];
    onChange({ ...settings, order_types: types });
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Clock className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Jam Operasional</h2>
      </div>

      <div className="space-y-6">
        {/* Quick Toggles */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 bg-gray-50 rounded-xl">
            <SwitchField
              label="Toko Buka"
              checked={settings.is_store_open ?? true}
              onChange={(v) => onChange({ ...settings, is_store_open: v })}
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <SwitchField
              label="Terima Order"
              checked={settings.accept_orders ?? true}
              onChange={(v) => onChange({ ...settings, accept_orders: v })}
            />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <SwitchField
              label="Delivery"
              checked={settings.delivery_available ?? false}
              onChange={(v) => onChange({ ...settings, delivery_available: v })}
            />
          </div>
        </div>

        {/* Hours */}
        <div className="grid gap-4 sm:grid-cols-2">
          <TimeField 
            label="Jam Buka" 
            value={settings.opening_time || "08:00"} 
            onChange={(v) => onChange({ ...settings, opening_time: v })} 
          />
          <TimeField 
            label="Jam Tutup" 
            value={settings.closing_time || "22:00"} 
            onChange={(v) => onChange({ ...settings, closing_time: v })} 
          />
        </div>

        {/* Days */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Hari Buka</label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <ToggleButton 
                key={day} 
                label={day.slice(0, 3)} 
                isActive={settings.days_open?.includes(day) ?? true} 
                onClick={() => toggleDay(day)} 
              />
            ))}
          </div>
        </div>

        {/* Order Types */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Tipe Order</label>
          <div className="flex flex-wrap gap-2">
            {ORDER_TYPES.map((type) => (
              <ToggleButton 
                key={type} 
                label={type.replace(/_/g, " ")} 
                isActive={settings.order_types?.includes(type) ?? true} 
                onClick={() => toggleOrderType(type)} 
                activeColor="bg-blue-600" 
              />
            ))}
          </div>
        </div>

        {/* Minimum Order */}
        <div className="max-w-xs">
          <NumberField
            label="Minimum Order (Rp)"
            value={settings.minimum_order || 0}
            onChange={(v) => onChange({ ...settings, minimum_order: v })}
            min={0}
            step={1000}
            placeholder="25000"
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Simpan Jam Operasional" />
      </div>
    </div>
  );
}

// ============== Payment Settings Panel ==============

interface PaymentSettingsPanelProps {
  settings: PaymentSettings;
  onChange: (settings: PaymentSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PaymentSettingsPanel({ settings, onChange, onSave, isSaving }: PaymentSettingsPanelProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-900">Pembayaran</h2>
      </div>

      <div className="space-y-6">
        {/* Payment Methods */}
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700">Metode Pembayaran Diterima</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 bg-gray-50 rounded-xl">
              <SwitchField
                label="Tunai"
                checked={settings.cash_enabled ?? true}
                onChange={(v) => onChange({ ...settings, cash_enabled: v })}
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <SwitchField
                label="Kartu (Debit/Kredit)"
                checked={settings.card_enabled ?? true}
                onChange={(v) => onChange({ ...settings, card_enabled: v })}
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <SwitchField
                label="E-Wallet"
                checked={settings.digital_enabled ?? true}
                onChange={(v) => onChange({ ...settings, digital_enabled: v })}
                description="GoPay, OVO, Dana, dll"
              />
            </div>
            <div className="p-4 bg-gray-50 rounded-xl">
              <SwitchField
                label="Transfer Bank"
                checked={settings.bank_transfer_enabled ?? true}
                onChange={(v) => onChange({ ...settings, bank_transfer_enabled: v })}
              />
            </div>
          </div>
        </div>

        {/* Tax & Charges */}
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField
            label="Pajak/PPN (%)"
            value={settings.tax_rate || 0}
            onChange={(v) => onChange({ ...settings, tax_rate: v })}
            min={0}
            max={100}
            step={0.5}
            placeholder="11"
          />
          <NumberField
            label="Service Charge (%)"
            value={settings.service_charge || 0}
            onChange={(v) => onChange({ ...settings, service_charge: v })}
            min={0}
            max={100}
            step={0.5}
            placeholder="0"
          />
        </div>

        <div className="p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-700">
            Contoh: Jika subtotal Rp 100.000, dengan pajak {settings.tax_rate || 0}% dan service charge {settings.service_charge || 0}%, 
            total menjadi <span className="font-semibold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(
                100000 * (1 + ((settings.tax_rate || 0) + (settings.service_charge || 0)) / 100)
              )}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Simpan Pembayaran" />
      </div>
    </div>
  );
}

// ============== Social Settings Panel ==============

interface SocialSettingsPanelProps {
  settings: SocialSettings;
  onChange: (settings: SocialSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function SocialSettingsPanel({ settings, onChange, onSave, isSaving }: SocialSettingsPanelProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Globe className="h-5 w-5 text-pink-600" />
        <h2 className="text-lg font-semibold text-gray-900">Media Sosial</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField
          label="Instagram"
          value={settings.social_instagram || ""}
          onChange={(v) => onChange({ ...settings, social_instagram: v })}
          placeholder="https://instagram.com/juicequ"
        />
        <InputField
          label="Facebook"
          value={settings.social_facebook || ""}
          onChange={(v) => onChange({ ...settings, social_facebook: v })}
          placeholder="https://facebook.com/juicequ"
        />
        <InputField
          label="Twitter/X"
          value={settings.social_twitter || ""}
          onChange={(v) => onChange({ ...settings, social_twitter: v })}
          placeholder="https://twitter.com/juicequ"
        />
        <InputField
          label="WhatsApp"
          value={settings.social_whatsapp || ""}
          onChange={(v) => onChange({ ...settings, social_whatsapp: v })}
          placeholder="+6281234567890"
        />
      </div>

      <div className="mt-6 flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Simpan Media Sosial" />
      </div>
    </div>
  );
}

// ============== Notifications Panel ==============

export function NotificationsPanel() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Bell className="h-5 w-5 text-orange-600" />
        <h2 className="text-lg font-semibold text-gray-900">Notifikasi</h2>
      </div>

      <div className="space-y-4">
        <div className="p-4 bg-gray-50 rounded-xl">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Order Baru</span>
              <p className="text-sm text-gray-500">Notifikasi saat ada order masuk</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded text-green-600 focus:ring-green-500" />
          </label>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Stok Menipis</span>
              <p className="text-sm text-gray-500">Notifikasi saat stok produk rendah</p>
            </div>
            <input type="checkbox" defaultChecked className="h-5 w-5 rounded text-green-600 focus:ring-green-500" />
          </label>
        </div>
        <div className="p-4 bg-gray-50 rounded-xl">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium text-gray-900">Review Baru</span>
              <p className="text-sm text-gray-500">Notifikasi saat ada review baru</p>
            </div>
            <input type="checkbox" className="h-5 w-5 rounded text-green-600 focus:ring-green-500" />
          </label>
        </div>
      </div>
    </div>
  );
}

// Export types
export type { StoreSettings, OperationalSettings, PaymentSettings, SocialSettings };
