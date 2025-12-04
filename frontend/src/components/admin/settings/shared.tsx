"use client";

import { Save, Loader2 } from "lucide-react";

export const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
export const ORDER_TYPES = ["dine_in", "takeaway", "delivery"];
export const CURRENCIES = [
  { code: "IDR", symbol: "Rp", locale: "id-ID", label: "IDR (Rp)" },
  { code: "USD", symbol: "$", locale: "en-US", label: "USD ($)" },
  { code: "EUR", symbol: "€", locale: "de-DE", label: "EUR (€)" },
  { code: "GBP", symbol: "£", locale: "en-GB", label: "GBP (£)" },
  { code: "SGD", symbol: "S$", locale: "en-SG", label: "SGD (S$)" },
  { code: "MYR", symbol: "RM", locale: "ms-MY", label: "MYR (RM)" },
];

interface SaveButtonProps {
  onClick: () => void;
  isLoading: boolean;
  label: string;
}

export function SaveButton({ onClick, isLoading, label }: SaveButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors"
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

export function ToggleButton({ label, isActive, onClick, activeColor = "bg-emerald-600" }: ToggleButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-colors ${
        isActive ? `${activeColor} text-white` : "bg-stone-100 text-stone-700 hover:bg-stone-200"
      }`}
    >
      {label}
    </button>
  );
}

export function InputField({ label, value, onChange, type = "text", placeholder }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  type?: string; 
  placeholder?: string 
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        placeholder={placeholder}
      />
    </div>
  );
}

export function NumberField({ label, value, onChange, step, placeholder, min, max }: { 
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
      <label className="mb-2 block text-sm font-medium text-stone-700">{label}</label>
      <input
        type="number"
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        placeholder={placeholder}
      />
    </div>
  );
}

export function TextAreaField({ label, value, onChange, placeholder, rows = 2 }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        placeholder={placeholder}
        rows={rows}
      />
    </div>
  );
}

export function SelectField({ label, value, onChange, options }: { 
  label: string; 
  value: string; 
  onChange: (v: string) => void; 
  options: { value: string; label: string }[] 
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">{label}</label>
      <select 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

export function TimeField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-stone-700">{label}</label>
      <input 
        type="time" 
        value={value} 
        onChange={(e) => onChange(e.target.value)} 
        className="w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-stone-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500" 
      />
    </div>
  );
}

export function SwitchField({ label, checked, onChange, description }: { 
  label: string; 
  checked: boolean; 
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <span className="font-medium text-stone-900">{label}</span>
        {description && <p className="text-sm text-stone-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 rounded-full transition-colors ${checked ? "bg-emerald-600" : "bg-stone-300"}`}
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
