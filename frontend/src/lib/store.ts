/**
 * Store exports for the application.
 * Cart store is defined here, Auth store is re-exported from store/auth-store.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

// Re-export auth store from centralized location
export { useAuthStore } from "@/store/auth-store";
export type { User } from "@/store/auth-store";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  color?: string;
  size?: "small" | "medium" | "large";
  volume?: number;
  volumeUnit?: string;
}

type CartItemInput = Omit<CartItem, "quantity" | "id"> & { 
  id: number | string; 
  quantity?: number;
};

interface CartState {
  items: CartItem[];
  addItem: (item: CartItemInput) => void;
  removeItem: (id: number | string) => void;
  updateQuantity: (id: number | string, quantity: number) => void;
  clearCart: () => void;
  total: () => number;
}

// Helper to normalize ID to string for consistent comparison
const normalizeId = (id: number | string): string => {
  return String(id);
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) => {
        const currentItems = get().items;
        const itemId = normalizeId(item.id);
        const existingItem = currentItems.find((i) => i.id === itemId);
        const quantityToAdd = item.quantity || 1;
        
        // Ensure price is a valid number
        const validPrice =
          typeof item.price === "number" && !isNaN(item.price)
            ? item.price
            : parseFloat(String(item.price)) || 0;

        if (existingItem) {
          // Update quantity AND price (in case price changed from server)
          set({
            items: currentItems.map((i) =>
              i.id === itemId
                ? { ...i, quantity: i.quantity + quantityToAdd, price: validPrice }
                : i
            ),
          });
        } else {
          const { quantity: _, id: __, ...rest } = item;
          set({
            items: [...currentItems, { 
              ...rest, 
              id: itemId, 
              price: validPrice, 
              quantity: quantityToAdd 
            }],
          });
        }
      },
      removeItem: (id) => {
        const itemId = normalizeId(id);
        set({ items: get().items.filter((i) => i.id !== itemId) });
      },
      updateQuantity: (id, quantity) => {
        const itemId = normalizeId(id);
        if (quantity <= 0) {
          get().removeItem(itemId);
        } else {
          set({
            items: get().items.map((i) => (i.id === itemId ? { ...i, quantity } : i)),
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
