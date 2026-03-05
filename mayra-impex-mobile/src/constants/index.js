// Colors - Modern Premium Palette
export const COLORS = {
  // Primary Colors (Purple/Indigo Theme - Premium & Modern)
  primary: "#6366f1", // Vibrant indigo
  primaryDark: "#4338ca", // Deep indigo
  primaryLight: "#818cf8", // Light indigo

  // Secondary Colors
  secondary: "#8b5cf6", // Purple
  secondaryLight: "#a78bfa", // Light purple

  // Accent Colors
  accent: "#f59e0b", // Amber
  accentLight: "#fbbf24", // Light amber
  accentDark: "#d97706", // Dark amber

  // Status Colors
  success: "#10b981", // Emerald green
  error: "#ef4444", // Red
  warning: "#f59e0b", // Amber
  info: "#3b82f6", // Blue

  // Gradient Colors
  gradientStart: "#6366f1", // Indigo
  gradientMiddle: "#8b5cf6", // Purple
  gradientEnd: "#d946ef", // Fuchsia

  // Neutral Colors
  white: "#ffffff",
  black: "#000000",
  gray: "#6b7280",
  lightGray: "#f3f4f6",
  darkGray: "#374151",
  mediumGray: "#9ca3af",

  // Background Colors
  background: "#ffffff",
  backgroundDark: "#0f172a", // Navy dark
  cardBackground: "#ffffff",
  cardBackgroundAlt: "#f9fafb",
  overlay: "rgba(15, 23, 42, 0.5)",

  // Text Colors
  text: "#111827", // Almost black
  textLight: "#6b7280", // Medium gray
  textDark: "#030712", // Black
  textWhite: "#ffffff",

  // Border Colors
  border: "#e5e7eb",
  borderDark: "#374151",
  borderLight: "#f3f4f6",

  // Shadow Colors
  shadow: "rgba(0, 0, 0, 0.1)",
  shadowDark: "rgba(0, 0, 0, 0.25)",
};

// Typography
export const FONTS = {
  regular: "System",
  medium: "System",
  bold: "System",
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// Border Radius
export const RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadows
export const SHADOWS = {
  small: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// Order Status
export const ORDER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const ORDER_STATUS_COLORS = {
  pending: COLORS.warning,
  approved: COLORS.success,
  rejected: COLORS.error,
};

export const ORDER_STATUS_LABELS = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

// User Roles
export const USER_ROLES = {
  ADMIN: "admin",
  CUSTOMER: "customer",
};

// API Configuration
export const API_CONFIG = {
  timeout: 30000,
  retries: 3,
};

// Pagination
export const PAGINATION = {
  defaultLimit: 20,
  defaultPage: 1,
};
