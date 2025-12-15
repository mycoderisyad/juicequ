"use client";

import { useState } from "react";
import { vouchersApi } from "@/lib/api/customer";
import { getApiErrorMessage } from "@/lib/utils/error-handler";
import { CART_MESSAGES } from "@/lib/constants/messages";

export interface AppliedVoucher {
  id: string;
  code: string;
  discount_type: "percentage" | "fixed_amount";
  discount_value: number;
  discount_amount: number;
}

interface UseVoucherReturn {
  voucherCode: string;
  setVoucherCode: (code: string) => void;
  isLoading: boolean;
  error: string | null;
  appliedVoucher: AppliedVoucher | null;
  applyVoucher: (cartTotal: number) => Promise<void>;
  removeVoucher: () => void;
  clearError: () => void;
}

export function useVoucher(): UseVoucherReturn {
  const [voucherCode, setVoucherCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [appliedVoucher, setAppliedVoucher] = useState<AppliedVoucher | null>(null);

  const applyVoucher = async (cartTotal: number) => {
    if (!voucherCode.trim()) {
      setError(CART_MESSAGES.VOUCHER_REQUIRED);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await vouchersApi.validate(voucherCode.trim(), cartTotal);

      if (result.valid && result.voucher) {
        setAppliedVoucher({
          ...result.voucher,
          discount_amount: result.discount_amount,
        });
        setVoucherCode("");
      } else {
        setError(result.message || CART_MESSAGES.VOUCHER_INVALID);
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, CART_MESSAGES.VOUCHER_VALIDATE_FAILED));
    } finally {
      setIsLoading(false);
    }
  };

  const removeVoucher = () => {
    setAppliedVoucher(null);
    setError(null);
  };

  const clearError = () => setError(null);

  const handleSetVoucherCode = (code: string) => {
    setVoucherCode(code.toUpperCase());
    setError(null);
  };

  return {
    voucherCode,
    setVoucherCode: handleSetVoucherCode,
    isLoading,
    error,
    appliedVoucher,
    applyVoucher,
    removeVoucher,
    clearError,
  };
}
