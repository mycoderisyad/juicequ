/**
 * Product-related types.
 */

export type ProductSize = "small" | "medium" | "large";

export interface ProductCategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
  display_order: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  base_price: number;
  image_url?: string;
  thumbnail_url?: string;
  category_id?: string;
  category?: ProductCategory;
  ingredients?: string;
  calories?: number;
  sugar_grams?: number;
  is_available: boolean;
  is_featured: boolean;
  stock_quantity: number;
  display_order: number;
  average_rating?: number;
  review_count?: number;
  order_count?: number;
}

export interface ProductPrices {
  small: number;
  medium: number;
  large: number;
}

export interface NutritionInfo {
  calories?: number;
  sugar?: number;
  protein?: number;
  fat?: number;
  fiber?: number;
  vitamins?: string[];
}

export interface ProductCreateInput {
  name: string;
  description?: string;
  base_price: number;
  category_id?: string;
  ingredients?: string;
  calories?: number;
  is_featured?: boolean;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string;
  base_price?: number;
  category_id?: string;
  ingredients?: string;
  calories?: number;
  is_available?: boolean;
  is_featured?: boolean;
  stock_quantity?: number;
}

export interface ProductFilters {
  category_id?: string;
  search?: string;
  min_price?: number;
  max_price?: number;
  is_available?: boolean;
  is_featured?: boolean;
}
