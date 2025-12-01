/**
 * Cashier API endpoints.
 * Order processing, transactions, reports.
 */
import apiClient from "./config";
import type { Order, CartItem } from "./customer";

// Types
export interface Transaction {
  id: string;
  order_id: string;
  payment_method: string;
  amount: number;
  amount_received: number;
  change: number;
  cashier_id: number;
  cashier_name: string;
  status: string;
  notes?: string;
  refunded?: boolean;
  refund_reason?: string;
  created_at: string;
}

export interface Receipt {
  receipt_number: string;
  store_name: string;
  store_tagline: string;
  date: string;
  items: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
  payment_method: string;
  amount_received: number;
  change: number;
  cashier: string;
  message: string;
}

export interface DailyReport {
  date: string;
  total_sales: number;
  total_transactions: number;
  average_transaction: number;
  by_payment_method: Record<string, { count: number; total: number }>;
  transactions: Transaction[];
}

export interface SalesSummary {
  period: string;
  start_date: string;
  end_date: string;
  sales: {
    total: number;
    count: number;
    average: number;
  };
  orders: {
    total: number;
    completed: number;
    cancelled: number;
    pending: number;
  };
  refunds: {
    count: number;
    total: number;
  };
}

// Orders API (Cashier)
export const cashierOrdersApi = {
  /**
   * Get all orders.
   */
  getAll: async (params?: {
    status?: string;
    limit?: number;
  }): Promise<{ orders: Order[]; total: number }> => {
    const response = await apiClient.get("/cashier/orders", { params });
    return response.data;
  },

  /**
   * Get pending orders.
   */
  getPending: async (): Promise<{ orders: Order[]; total: number }> => {
    const response = await apiClient.get("/cashier/orders/pending");
    return response.data;
  },

  /**
   * Get order by ID.
   */
  getById: async (orderId: string): Promise<Order> => {
    const response = await apiClient.get(`/cashier/orders/${orderId}`);
    return response.data;
  },

  /**
   * Update order status.
   */
  updateStatus: async (
    orderId: string,
    status: string,
    notes?: string
  ): Promise<{ order: Order; message: string }> => {
    const response = await apiClient.put(`/cashier/orders/${orderId}/status`, {
      status,
      notes,
    });
    return response.data;
  },

  /**
   * Complete an order.
   */
  complete: async (orderId: string): Promise<{ order: Order; message: string }> => {
    const response = await apiClient.post(`/cashier/orders/${orderId}/complete`);
    return response.data;
  },
};

// Transactions API
export const transactionsApi = {
  /**
   * Get transactions.
   */
  getAll: async (params?: {
    payment_method?: string;
    limit?: number;
  }): Promise<{ transactions: Transaction[]; total: number }> => {
    const response = await apiClient.get("/cashier/transactions", { params });
    return response.data;
  },

  /**
   * Process payment.
   */
  processPayment: async (data: {
    order_id: string;
    payment_method: string;
    amount_received: number;
    notes?: string;
  }): Promise<{ transaction: Transaction; change: number; message: string }> => {
    const response = await apiClient.post("/cashier/transactions/process", data);
    return response.data;
  },

  /**
   * Get transaction by ID.
   */
  getById: async (transactionId: string): Promise<Transaction> => {
    const response = await apiClient.get(`/cashier/transactions/${transactionId}`);
    return response.data;
  },

  /**
   * Get receipt.
   */
  getReceipt: async (transactionId: string): Promise<Receipt> => {
    const response = await apiClient.get(`/cashier/transactions/${transactionId}/receipt`);
    return response.data;
  },

  /**
   * Process refund.
   */
  refund: async (
    transactionId: string,
    reason: string
  ): Promise<{ transaction: Transaction; message: string }> => {
    const response = await apiClient.post(`/cashier/transactions/${transactionId}/refund`, {
      reason,
    });
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  /**
   * Get daily report.
   */
  getDaily: async (date?: string): Promise<DailyReport> => {
    const response = await apiClient.get("/cashier/reports/daily", {
      params: { date },
    });
    return response.data;
  },

  /**
   * Get sales summary.
   */
  getSummary: async (period: string = "today"): Promise<SalesSummary> => {
    const response = await apiClient.get("/cashier/reports/summary", {
      params: { period },
    });
    return response.data;
  },

  /**
   * Get popular items.
   */
  getPopularItems: async (
    limit: number = 10
  ): Promise<{
    items: Array<{ id: string; name: string; quantity: number; revenue: number }>;
    total: number;
  }> => {
    const response = await apiClient.get("/cashier/reports/popular-items", {
      params: { limit },
    });
    return response.data;
  },
};

const cashierApi = {
  orders: cashierOrdersApi,
  transactions: transactionsApi,
  reports: reportsApi,
};

export default cashierApi;
