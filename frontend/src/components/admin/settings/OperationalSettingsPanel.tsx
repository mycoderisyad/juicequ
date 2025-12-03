"use client";

import { Clock } from "lucide-react";
import type { OperationalSettings } from "./types";
import { SaveButton, ToggleButton, TimeField, NumberField, SwitchField, DAYS_OF_WEEK, ORDER_TYPES } from "./shared";

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
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="p-4 bg-gray-50 rounded-xl">
            <SwitchField label="Toko Buka" checked={settings.is_store_open ?? true} onChange={(v) => onChange({ ...settings, is_store_open: v })} />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <SwitchField label="Terima Order" checked={settings.accept_orders ?? true} onChange={(v) => onChange({ ...settings, accept_orders: v })} />
          </div>
          <div className="p-4 bg-gray-50 rounded-xl">
            <SwitchField label="Delivery" checked={settings.delivery_available ?? false} onChange={(v) => onChange({ ...settings, delivery_available: v })} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TimeField label="Jam Buka" value={settings.opening_time || "08:00"} onChange={(v) => onChange({ ...settings, opening_time: v })} />
          <TimeField label="Jam Tutup" value={settings.closing_time || "22:00"} onChange={(v) => onChange({ ...settings, closing_time: v })} />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Hari Buka</label>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map((day) => (
              <ToggleButton key={day} label={day.slice(0, 3)} isActive={settings.days_open?.includes(day) ?? true} onClick={() => toggleDay(day)} />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">Tipe Order</label>
          <div className="flex flex-wrap gap-2">
            {ORDER_TYPES.map((type) => (
              <ToggleButton key={type} label={type.replace(/_/g, " ")} isActive={settings.order_types?.includes(type) ?? true} onClick={() => toggleOrderType(type)} activeColor="bg-blue-600" />
            ))}
          </div>
        </div>

        <div className="max-w-xs">
          <NumberField label="Minimum Order (Rp)" value={settings.minimum_order || 0} onChange={(v) => onChange({ ...settings, minimum_order: v })} min={0} step={1000} placeholder="25000" />
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <SaveButton onClick={onSave} isLoading={isSaving} label="Simpan Jam Operasional" />
      </div>
    </div>
  );
}
