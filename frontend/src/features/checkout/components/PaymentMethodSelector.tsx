"use client";

import { Banknote, Smartphone, CreditCard } from "lucide-react";

export type PaymentMethod = "cash" | "qris" | "transfer" | "card";

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onSelect: (method: PaymentMethod) => void;
  enabledMethods: PaymentMethod[];
}

const PAYMENT_BUTTONS: Array<{
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
}> = [
  { id: "cash", label: "Cash", icon: <Banknote className="h-6 w-6 text-green-600" /> },
  { id: "qris", label: "QRIS", icon: <Smartphone className="h-6 w-6 text-blue-600" /> },
  { id: "transfer", label: "Transfer", icon: <CreditCard className="h-6 w-6 text-purple-600" /> },
];

export function PaymentMethodSelector({
  selected,
  onSelect,
  enabledMethods,
}: PaymentMethodSelectorProps) {
  const isEnabled = (method: PaymentMethod) => enabledMethods.includes(method);

  return (
    <div className="rounded-3xl bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-900">Payment Method</h2>
      <div className="grid gap-4 sm:grid-cols-3">
        {PAYMENT_BUTTONS.map((btn) => {
          const enabled = isEnabled(btn.id);
          const active = selected === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => enabled && onSelect(btn.id)}
              disabled={!enabled}
              className={`flex items-center gap-3 rounded-2xl border-2 p-4 transition-colors ${
                active ? "border-green-600 bg-green-50" : "border-gray-200 hover:border-gray-300"
              } ${!enabled ? "opacity-60 cursor-not-allowed bg-gray-50 hover:border-gray-200" : ""}`}
            >
              {btn.icon}
              <span className="font-medium text-gray-900">{btn.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
