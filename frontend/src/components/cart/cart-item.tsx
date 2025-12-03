/**
 * Cart item component
 */
"use client";

import * as React from "react";
import { Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CartItemData {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  size?: "small" | "medium" | "large";
}

interface CartItemProps {
  item: CartItemData;
  onUpdateQuantity: (id: string | number, quantity: number) => void;
  onRemove: (id: string | number) => void;
  className?: string;
  formatCurrency?: (value: number) => string;
}

export function CartItem({
  item,
  onUpdateQuantity,
  onRemove,
  className,
  formatCurrency = (value: number) => `$${value.toFixed(2)}`,
}: CartItemProps) {
  const handleIncrement = () => {
    onUpdateQuantity(item.id, item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      onUpdateQuantity(item.id, item.quantity - 1);
    } else {
      onRemove(item.id);
    }
  };

  const itemTotal = item.price * item.quantity;

  return (
    <div
      className={cn(
        "flex items-center gap-4 rounded-3xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6",
        className
      )}
    >
      {/* Image */}
      <div
        className={cn(
          "flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl",
          item.color || "bg-gray-100"
        )}
        aria-hidden="true"
      >
        <div className="h-16 w-16 rounded-full bg-white/30 shadow-inner" />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-lg font-bold text-gray-900">
            {item.name}
          </h3>
          <p className="font-medium text-green-600">
            {formatCurrency(item.price)}
          </p>
          {item.size && (
            <p className="text-sm capitalize text-gray-500">{item.size}</p>
          )}
        </div>

        <div className="mt-4 flex items-center gap-6 sm:mt-0">
          {/* Quantity controls */}
          <div
            className="flex items-center rounded-full border border-gray-200 bg-gray-50"
            role="group"
            aria-label={`Quantity controls for ${item.name}`}
          >
            <button
              onClick={handleDecrement}
              className="p-2 text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              aria-label={`Decrease quantity of ${item.name}`}
            >
              <Minus className="h-4 w-4" aria-hidden="true" />
            </button>
            <span
              className="w-8 text-center text-sm font-medium text-gray-900"
              aria-live="polite"
            >
              {item.quantity}
            </span>
            <button
              onClick={handleIncrement}
              className="p-2 text-gray-600 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
              aria-label={`Increase quantity of ${item.name}`}
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {/* Subtotal */}
          <span className="hidden min-w-20 text-right font-semibold text-gray-900 sm:block">
            {formatCurrency(itemTotal)}
          </span>

          {/* Remove button */}
          <button
            onClick={() => onRemove(item.id)}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;
