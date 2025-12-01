/**
 * Authentication store using Zustand
 */
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: "guest" | "pembeli" | "kasir" | "admin";
  is_active: boolean;
  is_verified: boolean;
  preferences?: string;
  created_at: string;
  last_login?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setLoading: (isLoading) => set({ isLoading }),
      
      login: (user, accessToken, refreshToken) => {
        localStorage.setItem("access_token", accessToken);
        localStorage.setItem("refresh_token", refreshToken);
        // Also set cookie for middleware
        if (typeof document !== "undefined") {
          document.cookie = `token=${accessToken}; path=/; max-age=${60 * 60 * 24 * 7}`;
        }
        set({ user, isAuthenticated: true, isLoading: false });
      },
      
      logout: () => {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        // Clear cookie
        if (typeof document !== "undefined") {
          document.cookie = "token=; path=/; max-age=0";
        }
        set({ user: null, isAuthenticated: false });
      },
      
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
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
