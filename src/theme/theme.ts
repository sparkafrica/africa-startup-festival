/**
 * Global Design Tokens
 * Extracted from Figma design system
 */

export const colors = {
  // Primary colors
  primary: {
    50: "#F0F9FF",
    100: "#E0F2FE",
    200: "#BAE6FD",
    300: "#7DD3FC",
    400: "#38BDF8",
    500: "#0EA5E9",
    600: "#0284C7",
    700: "#0369A1",
    800: "#075985",
    900: "#0C4A6E",
  },
  // Secondary colors
  secondary: {
    50: "#FDF4FF",
    100: "#FAE8FF",
    200: "#F5D0FE",
    300: "#F0ABFC",
    400: "#E879F9",
    500: "#D946EF",
    600: "#C026D3",
    700: "#A21CAF",
    800: "#86198F",
    900: "#701A75",
  },
  // Neutral colors
  neutral: {
    50: "#FAFAFA",
    100: "#F5F5F5",
    200: "#E5E5E5",
    300: "#D4D4D4",
    400: "#A3A3A3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },
  // Semantic colors
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  info: "#3B82F6",
  // Background colors
  background: "#FFFFFF",
  surface: "#F9FAFB",
  // Text colors
  text: {
    primary: "#171717",
    secondary: "#525252",
    tertiary: "#737373",
    inverse: "#FFFFFF",
  },
};

export const typography = {
  fontFamily: {
    // Inter Display - ONLY font family used throughout the app (no fallbacks)
    sans: "InterDisplay-Regular", // Default font - Inter Display Regular
    inter: "InterDisplay-Regular",
    "inter-light": "InterDisplay-Light",
    "inter-medium": "InterDisplay-Medium",
    "inter-semibold": "InterDisplay-SemiBold",
    "inter-bold": "InterDisplay-Bold",
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    "2xl": 24,
    "3xl": 30,
    "4xl": 36,
    "5xl": 48,
  },
  fontWeight: {
    normal: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
  24: 96,
};

export const borderRadius = {
  none: 0,
  sm: 0,
  base: 0,
  md: 0,
  lg: 0,
  xl: 0,
  "2xl": 0,
  "3xl": 0,
  /** Keep true circles (avatars, spinners, icon buttons). */
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  xl: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 5,
  },
};

export const brand = {
  white: "#FFFFFF",
  black: "#000000",
};

export const gradients = {
  primary: ["#0EA5E9", "#0284C7"],
  secondary: ["#D946EF", "#C026D3"],
  sunset: ["#F59E0B", "#EF4444"],
  ocean: ["#3B82F6", "#0EA5E9"],
  sparkBlack: ["#000000", "#000000"],
  sparkWhite: ["#FFFFFF", "#FFFFFF"],
  partnerGreen: ["#10B981", "#059669"], // Green gradient for Partner Offers banner
};

export const theme = {
  brand,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  gradients,
};

export default theme;
