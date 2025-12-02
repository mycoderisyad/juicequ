/**
 * Customer API endpoints.
 * Products, cart, orders, profile.
 */
import apiClient from "./config";

// Types
export interface Product {
  id: number | string;
  name: string;
  description: string;
  price?: number;
  base_price?: number;
  calories?: number;
  category?: string;
  category_id?: string;
  category_name?: string;
  image?: string;
  image_url?: string;
  image_color?: string;
  is_available: boolean;
  stock?: number;
  stock_quantity?: number;
  ingredients?: string[];
  rating?: number;
  reviews?: number;
  nutrition?: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  };
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CartItem {
  product_id: number;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  image_color?: string;
}

export interface Cart {
  items: CartItem[];
  total: number;
  item_count: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  tax?: number;
  total: number;
  status: string;
  payment_status?: string;
  notes?: string;
  created_at: string;
}

// Products API
export const productsApi = {
  /**
   * Get all products with filters.
   */
  getAll: async (params?: {
    category?: string;
    search?: string;
    min_price?: number;
    max_price?: number;
  }): Promise<{ items: Product[]; total: number }> => {
    const response = await apiClient.get("/customer/products", { params });
    return response.data;
  },

  /**
   * Get product categories.
   */
  getCategories: async (): Promise<{ categories: Category[] }> => {
    const response = await apiClient.get("/customer/products/categories");
    return response.data;
  },

  /**
   * Get product by ID.
   */
  getById: async (id: string | number): Promise<Product> => {
    const response = await apiClient.get(`/customer/products/${id}`);
    return response.data;
  },
};

// Cart API
export const cartApi = {
  /**
   * Get current cart.
   */
  get: async (): Promise<Cart> => {
    const response = await apiClient.get("/customer/cart");
    return response.data;
  },

  /**
   * Add item to cart.
   */
  addItem: async (productId: number, quantity: number = 1): Promise<Cart> => {
    const response = await apiClient.post("/customer/cart/items", {
      product_id: productId,
      quantity,
    });
    return response.data;
  },

  /**
   * Update item quantity.
   */
  updateItem: async (productId: number, quantity: number): Promise<Cart> => {
    const response = await apiClient.put(`/customer/cart/items/${productId}`, {
      quantity,
    });
    return response.data;
  },

  /**
   * Remove item from cart.
   */
  removeItem: async (productId: number): Promise<Cart> => {
    const response = await apiClient.delete(`/customer/cart/items/${productId}`);
    return response.data;
  },

  /**
   * Clear entire cart.
   */
  clear: async (): Promise<{ message: string }> => {
    const response = await apiClient.delete("/customer/cart");
    return response.data;
  },
};

// Orders API
export const ordersApi = {
  /**
   * Get user's orders.
   */
  getAll: async (): Promise<{ orders: Order[]; total: number }> => {
    const response = await apiClient.get("/customer/orders");
    return response.data;
  },

  /**
   * Get order by ID.
   */
  getById: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get(`/customer/orders/${orderId}`);
    return response.data;
  },

  /**
   * Create new order.
   */
  create: async (notes?: string): Promise<{ order: Order; message: string }> => {
    const response = await apiClient.post("/customer/orders", { notes });
    return response.data;
  },

  /**
   * Cancel order.
   */
  cancel: async (orderId: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/customer/orders/${orderId}/cancel`);
    return response.data;
  },
};

// Profile API
export const profileApi = {
  /**
   * Get user profile.
   */
  get: async (): Promise<{ profile: Record<string, unknown> }> => {
    const response = await apiClient.get("/customer/profile");
    return response.data;
  },

  /**
   * Update profile.
   */
  update: async (data: {
    nama?: string;
    phone?: string;
    address?: string;
  }): Promise<{ message: string }> => {
    const response = await apiClient.put("/customer/profile", data);
    return response.data;
  },
};

const customerApi = {
  products: productsApi,
  cart: cartApi,
  orders: ordersApi,
  profile: profileApi,
};

export default customerApi;
