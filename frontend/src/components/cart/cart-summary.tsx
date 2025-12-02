/**
 * Cart summary component with totals and checkout button
 */
"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CartSummaryProps {
  subtotal: number;
  tax?: number;
  discount?: number;
  deliveryFee?: number;
  className?: string;
  onCheckout?: () => void;
  isCheckoutDisabled?: boolean;
  checkoutLabel?: string;
}

export function CartSummary({
  subtotal,
  tax,
  discount = 0,
  deliveryFee = 0,
  className,
  onCheckout,
  isCheckoutDisabled = false,
  checkoutLabel = "Proceed to Checkout",
}: CartSummaryProps) {
  const calculatedTax = tax ?? subtotal * 0.1; // Default 10% tax
  const total = subtotal + calculatedTax - discount + deliveryFee;

  return (
    <div
      className={cn(
        "rounded-3xl bg-white p-6 shadow-xl shadow-gray-200/50",
        className
      )}
    >
      <h2 className="text-xl font-bold text-gray-900">Order Summary</h2>

      <div className="mt-6 space-y-4 border-b border-gray-100 pb-6">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>${subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between text-gray-600">
          <span>Tax (10%)</span>
          <span>${calculatedTax.toFixed(2)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-${discount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Delivery Fee</span>
          {deliveryFee === 0 ? (
            <span className="text-green-600">Free</span>
          ) : (
            <span>${deliveryFee.toFixed(2)}</span>
          )}
        </div>
      </div>

      <div className="mt-6 flex justify-between text-lg font-bold text-gray-900">
        <span>Total</span>
        <span>${total.toFixed(2)}</span>
      </div>

      {onCheckout ? (
        <Button
          onClick={onCheckout}
          disabled={isCheckoutDisabled}
          className="mt-8 w-full rounded-full bg-green-600 py-6 text-lg hover:bg-green-700"
        >
          {checkoutLabel}
          <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
        </Button>
      ) : (
        <Link href="/checkout" className="block mt-8">
          <Button
            disabled={isCheckoutDisabled}
            className="w-full rounded-full bg-green-600 py-6 text-lg hover:bg-green-700"
          >
            {checkoutLabel}
            <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
          </Button>
        </Link>
      )}

      <p className="mt-4 text-center text-xs text-gray-400">
        🔒 Secure checkout powered by SSL encryption
      </p>
    </div>
  );
}

// Empty cart component
interface EmptyCartProps {
  className?: string;
}

export function EmptyCart({ className }: EmptyCartProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-3xl bg-white p-12 text-center shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 text-gray-400">
        <ShoppingBag className="h-10 w-10" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">
        Your cart is empty
      </h2>
      <p className="mt-2 text-gray-500">
        Looks like you haven&apos;t added any items yet.
      </p>
      <Link href="/menu" className="mt-8">
        <Button className="rounded-full bg-green-600 px-8 py-6 text-lg hover:bg-green-700">
          Start Shopping
        </Button>
      </Link>
    </div>
  );
}

export default CartSummary;
