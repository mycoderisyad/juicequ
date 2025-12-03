/**
 * Application constants.
 * Centralized configuration values.
 */

// API
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";
export const API_TIMEOUT = 10000;

// Product sizes
export const PRODUCT_SIZES = {
  small: { label: "Small", multiplier: 0.8 },
  medium: { label: "Medium", multiplier: 1.0 },
  large: { label: "Large", multiplier: 1.3 },
} as const;

// Order statuses
export const ORDER_STATUSES = {
  pending: { label: "Menunggu", color: "yellow" },
  paid: { label: "Dibayar", color: "blue" },
  preparing: { label: "Diproses", color: "orange" },
  ready: { label: "Siap", color: "green" },
  completed: { label: "Selesai", color: "gray" },
  cancelled: { label: "Dibatalkan", color: "red" },
} as const;

// Payment methods
export const PAYMENT_METHODS = {
  cash: { label: "Tunai", icon: "💵" },
  qris: { label: "QRIS", icon: "📱" },
  transfer: { label: "Transfer", icon: "🏦" },
  card: { label: "Kartu", icon: "💳" },
} as const;

// User roles
export const USER_ROLES = {
  guest: { label: "Guest", color: "gray" },
  pembeli: { label: "Pembeli", color: "blue" },
  kasir: { label: "Kasir", color: "green" },
  admin: { label: "Admin", color: "purple" },
} as const;

// Customization options
export const ICE_LEVELS = {
  no_ice: "Tanpa Es",
  less: "Es Sedikit",
  normal: "Es Normal",
} as const;

export const SWEETNESS_LEVELS = {
  no_sugar: "Tanpa Gula",
  less: "Gula Sedikit",
  normal: "Gula Normal",
  extra: "Extra Manis",
} as const;

// Tax rate
export const TAX_RATE = 0.10; // 10%

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Storage keys
export const STORAGE_KEYS = {
  AUTH: "auth-storage",
  CART: "cart-storage",
  THEME: "theme",
  LANGUAGE: "language",
} as const;

// Routes
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  MENU: "/menu",
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDERS: "/orders",
  PROFILE: "/profile",
  ADMIN: "/admin",
  ADMIN_PRODUCTS: "/admin/products",
  ADMIN_USERS: "/admin/users",
  ADMIN_ANALYTICS: "/admin/analytics",
  CASHIER: "/cashier",
} as const;

// Breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;
