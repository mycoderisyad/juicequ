/**
 * Store exports for the application.
 * Cart store is defined here, Auth store is re-exported from store/auth-store.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Re-export auth store from centralized location
export { useAuthStore } from "@/store/auth-store";
export type { User } from "@/store/auth-store";

interface CartItem {
  id: string | number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
  removeItem: (id: string | number) => void;
  updateQuantity: (id: string | number, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const currentItems = get().items;
        const existingItem = currentItems.find((i) => i.id === item.id);
        const quantityToAdd = item.quantity || 1;
        // Ensure price is a valid number
        const validPrice =
          typeof item.price === "number" && !isNaN(item.price)
            ? item.price
            : parseFloat(String(item.price)) || 0;

        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
            ),
          });
        } else {
          const { quantity: _, ...rest } = item;
          set({
            items: [...currentItems, { ...rest, price: validPrice, quantity: quantityToAdd }],
          });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter((i) => i.id !== id) });
      },
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
        } else {
          set({
            items: get().items.map((i) => (i.id === id ? { ...i, quantity } : i)),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      total: () =>
        get().items.reduce((acc, item) => {
          const price =
            typeof item.price === "number" && !isNaN(item.price)
              ? item.price
              : parseFloat(String(item.price)) || 0;
          return acc + price * item.quantity;
        }, 0),
    }),
    {
      name: "cart-storage",
    }
  )
);
