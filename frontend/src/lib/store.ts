import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  fetchUser: () => Promise<void>;
}

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
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
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
        const validPrice = typeof item.price === 'number' && !isNaN(item.price) 
          ? item.price 
          : parseFloat(String(item.price)) || 0;
        
        if (existingItem) {
          set({
            items: currentItems.map((i) =>
              i.id === item.id ? { ...i, quantity: i.quantity + quantityToAdd } : i
            ),
          });
        } else {
          // We need to destructure item to avoid passing quantity twice if it's in item, 
          // but actually item is Omit<CartItem, 'quantity'> & { quantity?: number }
          // so spreading item is fine, it will have the optional quantity which we overwrite.
          // Wait, if I spread item, it might have `quantity` property.
          // Let's be explicit.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { quantity, ...rest } = item;
          set({ items: [...currentItems, { ...rest, price: validPrice, quantity: quantityToAdd }] });
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
            items: get().items.map((i) =>
              i.id === id ? { ...i, quantity } : i
            ),
          });
        }
      },
      clearCart: () => set({ items: [] }),
      total: () => get().items.reduce((acc, item) => {
        // Ensure price is valid number
        const price = typeof item.price === 'number' && !isNaN(item.price) 
          ? item.price 
          : parseFloat(String(item.price)) || 0;
        return acc + price * item.quantity;
      }, 0),
    }),
    {
      name: 'cart-storage',
    }
  )
);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      login: (token, user) => {
        localStorage.setItem('token', token);
        // Set cookie for middleware to read
        if (typeof document !== 'undefined') {
          document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        }
        set({ token, user, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('token');
        // Clear cookie
        if (typeof document !== 'undefined') {
          document.cookie = 'token=; path=/; max-age=0';
        }
        set({ token: null, user: null, isAuthenticated: false });
      },
      fetchUser: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        if (!token) {
          // No token, skip fetching
          return;
        }
        try {
          const response = await api.get('/auth/me');
          set({ user: response.data, isAuthenticated: true });
        } catch (error: any) {
          // Only log actual errors, not expected 401s (expired session)
          if (error.response?.status !== 401) {
            console.error("Failed to fetch user:", error);
          }
          set({ user: null, token: null, isAuthenticated: false });
          localStorage.removeItem('token');
          // Also clear cookie
          if (typeof document !== 'undefined') {
            document.cookie = 'token=; path=/; max-age=0';
          }
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
