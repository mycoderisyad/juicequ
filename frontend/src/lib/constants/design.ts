export const COLORS = {
  primary: {
    DEFAULT: "emerald-600",
    hover: "emerald-700",
    light: "emerald-50",
    text: "emerald-600",
  },
  secondary: {
    DEFAULT: "stone-900",
    hover: "stone-800",
  },
  success: {
    DEFAULT: "green-600",
    hover: "green-700",
    light: "green-50",
    text: "green-700",
  },
  error: {
    DEFAULT: "red-600",
    hover: "red-700",
    light: "red-50",
    text: "red-500",
  },
  warning: {
    DEFAULT: "yellow-600",
    light: "yellow-50",
    text: "yellow-700",
  },
} as const;

export const RADIUS = {
  button: "rounded-full",
  card: "rounded-3xl",
  input: "rounded-xl",
  badge: "rounded-full",
  modal: "rounded-3xl",
} as const;

export const SHADOWS = {
  card: "shadow-xl shadow-gray-200/50",
  button: "shadow-lg",
  input: "shadow-sm",
} as const;

