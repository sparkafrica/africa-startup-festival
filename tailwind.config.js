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
    // Replace defaults so rounded-* is pointed app-wide (full stays circular).
    // `extend` alone can leave Tailwind's default radii active in NativeWind.
    borderRadius: {
      none: 0,
      sm: 0,
      DEFAULT: 0,
      md: 0,
      lg: 0,
      xl: 0,
      "2xl": 0,
      "3xl": 0,
      full: borderRadius.full,
    },
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
      fontFamily: {
        // Inter Display - ONLY font family (no fallbacks)
        sans: typography.fontFamily.sans,
        inter: typography.fontFamily.inter,
        "inter-light": typography.fontFamily["inter-light"],
        "inter-medium": typography.fontFamily["inter-medium"],
        "inter-semibold": typography.fontFamily["inter-semibold"],
        "inter-bold": typography.fontFamily["inter-bold"],
      },
      fontSize: typography.fontSize,
      fontWeight: typography.fontWeight,
      lineHeight: typography.lineHeight,
    },
  },
  plugins: [
    // Plugin to automatically map font-weight classes to Inter Display font families
    function ({ addUtilities, theme }) {
      const newUtilities = {
        // Ensure all text uses Inter Display by default (no fallbacks)
        Text: {
          fontFamily: typography.fontFamily.sans,
        },
        // Map font-light to use InterDisplay-Light font family
        ".font-light": {
          fontFamily: typography.fontFamily["inter-light"],
        },
        // Map font-medium to use InterDisplay-Medium font family
        ".font-medium": {
          fontFamily: typography.fontFamily["inter-medium"],
        },
        // Map font-semibold to use InterDisplay-SemiBold font family
        ".font-semibold": {
          fontFamily: typography.fontFamily["inter-semibold"],
        },
        // Map font-bold to use InterDisplay-Bold font family
        ".font-bold": {
          fontFamily: typography.fontFamily["inter-bold"],
        },
        // Map font-normal to use InterDisplay-Regular
        ".font-normal": {
          fontFamily: typography.fontFamily.sans,
        },
      };
      addUtilities(newUtilities);
    },
  ],
};
