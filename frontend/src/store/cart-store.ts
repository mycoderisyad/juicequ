/**
 * Shopping cart store using Zustand
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  id: string;
  product_id: string;
  product_name: string;
  image_url?: string;
  size: "small" | "medium" | "large";
  quantity: number;
  unit_price: number;
  customizations?: {
    ice_level?: "no_ice" | "less" | "normal";
    sweetness?: "no_sugar" | "less" | "normal" | "extra";
    add_ons?: string[];
  };
  notes?: string;
}

interface CartState {
  items: CartItem[];
  
  // Computed
  totalItems: () => number;
  subtotal: () => number;
  
  // Actions
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItem: (id: string, updates: Partial<CartItem>) => void;
  clearCart: () => void;
}

// Generate unique ID for cart items
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      totalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },
      
      subtotal: () => {
        return get().items.reduce(
          (sum, item) => sum + item.unit_price * item.quantity,
          0
        );
      },
      
      addItem: (item) => {
        const newItem: CartItem = {
          ...item,
          id: generateId(),
        };
        
        set((state) => {
          // Check if same product with same size and customizations exists
          const existingIndex = state.items.findIndex(
            (i) =>
              i.product_id === item.product_id &&
              i.size === item.size &&
              JSON.stringify(i.customizations) ===
                JSON.stringify(item.customizations)
          );
          
          if (existingIndex >= 0) {
            // Update quantity of existing item
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + item.quantity,
            };
            return { items: newItems };
          }
          
          // Add new item
          return { items: [...state.items, newItem] };
        });
      },
      
      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },
      
      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },
      
      clearCart: () => {
        set({ items: [] });
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Format currency helper
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
