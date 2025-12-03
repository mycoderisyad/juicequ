/**
 * API-related types.
 */

export interface ApiError {
  detail: string;
  error_code?: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface MessageResponse {
  message: string;
}

export interface SuccessResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
}

export interface ApiRequestConfig {
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: "asc" | "desc";
}
