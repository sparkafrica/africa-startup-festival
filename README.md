# Spark Event Platform

A production-ready React Native mobile app built with Expo, TypeScript, NativeWind, and React Navigation.

## Tech Stack

- **Expo** - React Native framework
- **TypeScript** - Type safety
- **NativeWind** - Tailwind CSS for React Native
- **React Navigation** - Navigation library
- **React Native SVG** - SVG support
- **Expo Font** - Custom font loading

## Project Structure

```
src/
  ├── screens/          # All screen components
  ├── components/       # Reusable UI components
  ├── navigation/       # Navigation configuration
  ├── hooks/           # Custom React hooks
  ├── constants/       # App constants
  ├── theme/           # Design tokens (colors, typography, spacing)
  └── assets/          # Images, fonts, SVGs
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on your platform:
```bash
npm run ios      # iOS
npm run android  # Android
npm run web      # Web
```

## Design System

All design tokens are defined in `src/theme/theme.ts`:
- Colors (primary, secondary, neutral, semantic)
- Typography (font sizes, weights, line heights)
- Spacing (consistent spacing scale)
- Border radiuses
- Shadows
- Gradients

## Navigation

Navigation is configured in `src/navigation/AppNavigator.tsx` with TypeScript support.

Screens:
- Onboarding
- Login / Signup
- Home
- Event Details
- Ticket
- Favorites
- Profile
- Search

## Styling Guidelines

- Use NativeWind classes only (no inline styles)
- Import theme values from `src/theme/theme.ts` when needed
- Extract reusable components to `src/components/`
- Maintain pixel-perfect Figma matching

## Development Workflow

1. Analyze Figma design
2. Extract reusable components
3. Build screen with NativeWind
4. Match Figma pixel-perfect
5. Optimize and refactor

