/**
 * Admin API endpoints.
 * Users, products, categories, analytics, settings.
 */
import apiClient from "./config";
import type { Product, Category } from "./customer";

// Types
export interface User {
  id: number;
  email: string;
  nama: string;
  role: string;
  is_active: boolean;
  created_at?: string;
}

export interface UserStats {
  total_users: number;
  active_users: number;
  inactive_users: number;
  by_role: Record<string, number>;
}

export interface DashboardData {
  users: {
    total: number;
    active: number;
  };
  products: {
    total: number;
    available: number;
  };
  orders: {
    total: number;
    today: number;
    pending: number;
  };
  revenue: {
    today: number;
    total: number;
    transactions_today: number;
  };
  generated_at: string;
}

export interface SalesAnalytics {
  period: string;
  start_date: string;
  end_date: string;
  summary: {
    total_revenue: number;
    total_transactions: number;
    average_transaction: number;
  };
  daily: Array<{ date: string; revenue: number; transactions: number }>;
  by_payment_method: Record<string, { count: number; revenue: number }>;
}

export interface StoreSettings {
  name: string;
  tagline: string;
  description: string;
  logo: string;
  address: string;
  phone: string;
  email: string;
}

export interface OperationsSettings {
  opening_hours: string;
  closing_hours: string;
  is_open: boolean;
  accept_orders: boolean;
  delivery_available: boolean;
  minimum_order: number;
}

export interface PaymentSettings {
  cash_enabled: boolean;
  card_enabled: boolean;
  digital_enabled: boolean;
  tax_rate: number;
  service_charge: number;
}

// Users API
export const usersApi = {
  /**
   * Get all users.
   */
  getAll: async (params?: {
    role?: string;
    is_active?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ users: User[]; total: number }> => {
    const response = await apiClient.get("/admin/users", { params });
    return response.data;
  },

  /**
   * Get user by ID.
   */
  getById: async (userId: number): Promise<User> => {
    const response = await apiClient.get(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Create user.
   */
  create: async (data: {
    email: string;
    nama: string;
    password: string;
    role?: string;
  }): Promise<{ user: User; message: string }> => {
    const response = await apiClient.post("/admin/users", data);
    return response.data;
  },

  /**
   * Update user.
   */
  update: async (
    userId: number,
    data: {
      email?: string;
      nama?: string;
      role?: string;
      is_active?: boolean;
    }
  ): Promise<{ user: User; message: string }> => {
    const response = await apiClient.put(`/admin/users/${userId}`, data);
    return response.data;
  },

  /**
   * Delete user.
   */
  delete: async (userId: number): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/admin/users/${userId}`);
    return response.data;
  },

  /**
   * Get user statistics.
   */
  getStats: async (): Promise<UserStats> => {
    const response = await apiClient.get("/admin/users/stats/overview");
    return response.data;
  },
};

// Products API (Admin)
export const adminProductsApi = {
  /**
   * Get all products.
   */
  getAll: async (params?: {
    category?: string;
    is_available?: boolean;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> => {
    const response = await apiClient.get("/admin/products", { params });
    return response.data;
  },

  /**
   * Get product by ID.
   */
  getById: async (productId: string): Promise<Product> => {
    const response = await apiClient.get(`/admin/products/${productId}`);
    return response.data;
  },

  /**
   * Create product.
   */
  create: async (data: {
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
    is_available?: boolean;
    stock?: number;
    ingredients?: string[];
    nutrition?: Record<string, number>;
  }): Promise<{ product: Product; message: string }> => {
    const response = await apiClient.post("/admin/products", data);
    return response.data;
  },

  /**
   * Update product.
   */
  update: async (
    productId: string,
    data: Partial<{
      name: string;
      description: string;
      price: number;
      category: string;
      image: string;
      is_available: boolean;
      stock: number;
      ingredients: string[];
      nutrition: Record<string, number>;
    }>
  ): Promise<{ product: Product; message: string }> => {
    const response = await apiClient.put(`/admin/products/${productId}`, data);
    return response.data;
  },

  /**
   * Delete product.
   */
  delete: async (productId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/admin/products/${productId}`);
    return response.data;
  },

  /**
   * Update stock.
   */
  updateStock: async (
    productId: string,
    stock: number
  ): Promise<{ message: string; old_stock: number; new_stock: number }> => {
    const response = await apiClient.put(`/admin/products/${productId}/stock`, null, {
      params: { stock },
    });
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  /**
   * Get all categories.
   */
  getAll: async (): Promise<{ categories: Category[]; total: number }> => {
    const response = await apiClient.get("/admin/categories");
    return response.data;
  },

  /**
   * Get category by ID.
   */
  getById: async (categoryId: string): Promise<Category & { products: Product[] }> => {
    const response = await apiClient.get(`/admin/categories/${categoryId}`);
    return response.data;
  },

  /**
   * Create category.
   */
  create: async (data: {
    id: string;
    name: string;
    icon?: string;
    description?: string;
  }): Promise<{ category: Category; message: string }> => {
    const response = await apiClient.post("/admin/categories", data);
    return response.data;
  },

  /**
   * Update category.
   */
  update: async (
    categoryId: string,
    data: {
      name?: string;
      icon?: string;
      description?: string;
    }
  ): Promise<{ category: Category; message: string }> => {
    const response = await apiClient.put(`/admin/categories/${categoryId}`, data);
    return response.data;
  },

  /**
   * Delete category.
   */
  delete: async (categoryId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/admin/categories/${categoryId}`);
    return response.data;
  },
};

// Analytics API
export const analyticsApi = {
  /**
   * Get dashboard overview.
   */
  getDashboard: async (): Promise<DashboardData> => {
    const response = await apiClient.get("/admin/analytics/dashboard");
    return response.data;
  },

  /**
   * Get sales analytics.
   */
  getSales: async (period: string = "week"): Promise<SalesAnalytics> => {
    const response = await apiClient.get("/admin/analytics/sales", {
      params: { period },
    });
    return response.data;
  },

  /**
   * Get product analytics.
   */
  getProducts: async (
    limit: number = 20
  ): Promise<{
    top_products: Array<{
      id: string;
      name: string;
      quantity_sold: number;
      revenue: number;
    }>;
    top_categories: Array<{
      id: string;
      name: string;
      quantity_sold: number;
      revenue: number;
    }>;
  }> => {
    const response = await apiClient.get("/admin/analytics/products", {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get customer analytics.
   */
  getCustomers: async (): Promise<{
    total_customers: number;
    top_customers: Array<{
      user_id: number;
      name: string;
      email: string;
      total_orders: number;
      total_spent: number;
    }>;
    average_orders_per_customer: number;
    average_spent_per_customer: number;
  }> => {
    const response = await apiClient.get("/admin/analytics/customers");
    return response.data;
  },
};

// Settings API
export const settingsApi = {
  /**
   * Get all settings.
   */
  getAll: async (): Promise<{
    store: StoreSettings;
    operations: OperationsSettings;
    payments: PaymentSettings;
    notifications: Record<string, boolean>;
  }> => {
    const response = await apiClient.get("/admin/settings");
    return response.data;
  },

  /**
   * Get settings by category.
   */
  getCategory: async (category: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.get(`/admin/settings/${category}`);
    return response.data;
  },

  /**
   * Update store settings.
   */
  updateStore: async (
    data: Partial<StoreSettings>
  ): Promise<{ settings: StoreSettings; message: string }> => {
    const response = await apiClient.put("/admin/settings/store", data);
    return response.data;
  },

  /**
   * Update operations settings.
   */
  updateOperations: async (
    data: Partial<OperationsSettings>
  ): Promise<{ settings: OperationsSettings; message: string }> => {
    const response = await apiClient.put("/admin/settings/operations", data);
    return response.data;
  },

  /**
   * Update payment settings.
   */
  updatePayments: async (
    data: Partial<PaymentSettings>
  ): Promise<{ settings: PaymentSettings; message: string }> => {
    const response = await apiClient.put("/admin/settings/payments", data);
    return response.data;
  },

  /**
   * Toggle store open/close.
   */
  toggleStore: async (): Promise<{ is_open: boolean; message: string }> => {
    const response = await apiClient.post("/admin/settings/toggle-store");
    return response.data;
  },
};

const adminApi = {
  users: usersApi,
  products: adminProductsApi,
  categories: categoriesApi,
  analytics: analyticsApi,
  settings: settingsApi,
};

export default adminApi;
