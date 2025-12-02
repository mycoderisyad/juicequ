/**
 * API Configuration.
 * Base URL and common settings.
 */
import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

/**
 * Create axios instance with default config.
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

/**
 * Add auth token to requests.
 */
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      // Check both keys for backward compatibility
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Handle response errors.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect on 401 if not already on login page
    if (error.response?.status === 401) {
      if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("auth-storage");
        // Clear cookie
        document.cookie = "token=; path=/; max-age=0";
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
