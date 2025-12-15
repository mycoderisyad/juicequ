"use client";

import { Ticket, Check, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AppliedVoucher } from "../hooks/use-voucher";

interface VoucherInputProps {
  voucherCode: string;
  onCodeChange: (code: string) => void;
  onApply: () => void;
  onRemove: () => void;
  isLoading: boolean;
  error: string | null;
  appliedVoucher: AppliedVoucher | null;
  formatCurrency: (value: number) => string;
  label?: string;
  showLabel?: boolean;
}

export function VoucherInput({
  voucherCode,
  onCodeChange,
  onApply,
  onRemove,
  isLoading,
  error,
  appliedVoucher,
  formatCurrency,
  label = "Have a Voucher?",
  showLabel = true,
}: VoucherInputProps) {
  if (appliedVoucher) {
    return (
      <div className="space-y-3">
        {showLabel && (
          <div className="flex items-center gap-2 text-gray-700">
            <Ticket className="h-4 w-4" />
            <span className="text-sm font-medium">{label}</span>
          </div>
        )}
        <div className="flex items-center justify-between rounded-xl bg-green-50 px-4 py-3">
          <div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-600" />
              <span className="font-semibold text-green-700">
                {appliedVoucher.code}
              </span>
            </div>
            <span className="text-sm text-green-600">
              {appliedVoucher.discount_type === "percentage"
                ? `Discount ${appliedVoucher.discount_value}%`
                : `Discount ${formatCurrency(appliedVoucher.discount_value)}`}
            </span>
          </div>
          <button
            onClick={onRemove}
            className="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-red-500"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showLabel && (
        <div className="flex items-center gap-2 text-gray-700">
          <Ticket className="h-4 w-4" />
          <span className="text-sm font-medium">{label}</span>
        </div>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          value={voucherCode}
          onChange={(e) => onCodeChange(e.target.value)}
          placeholder="Enter voucher code"
          className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
        />
        <Button
          onClick={onApply}
          disabled={isLoading || !voucherCode.trim()}
          className="rounded-xl bg-green-600 px-4 hover:bg-green-700 disabled:bg-gray-300"
        >
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Apply"}
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
