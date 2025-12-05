/**
 * Authentication store using Zustand
 * Unified auth store for the entire application
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import apiClient from "@/lib/api/config";

export interface User {
  id: string;
  email: string;
  full_name: string;
  nama?: string;
  phone_number?: string;
  role: "guest" | "pembeli" | "kasir" | "admin";
  is_active?: boolean;
  is_verified?: boolean;
  preferences?: string;
  created_at?: string;
  last_login?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  fetchUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      login: (token, user) => {
        localStorage.setItem("token", token);
        localStorage.setItem("access_token", token);
        // Set cookie for proxy/middleware to read
        if (typeof document !== "undefined") {
          document.cookie = `token=${token}; path=/; max-age=${60 * 60 * 24 * 7}`;
        }
        set({ token, user, isAuthenticated: true, isLoading: false });
      },
      
      logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // Clear cookie
        if (typeof document !== "undefined") {
          document.cookie = "token=; path=/; max-age=0";
        }
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      fetchUser: async () => {
        const token = typeof window !== "undefined" 
          ? (localStorage.getItem("token") || localStorage.getItem("access_token")) 
          : null;
        if (!token) {
          set({ isLoading: false });
          return;
        }
        try {
          const response = await apiClient.get("/auth/me");
          set({ user: response.data, isAuthenticated: true, isLoading: false });
        } catch (error: unknown) {
          const axiosError = error as { response?: { status?: number } };
          if (axiosError.response?.status !== 401) {
            // Suppress logging for expected 401s
          }
          set({ user: null, token: null, isAuthenticated: false, isLoading: false });
          localStorage.removeItem("token");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          if (typeof document !== "undefined") {
            document.cookie = "token=; path=/; max-age=0";
          }
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Role check helpers
export function hasRole(user: User | null, ...roles: string[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

export function isAdmin(user: User | null): boolean {
  return hasRole(user, "admin");
}

export function isKasir(user: User | null): boolean {
  return hasRole(user, "kasir", "admin");
}

export function isPembeli(user: User | null): boolean {
  return hasRole(user, "pembeli", "kasir", "admin");
}
