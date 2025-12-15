export const COLORS = {
  primary: {
    DEFAULT: "emerald-600",
    hover: "emerald-700",
    light: "emerald-50",
    text: "emerald-600",
  },
  secondary: {
    DEFAULT: "green-600",
    hover: "green-700",
    light: "green-50",
  },
  error: {
    DEFAULT: "red-500",
    bg: "red-50",
    text: "red-500",
  },
  success: {
    DEFAULT: "emerald-600",
    bg: "emerald-50",
    text: "emerald-700",
  },
  warning: {
    DEFAULT: "yellow-500",
    bg: "yellow-50",
    text: "yellow-700",
  },
  neutral: {
    bg: "gray-50",
    border: "gray-200",
    text: "gray-900",
    textMuted: "gray-500",
  },
} as const;

export const RADIUS = {
  sm: "rounded-lg",
  md: "rounded-xl",
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  full: "rounded-full",
  card: "rounded-3xl",
  button: "rounded-full",
  input: "rounded-xl",
  modal: "rounded-3xl",
} as const;

export const SHADOWS = {
  sm: "shadow-sm",
  md: "shadow-md",
  lg: "shadow-lg",
  xl: "shadow-xl",
  card: "shadow-xl shadow-gray-200/50",
} as const;

export const SPACING = {
  section: {
    py: "py-10",
    px: "px-4",
  },
  card: {
    p: "p-6",
    pSm: "p-4",
  },
  gap: {
    xs: "gap-2",
    sm: "gap-4",
    md: "gap-6",
    lg: "gap-8",
  },
} as const;

export const BUTTON_STYLES = {
  primary:
    "bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-600",
  secondary:
    "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-600",
  outline:
    "border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 focus-visible:ring-emerald-600",
  ghost:
    "text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400",
  destructive:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
} as const;

export const INPUT_STYLES = {
  base: "w-full rounded-xl border border-gray-200 px-4 py-2.5 text-gray-900 placeholder:text-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
  error:
    "border-red-500 focus:border-red-500 focus:ring-red-500",
  disabled: "bg-gray-100 cursor-not-allowed opacity-60",
} as const;

export const CARD_STYLES = {
  base: "rounded-3xl bg-white shadow-sm",
  elevated: "rounded-3xl bg-white shadow-xl shadow-gray-200/50",
  bordered: "rounded-3xl bg-white border border-gray-200",
} as const;

