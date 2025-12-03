/**
 * API Module.
 * Central export for all API functions.
 */
export { default as apiClient } from "./config";
export { default as authApi } from "./auth";
export { default as customerApi, productsApi, cartApi, ordersApi, profileApi } from "./customer";
export { default as cashierApi, cashierOrdersApi, transactionsApi, reportsApi } from "./cashier";
export { default as adminApi, usersApi, adminProductsApi, categoriesApi, analyticsApi, settingsApi } from "./admin";
export { default as aiApi } from "./ai";

// Re-export types
export type { LoginRequest, RegisterRequest, AuthResponse, User } from "./auth";
export type { Product, Category, CartItem, Cart, Order } from "./customer";
export type { Transaction, Receipt, DailyReport, SalesSummary } from "./cashier";
export type {
  UserStats,
  DashboardData,
  SalesAnalytics,
  StoreSettings,
  OperationsSettings,
  PaymentSettings,
} from "./admin";
export type {
  ChatRequest,
  ChatResponse,
  VoiceResponse,
  VoiceOrderResponse,
  OrderItem,
  OrderData,
  ProductRecommendation,
  RecommendationResponse,
  AIFeedbackRequest,
  AIFeedbackResponse,
  AIInteraction,
  AIInteractionListResponse,
} from "./ai";
