/**
 * Order-related types.
 */
import type { ProductSize } from "./product";

export type OrderStatus =
  | "pending"
  | "paid"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export type PaymentMethod = "cash" | "qris" | "transfer" | "card";

export interface OrderItem {
  id: string;
  product_id: string;
  product_name: string;
  size: ProductSize;
  quantity: number;
  unit_price: number;
  subtotal: number;
  customizations?: OrderItemCustomizations;
  notes?: string;
}

export interface OrderItemCustomizations {
  ice_level?: "no_ice" | "less" | "normal";
  sweetness?: "no_sugar" | "less" | "normal" | "extra";
  add_ons?: string[];
}

export interface Order {
  id: string;
  order_number: string;
  user_id?: string;
  guest_name?: string;
  guest_phone?: string;
  status: OrderStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  payment_method: PaymentMethod;
  customer_notes?: string;
  internal_notes?: string;
  items: OrderItem[];
  created_at: string;
  paid_at?: string;
  completed_at?: string;
}

export interface OrderCreateInput {
  items: OrderItemInput[];
  payment_method: PaymentMethod;
  customer_notes?: string;
  guest_name?: string;
  guest_phone?: string;
}

export interface OrderItemInput {
  product_id: string;
  size: ProductSize;
  quantity: number;
  customizations?: OrderItemCustomizations;
  notes?: string;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  internal_notes?: string;
}
