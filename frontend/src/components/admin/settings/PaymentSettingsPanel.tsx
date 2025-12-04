"use client";

import { CreditCard } from "lucide-react";
import type { PaymentSettings } from "./types";
import { SaveButton, NumberField, SwitchField } from "./shared";

interface PaymentSettingsPanelProps {
  settings: PaymentSettings;
  onChange: (settings: PaymentSettings) => void;
  onSave: () => void;
  isSaving: boolean;
}

export function PaymentSettingsPanel({ settings, onChange, onSave, isSaving }: PaymentSettingsPanelProps) {
  return (
    <div className="rounded-[2.5rem] bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-xl bg-purple-100 p-2">
          <CreditCard className="h-5 w-5 text-purple-600" />
        </div>
        <h2 className="font-serif text-lg font-semibold text-stone-900">Pembayaran</h2>
      </div>

      <div className="space-y-6">
        <div>
          <label className="mb-3 block text-sm font-medium text-stone-700">Metode Pembayaran Diterima</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-4 bg-stone-50 rounded-2xl">
              <SwitchField label="Tunai" checked={settings.cash_enabled ?? true} onChange={(v) => onChange({ ...settings, cash_enabled: v })} />
            </div>
            <div className="p-4 bg-stone-50 rounded-2xl">
              <SwitchField label="Kartu (Debit/Kredit)" checked={settings.card_enabled ?? true} onChange={(v) => onChange({ ...settings, card_enabled: v })} />
            </div>
            <div className="p-4 bg-stone-50 rounded-2xl">
              <SwitchField label="E-Wallet" checked={settings.digital_enabled ?? true} onChange={(v) => onChange({ ...settings, digital_enabled: v })} description="GoPay, OVO, Dana, dll" />
            </div>
            <div className="p-4 bg-stone-50 rounded-2xl">
              <SwitchField label="Transfer Bank" checked={settings.bank_transfer_enabled ?? true} onChange={(v) => onChange({ ...settings, bank_transfer_enabled: v })} />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label="Pajak/PPN (%)" value={settings.tax_rate || 0} onChange={(v) => onChange({ ...settings, tax_rate: v })} min={0} max={100} step={0.5} placeholder="11" />
          <NumberField label="Service Charge (%)" value={settings.service_charge || 0} onChange={(v) => onChange({ ...settings, service_charge: v })} min={0} max={100} step={0.5} placeholder="0" />
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl">
          <p className="text-sm text-blue-700">
            Contoh: Jika subtotal Rp 100.000, dengan pajak {settings.tax_rate || 0}% dan service charge {settings.service_charge || 0}%, 
            total menjadi <span className="font-semibold">
              {new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR" }).format(100000 * (1 + ((settings.tax_rate || 0) + (settings.service_charge || 0)) / 100))}
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
