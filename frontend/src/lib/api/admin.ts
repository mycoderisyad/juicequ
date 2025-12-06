/**
 * Admin API endpoints.
 * Users, products, categories, analytics, settings.
 */
import apiClient from "./config";
import type { Product, Category } from "./customer";

// Types
export interface User {
  id: string;
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
  tagline?: string;
  description?: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  district?: string;
  village?: string;
  province?: string;
  postal_code?: string;
  currency_code?: string;
  currency_symbol?: string;
  currency_locale?: string;
}

export interface OperationsSettings {
  opening_hours: string;
  closing_hours: string;
  is_open: boolean;
  accept_orders: boolean;
  delivery_available: boolean;
  minimum_order: number;
  days_open?: string[];
  order_types?: string[];
}

export interface PaymentSettings {
  cash_enabled: boolean;
  card_enabled: boolean;
  digital_enabled: boolean;
  bank_transfer_enabled?: boolean;
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
  getById: async (userId: string): Promise<User> => {
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
    // Backend expects full_name, not nama
    const payload = {
      email: data.email,
      full_name: data.nama,
      password: data.password,
      role: data.role,
    };
    const response = await apiClient.post("/admin/users", payload);
    return response.data;
  },

  /**
   * Update user.
   */
  update: async (
    userId: string,
    data: {
      email?: string;
      nama?: string;
      role?: string;
      is_active?: boolean;
    }
  ): Promise<{ user: User; message: string }> => {
    // Backend expects full_name, not nama
    const payload: Record<string, unknown> = {};
    if (data.email) payload.email = data.email;
    if (data.nama) payload.full_name = data.nama;
    if (data.role) payload.role = data.role;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    
    const response = await apiClient.put(`/admin/users/${userId}`, payload);
    return response.data;
  },

  /**
   * Delete user.
   */
  delete: async (userId: string): Promise<{ message: string }> => {
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
    hero_image?: string;
    bottle_image?: string;
    thumbnail_image?: string;
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
      hero_image: string;
      bottle_image: string;
      thumbnail_image: string;
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

  /**
   * Export products to CSV.
   */
  exportCsv: async (): Promise<Blob> => {
    const response = await apiClient.get("/admin/products/export/csv", {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Export products to Excel.
   */
  exportExcel: async (): Promise<Blob> => {
    const response = await apiClient.get("/admin/products/export/excel", {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Import products from CSV.
   */
  importCsv: async (file: File): Promise<{
    success: boolean;
    total_rows: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/admin/products/import/csv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Import products from Excel.
   */
  importExcel: async (file: File): Promise<{
    success: boolean;
    total_rows: number;
    imported: number;
    updated: number;
    skipped: number;
    errors: string[];
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/admin/products/import/excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  },

  /**
   * Download CSV template.
   */
  downloadTemplate: async (): Promise<Blob> => {
    const response = await apiClient.get("/admin/products/template/csv", {
      responseType: "blob",
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
    api_keys?: {
      exchangerate_api_key_configured: boolean;
      exchangerate_api_key_preview: string;
    };
    currency?: {
      base_currency: string;
      display_currency_code: string;
      display_currency_symbol: string;
      exchange_rates_updated: string;
      has_cached_rates: boolean;
    };
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
    data: Partial<StoreSettings & {
      // Additional keys with different names
      store_name?: string;
      store_tagline?: string;
      store_description?: string;
      store_address?: string;
      store_phone?: string;
      store_email?: string;
      store_latitude?: number;
      store_longitude?: number;
      store_city?: string;
      store_province?: string;
      store_postal_code?: string;
    }>
  ): Promise<{ settings: StoreSettings; message: string }> => {
    // Map frontend keys to backend keys if needed
    const payload: Record<string, unknown> = {};
    if (data.name || data.store_name) payload.store_name = data.name || data.store_name;
    if (data.tagline || data.store_tagline) payload.store_tagline = data.tagline || data.store_tagline;
    if (data.description || data.store_description) payload.store_description = data.description || data.store_description;
    if (data.address || data.store_address) payload.store_address = data.address || data.store_address;
    if (data.phone || data.store_phone) payload.store_phone = data.phone || data.store_phone;
    if (data.email || data.store_email) payload.store_email = data.email || data.store_email;
    if (data.logo) payload.store_logo = data.logo;
    if (data.latitude !== undefined || data.store_latitude !== undefined) 
      payload.store_latitude = data.latitude ?? data.store_latitude;
    if (data.longitude !== undefined || data.store_longitude !== undefined) 
      payload.store_longitude = data.longitude ?? data.store_longitude;
    if (data.city || data.store_city) payload.store_city = data.city || data.store_city;
    if (data.province || data.store_province) payload.store_province = data.province || data.store_province;
    if (data.postal_code || data.store_postal_code) payload.store_postal_code = data.postal_code || data.store_postal_code;
    if (data.currency_code) payload.currency_code = data.currency_code;
    if (data.currency_symbol) payload.currency_symbol = data.currency_symbol;
    if (data.currency_locale) payload.currency_locale = data.currency_locale;

    const response = await apiClient.put("/admin/settings/store", payload);
    return response.data;
  },

  /**
   * Update operations settings.
   */
  updateOperations: async (
    data: Partial<OperationsSettings & {
      opening_time?: string;
      closing_time?: string;
      is_store_open?: boolean;
    }>
  ): Promise<{ settings: OperationsSettings; message: string }> => {
    // Map frontend keys to backend keys
    const payload: Record<string, unknown> = {};
    if (data.opening_hours || data.opening_time) payload.opening_time = data.opening_hours || data.opening_time;
    if (data.closing_hours || data.closing_time) payload.closing_time = data.closing_hours || data.closing_time;
    if (data.days_open) payload.days_open = data.days_open;
    if (data.is_open !== undefined || data.is_store_open !== undefined) 
      payload.is_store_open = data.is_open ?? data.is_store_open;
    if (data.accept_orders !== undefined) payload.accept_orders = data.accept_orders;
    if (data.delivery_available !== undefined) payload.delivery_available = data.delivery_available;
    if (data.minimum_order !== undefined) payload.minimum_order = data.minimum_order;
    if (data.order_types) payload.order_types = data.order_types;

    const response = await apiClient.put("/admin/settings/operations", payload);
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

// Upload API
export const uploadApi = {
  /**
   * Upload single image.
   * Auto-converts to WebP format.
   */
  uploadImage: async (
    file: File,
    imageType: "hero" | "bottle" | "thumbnail" | "catalog",
    productId?: string
  ): Promise<{
    success: boolean;
    message: string;
    url: string;
    filename: string;
    image_type: string;
    original_size: number;
    webp_size: number;
    size_reduction: string;
    product_id?: string;
  }> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("image_type", imageType);
    if (productId) {
      formData.append("product_id", productId);
    }

    const response = await apiClient.post("/admin/upload/image", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Upload batch images for a product.
   */
  uploadBatch: async (
    productId: string,
    images: {
      hero?: File;
      bottle?: File;
      thumbnail?: File;
    }
  ): Promise<{
    success: boolean;
    message: string;
    product_id: string;
    results: Record<string, { success?: boolean; url?: string; error?: string; size_reduction?: string }>;
  }> => {
    const formData = new FormData();
    formData.append("product_id", productId);
    
    if (images.hero) {
      formData.append("hero_image", images.hero);
    }
    if (images.bottle) {
      formData.append("bottle_image", images.bottle);
    }
    if (images.thumbnail) {
      formData.append("thumbnail_image", images.thumbnail);
    }

    const response = await apiClient.post("/admin/upload/images/batch", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },
};

// Orders API
export interface AdminOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone?: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method?: string;
  items_count: number;
  items: Array<{
    id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    subtotal: number;
    size: string;
  }>;
  customer_notes?: string;
  internal_notes?: string;
  created_at?: string;
  paid_at?: string;
  completed_at?: string;
}

export interface OrderStats {
  by_status: Record<string, number>;
  total: number;
}

export const adminOrdersApi = {
  /**
   * Get all orders.
   */
  getAll: async (params?: {
    status?: string;
    search?: string;
    skip?: number;
    limit?: number;
  }): Promise<{ orders: AdminOrder[]; total: number }> => {
    const response = await apiClient.get("/admin/orders", { params });
    return response.data;
  },

  /**
   * Get order by ID.
   */
  getById: async (orderId: string): Promise<AdminOrder> => {
    const response = await apiClient.get(`/admin/orders/${orderId}`);
    return response.data;
  },

  /**
   * Get order statistics.
   */
  getStats: async (): Promise<OrderStats> => {
    const response = await apiClient.get("/admin/orders/stats");
    return response.data;
  },

  /**
   * Update order status.
   */
  updateStatus: async (
    orderId: string,
    status: string
  ): Promise<{ message: string; order_id: string; old_status: string; new_status: string }> => {
    const response = await apiClient.put(`/admin/orders/${orderId}/status`, null, {
      params: { status },
    });
    return response.data;
  },
};

// Product Promos API
export interface ProductPromo {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  promo_type: "percentage" | "fixed";
  discount_value: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_valid: boolean;
  discount_display: string;
  created_at: string;
  updated_at: string;
}

export const promosApi = {
  /**
   * Get all product promos.
   */
  getAll: async (params?: {
    product_id?: number;
    is_active?: boolean;
    page?: number;
    page_size?: number;
  }): Promise<{ items: ProductPromo[]; total: number; page: number; page_size: number }> => {
    const response = await apiClient.get("/admin/promos", { params });
    return response.data;
  },

  /**
   * Get promo by ID.
   */
  getById: async (promoId: string): Promise<ProductPromo> => {
    const response = await apiClient.get(`/admin/promos/${promoId}`);
    return response.data;
  },

  /**
   * Create promo.
   */
  create: async (data: {
    product_id: string;
    name: string;
    description?: string;
    promo_type: "percentage" | "fixed";
    discount_value: number;
    start_date: string;
    end_date: string;
    is_active?: boolean;
  }): Promise<ProductPromo> => {
    const response = await apiClient.post("/admin/promos", data);
    return response.data;
  },

  /**
   * Update promo.
   */
  update: async (
    promoId: string,
    data: Partial<{
      name: string;
      description: string;
      promo_type: "percentage" | "fixed";
      discount_value: number;
      start_date: string;
      end_date: string;
      is_active: boolean;
      product_id: string;
    }>
  ): Promise<ProductPromo> => {
    const response = await apiClient.put(`/admin/promos/${promoId}`, data);
    return response.data;
  },

  /**
   * Delete promo.
   */
  delete: async (promoId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/admin/promos/${promoId}`);
    return response.data;
  },
};

// Vouchers API
export interface Voucher {
  id: string;
  code: string;
  name: string;
  description: string | null;
  voucher_type: "percentage" | "fixed" | "free_shipping";
  discount_value: number;
  min_order_amount: number;
  max_discount: number | null;
  usage_limit: number | null;
  usage_count: number;
  per_user_limit: number;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_valid: boolean;
  usage_remaining: number | null;
  discount_display: string;
  created_at: string;
  updated_at: string;
}

export const vouchersApi = {
  /**
   * Get all vouchers.
   */
  getAll: async (params?: {
    is_active?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<{ items: Voucher[]; total: number; page: number; page_size: number }> => {
    const response = await apiClient.get("/admin/vouchers", { params });
    return response.data;
  },

  /**
   * Get voucher by ID.
   */
  getById: async (voucherId: string): Promise<Voucher> => {
    const response = await apiClient.get(`/admin/vouchers/${voucherId}`);
    return response.data;
  },

  /**
   * Create voucher.
   */
  create: async (data: {
    code: string;
    name: string;
    description?: string;
    voucher_type: "percentage" | "fixed" | "free_shipping";
    discount_value: number;
    min_order_amount?: number;
    max_discount?: number;
    usage_limit?: number;
    per_user_limit?: number;
    start_date: string;
    end_date: string;
    is_active?: boolean;
  }): Promise<Voucher> => {
    const response = await apiClient.post("/admin/vouchers", data);
    return response.data;
  },

  /**
   * Update voucher.
   */
  update: async (
    voucherId: string,
    data: Partial<{
      code: string;
      name: string;
      description: string;
      voucher_type: "percentage" | "fixed" | "free_shipping";
      discount_value: number;
      min_order_amount: number;
      max_discount: number;
      usage_limit: number;
      per_user_limit: number;
      start_date: string;
      end_date: string;
      is_active: boolean;
    }>
  ): Promise<Voucher> => {
    const response = await apiClient.put(`/admin/vouchers/${voucherId}`, data);
    return response.data;
  },

  /**
   * Delete voucher.
   */
  delete: async (voucherId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/admin/vouchers/${voucherId}`);
    return response.data;
  },
};

const adminApi = {
  users: usersApi,
  products: adminProductsApi,
  categories: categoriesApi,
  analytics: analyticsApi,
  settings: settingsApi,
  upload: uploadApi,
  orders: adminOrdersApi,
  promos: promosApi,
  vouchers: vouchersApi,
};

export default adminApi;
