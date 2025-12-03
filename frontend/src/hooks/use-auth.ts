/**
 * Authentication hook.
 * Provides easy access to auth state and actions.
 */
"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore, type User } from "@/store/auth-store";
import authApi from "@/lib/api/auth";

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isKasir: boolean;
  isPembeli: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (data: { email: string; password: string; full_name: string; phone_number?: string }) => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, login: storeLogin, logout: storeLogout } = useAuthStore();
  
  const login = useCallback(async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    const userData = await authApi.getProfile();
    // Map API response to store format
    const mappedUser: User = {
      id: String(userData.id),
      email: userData.email,
      full_name: userData.nama,
      role: userData.role as User["role"],
      is_active: true,
      is_verified: true,
      created_at: new Date().toISOString(),
    };
    storeLogin(mappedUser, response.access_token, response.access_token);
  }, [storeLogin]);
  
  const logout = useCallback(() => {
    storeLogout();
    router.push("/login");
  }, [storeLogout, router]);
  
  const register = useCallback(async (data: {
    email: string;
    password: string;
    full_name: string;
    phone_number?: string;
  }) => {
    await authApi.register({
      email: data.email,
      password: data.password,
      nama: data.full_name,
    });
    // After registration, login automatically
    await login(data.email, data.password);
  }, [login]);
  
  const isAdmin = user?.role === "admin";
  const isKasir = user?.role === "kasir" || user?.role === "admin";
  const isPembeli = !!user;
  
  return {
    user,
    isAuthenticated,
    isLoading,
    isAdmin,
    isKasir,
    isPembeli,
    login,
    logout,
    register,
  };
}

