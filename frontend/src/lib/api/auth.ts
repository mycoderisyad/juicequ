/**
 * Authentication API.
 */
import apiClient from "./config";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  nama: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    nama: string;
    role: string;
  };
}

export interface User {
  id: number;
  email: string;
  nama: string;
  role: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export const authApi = {
  /**
   * Login user.
   */
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/login", data);
    return response.data;
  },

  /**
   * Register new user.
   */
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>("/auth/register", data);
    return response.data;
  },

  /**
   * Get current user profile.
   */
  getProfile: async (): Promise<User> => {
    const response = await apiClient.get<User>("/auth/me");
    return response.data;
  },

  /**
   * Request password reset email.
   */
  requestPasswordReset: async (email: string): Promise<void> => {
    await apiClient.post("/auth/password/forgot", { email });
  },

  /**
   * Reset password using token.
   */
  resetPassword: async ({ token, newPassword }: ResetPasswordPayload): Promise<void> => {
    await apiClient.post("/auth/password/reset", {
      token,
      new_password: newPassword,
    });
  },

  /**
   * Send email verification link.
   */
  sendVerification: async (email: string): Promise<void> => {
    await apiClient.post("/auth/verify-email/send", { email });
  },

  /**
   * Confirm email verification.
   */
  confirmVerification: async (token: string): Promise<void> => {
    await apiClient.post("/auth/verify-email/confirm", { token });
  },

  /**
   * Logout user.
   */
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },
};

export default authApi;
