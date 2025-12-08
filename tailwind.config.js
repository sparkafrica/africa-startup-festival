/** @type {import('tailwindcss').Config} */
const {
  colors,
  spacing,
  borderRadius,
  typography,
} = require("./src/theme/theme.js");

module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: colors.primary,
        secondary: colors.secondary,
        neutral: colors.neutral,
        success: colors.success,
        error: colors.error,
        warning: colors.warning,
        info: colors.info,
        background: colors.background,
        surface: colors.surface,
        text: colors.text,
      },
      spacing: spacing,
      borderRadius: borderRadius,
      fontFamily: typography.fontFamily,
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
    },
  },
  plugins: [],
};
