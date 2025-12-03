/**
 * User-related types.
 */

export type UserRole = "guest" | "pembeli" | "kasir" | "admin";

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  preferences?: string;
  created_at: string;
  last_login?: string;
}

export interface UserProfile extends User {
  order_count?: number;
  total_spent?: number;
  loyalty_points?: number;
}

export interface UserCreateInput {
  email: string;
  password: string;
  full_name: string;
  phone_number?: string;
  role?: UserRole;
}

export interface UserUpdateInput {
  full_name?: string;
  phone_number?: string;
  preferences?: string;
}
