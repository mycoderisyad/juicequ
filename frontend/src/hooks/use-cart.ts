/**
 * Cart hook.
 * Provides easy access to cart state and actions.
 */
"use client";

import { useCallback, useMemo } from "react";
import { useCartStore, type CartItem, formatCurrency } from "@/store/cart-store";

interface UseCartReturn {
  items: CartItem[];
  totalItems: number;
  subtotal: number;
  formattedSubtotal: string;
  isEmpty: boolean;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getItemById: (id: string) => CartItem | undefined;
}

export function useCart(): UseCartReturn {
  const store = useCartStore();
  
  const totalItems = useMemo(() => store.totalItems(), [store.items]);
  const subtotal = useMemo(() => store.subtotal(), [store.items]);
  const formattedSubtotal = useMemo(() => formatCurrency(subtotal), [subtotal]);
  const isEmpty = store.items.length === 0;
  
  const getItemById = useCallback(
    (id: string) => store.items.find((item) => item.id === id),
    [store.items]
  );
  
  return {
    items: store.items,
    totalItems,
    subtotal,
    formattedSubtotal,
    isEmpty,
    addItem: store.addItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    getItemById,
  };
}
