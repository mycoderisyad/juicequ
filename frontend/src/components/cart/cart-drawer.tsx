/**
 * Cart drawer component - slide-out cart panel
 */
"use client";

import * as React from "react";
import { X, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/lib/store";
import { CartItem } from "./cart-item";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, removeItem, updateQuantity, total } = useCartStore();
  const cartTotal = total();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className={cn(
          "fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-gray-50 shadow-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <div className="flex items-center gap-3">
            <ShoppingBag className="h-6 w-6 text-green-600" aria-hidden="true" />
            <h2 className="text-xl font-bold text-gray-900">
              Your Cart
              {itemCount > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  ({itemCount} {itemCount === 1 ? "item" : "items"})
                </span>
              )}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close cart"
          >
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-gray-400">
                <ShoppingBag className="h-8 w-8" aria-hidden="true" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Your cart is empty
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Add some delicious juices!
              </p>
              <Button
                onClick={onClose}
                variant="outline"
                className="mt-6"
              >
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="text-xl font-bold text-gray-900">
                ${cartTotal.toFixed(2)}
              </span>
            </div>
            <p className="mb-4 text-xs text-gray-500">
              Taxes and shipping calculated at checkout
            </p>
            <Link href="/cart" onClick={onClose}>
              <Button className="w-full rounded-full bg-green-600 py-6 text-lg hover:bg-green-700">
                View Cart & Checkout
                <ArrowRight className="ml-2 h-5 w-5" aria-hidden="true" />
              </Button>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

export default CartDrawer;
