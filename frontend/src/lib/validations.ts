/**
 * Validation schemas using Zod.
 * Centralized form validation.
 */
import { z } from "zod";

// Email validation
const emailSchema = z
  .string()
  .min(1, "Email wajib diisi")
  .email("Format email tidak valid");

// Password validation
const passwordSchema = z
  .string()
  .min(6, "Password minimal 6 karakter")
  .max(100, "Password maksimal 100 karakter");

// Phone validation (Indonesian format)
const phoneSchema = z
  .string()
  .regex(/^(\+62|62|0)[0-9]{9,12}$/, "Format nomor telepon tidak valid")
  .optional()
  .or(z.literal(""));

// Auth schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  phone_number: phoneSchema,
}).refine((data) => data.password === data.confirmPassword, {
  message: "Password tidak sama",
  path: ["confirmPassword"],
});

export const changePasswordSchema = z.object({
  current_password: passwordSchema,
  new_password: passwordSchema,
  confirm_password: z.string(),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Password baru tidak sama",
  path: ["confirm_password"],
});

// Product schemas
export const productSchema = z.object({
  name: z.string().min(2, "Nama produk minimal 2 karakter"),
  description: z.string().optional(),
  base_price: z.number().min(0, "Harga tidak boleh negatif"),
  category_id: z.string().optional(),
  ingredients: z.string().optional(),
  calories: z.number().min(0).optional(),
  is_available: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  stock_quantity: z.number().min(0).default(100),
});

// Category schema
export const categorySchema = z.object({
  name: z.string().min(2, "Nama kategori minimal 2 karakter"),
  description: z.string().optional(),
  display_order: z.number().min(0).default(0),
  is_active: z.boolean().default(true),
});

// Order item schema
export const orderItemSchema = z.object({
  product_id: z.string().min(1, "Produk wajib dipilih"),
  size: z.enum(["small", "medium", "large"]),
  quantity: z.number().min(1, "Minimal 1 item"),
  customizations: z.object({
    ice_level: z.enum(["no_ice", "less", "normal"]).optional(),
    sweetness: z.enum(["no_sugar", "less", "normal", "extra"]).optional(),
    add_ons: z.array(z.string()).optional(),
  }).optional(),
  notes: z.string().optional(),
});

// Checkout schema
export const checkoutSchema = z.object({
  payment_method: z.enum(["cash", "qris", "transfer", "card"]),
  customer_notes: z.string().optional(),
});

// Guest checkout schema
export const guestCheckoutSchema = checkoutSchema.extend({
  guest_name: z.string().min(2, "Nama wajib diisi"),
  guest_phone: z.string().min(10, "Nomor telepon wajib diisi"),
});

// Profile update schema
export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, "Nama minimal 2 karakter"),
  phone_number: phoneSchema,
  preferences: z.string().optional(),
});

// Type exports
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProductInput = z.infer<typeof productSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type OrderItemInput = z.infer<typeof orderItemSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
export type GuestCheckoutInput = z.infer<typeof guestCheckoutSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
