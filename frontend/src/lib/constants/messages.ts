export const AUTH_MESSAGES = {
  LOGIN_FAILED: "Invalid credentials",
  REGISTER_FAILED: "Registration failed",
  PASSWORD_MISMATCH: "Passwords do not match",
  GOOGLE_LOGIN_FAILED: "Google login is not available",
  GOOGLE_INIT_FAILED: "Failed to initiate Google login",
  FORGOT_PASSWORD_FAILED: "Failed to send reset email",
  RESET_PASSWORD_FAILED: "Failed to reset password",
  VERIFY_EMAIL_FAILED: "Failed to verify email",
  EMAIL_VERIFIED: "Email verified. You can sign in now.",
  VERIFY_EMAIL_PROMPT: "Check your email for a verification link.",
  PASSWORD_RESET_SUCCESS: "Password reset successfully. You can sign in now.",
  FORGOT_PASSWORD_SUCCESS: "If that email is registered, we have sent a reset link.",
} as const;

export const CART_MESSAGES = {
  VOUCHER_REQUIRED: "Enter voucher code",
  VOUCHER_INVALID: "Invalid voucher",
  VOUCHER_VALIDATE_FAILED: "Failed to validate voucher",
  CART_EMPTY: "Your cart is empty",
} as const;

export const ORDER_MESSAGES = {
  ORDER_FAILED: "Failed to place order. Please try again.",
  PREORDER_DATE_REQUIRED: "Select pickup date for pre-order",
  PREORDER_TIME_REQUIRED: "Select pickup time for pre-order",
} as const;

export const COMMON_MESSAGES = {
  GENERIC_ERROR: "Something went wrong",
  NETWORK_ERROR: "Network error. Please check your connection.",
} as const;
