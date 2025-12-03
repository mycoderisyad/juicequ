"use client";

import { Store, Clock, CreditCard, Bell, Save, Loader2 } from "lucide-react";

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

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Store className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-900">Store Information</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <InputField label="Store Name" value={settings.store_name} onChange={(v) => update("store_name", v)} placeholder="JuiceQu" />
        <InputField label="Email" type="email" value={settings.store_email} onChange={(v) => update("store_email", v)} placeholder="contact@juicequ.com" />
        <InputField label="Phone" type="tel" value={settings.store_phone} onChange={(v) => update("store_phone", v)} placeholder="+1 234 567 890" />
        <SelectField
          label="Currency"
          value={settings.currency}
          onChange={(v) => update("currency", v)}
          options={[
            { value: "USD", label: "USD ($)" },
            { value: "EUR", label: "EUR (€)" },
            { value: "IDR", label: "IDR (Rp)" },
            { value: "GBP", label: "GBP (£)" },
          ]}
        />
        <div className="sm:col-span-2">
          <TextAreaField label="Address" value={settings.store_address} onChange={(v) => update("store_address", v)} placeholder="123 Juice Street, Fresh City" />
        </div>
        <NumberField label="Tax Rate (%)" value={settings.tax_rate} onChange={(v) => update("tax_rate", v)} step={0.1} placeholder="10" />
      </div>

      <div className="mt-6 flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Save Store Settings" />
      </div>
    </div>
  );
}

interface OperationalSettingsPanelProps {
  settings: OperationalSettings;
  onChange: (settings: OperationalSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function OperationalSettingsPanel({ settings, onChange, onSave, isSaving }: OperationalSettingsPanelProps) {
  const toggleDay = (day: string) => {
    const days = settings.days_open.includes(day)
      ? settings.days_open.filter((d) => d !== day)
      : [...settings.days_open, day];
    onChange({ ...settings, days_open: days });
  };

  const toggleOrderType = (type: string) => {
    const types = settings.order_types.includes(type)
      ? settings.order_types.filter((t) => t !== type)
      : [...settings.order_types, type];
    onChange({ ...settings, order_types: types });
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Clock className="h-5 w-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Operational Hours</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <TimeField label="Opening Time" value={settings.opening_time} onChange={(v) => onChange({ ...settings, opening_time: v })} />
          <TimeField label="Closing Time" value={settings.closing_time} onChange={(v) => onChange({ ...settings, closing_time: v })} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Days Open</label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <ToggleButton key={day} label={day.slice(0, 3)} isActive={settings.days_open.includes(day)} onClick={() => toggleDay(day)} />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Order Types</label>
          <div className="flex flex-wrap gap-2">
            {ORDER_TYPES.map((type) => (
              <ToggleButton key={type} label={type.replace(/_/g, " ")} isActive={settings.order_types.includes(type)} onClick={() => toggleOrderType(type)} activeColor="bg-blue-600" />
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Save Operational Settings" />
      </div>
    </div>
  );
}

interface PaymentSettingsPanelProps {
  settings: PaymentSettings;
  onChange: (settings: PaymentSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PaymentSettingsPanel({ settings, onChange, onSave, isSaving }: PaymentSettingsPanelProps) {
  const toggleMethod = (method: string) => {
    const methods = settings.payment_methods.includes(method)
      ? settings.payment_methods.filter((m) => m !== method)
      : [...settings.payment_methods, method];
    onChange({ ...settings, payment_methods: methods });
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <CreditCard className="h-5 w-5 text-purple-600" />
        <h2 className="text-lg font-semibold text-gray-900">Payment Settings</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Accepted Payment Methods</label>
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((method) => (
              <ToggleButton key={method} label={method.replace(/_/g, " ")} isActive={settings.payment_methods.includes(method)} onClick={() => toggleMethod(method)} activeColor="bg-purple-600" />
            ))}
          </div>
        </div>

        <div className="max-w-xs">
          <label className="mb-1 block text-sm font-medium text-gray-700">Minimum Order Amount</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              step="0.01"
              value={settings.minimum_order}
              onChange={(e) => onChange({ ...settings, minimum_order: parseFloat(e.target.value) || 0 })}
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-4 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Save Payment Settings" />
      </div>
    </div>
  );
}

export function NotificationsPanel() {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-2">
        <Bell className="h-5 w-5 text-orange-600" />
        <h2 className="text-lg font-semibold text-gray-900">Notifications</h2>
      </div>

      <div className="space-y-4">
        <CheckboxField label="Email notifications for new orders" defaultChecked />
        <CheckboxField label="Push notifications for low stock" defaultChecked />
        <CheckboxField label="Daily sales summary email" />
      </div>
    </div>
  );
}

function InputField({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string }) {
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

function NumberField({ label, value, onChange, step, placeholder }: { label: string; value: number; onChange: (v: number) => void; step?: number; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        placeholder={placeholder}
        rows={2}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500">
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2 text-gray-900 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500" />
    </div>
  );
}

function CheckboxField({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <input type="checkbox" defaultChecked={defaultChecked} className="h-5 w-5 rounded text-green-600 focus:ring-green-500" />
    </label>
  );
}
