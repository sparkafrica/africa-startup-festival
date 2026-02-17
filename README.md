# Africa Technology Expo
A modern, production-ready React Native mobile application for the Africa Technology Expo—event management, networking, and attendee engagement. Built with Expo, TypeScript, and NativeWind for a seamless cross-platform experience.

## 📱 Overview

Africa Technology Expo is the event app that enables attendees to:

- Browse event schedules and sessions
- Connect with other attendees, speakers, and partners
- Request and manage meetings
- Scan and manage tickets via QR codes
- View exhibitor and company profiles
- Leave feedback on sessions
- Manage personal profiles and connections

## ✨ Features

### Core Functionality

- **Event Schedule**: Browse sessions, filter by stage/time, and add events to personal schedule
- **Attendee Networking**: Discover and connect with other attendees, speakers, and partners
- **Meeting Management**: Request physical or virtual meetings with detailed scheduling
- **QR Code Tickets**: Scan, transfer, and manage event tickets with QR code functionality
- **Company Profiles**: View detailed information about exhibitors and partners
- **Speaker Profiles**: Explore speaker bios, interests, and speaking sessions
- **Notifications**: Real-time updates for meeting requests, time changes, and connections
- **Profile Management**: Comprehensive personal and company profile editing
- **Feedback System**: Leave feedback on sessions and events

### User Experience

- **Smooth Animations**: Seamless drag-to-close modals with spring animations
- **Modern UI**: Clean, intuitive interface built with NativeWind (Tailwind CSS)
- **Type-Safe**: Full TypeScript support for better developer experience
- **Responsive Design**: Optimized for iOS, Android, and Web platforms
- **Custom Fonts**: Inter and Roboto font families for consistent typography

## 🛠 Tech Stack

### Core Framework

- **Expo SDK 54** - React Native framework for cross-platform development
- **React 19.1.0** - UI library
- **React Native 0.81.5** - Mobile framework
- **TypeScript 5.9.2** - Type safety and enhanced developer experience

### Navigation & Routing

- **@react-navigation/native** (^6.1.18) - Navigation library
- **@react-navigation/native-stack** (^6.11.0) - Stack navigator
- **react-native-screens** (~4.16.0) - Native screen management
- **react-native-safe-area-context** (~5.6.0) - Safe area handling

### Styling & UI

- **NativeWind** (^2.0.11) - Tailwind CSS for React Native
- **Tailwind CSS** (3.3.2) - Utility-first CSS framework
- **react-native-svg** (15.12.1) - SVG support
- **expo-linear-gradient** (~15.0.8) - Gradient components

### Animations & Gestures

- **react-native-reanimated** (~4.1.1) - High-performance animations
- **react-native-gesture-handler** (~2.28.0) - Gesture recognition

### Fonts

- **expo-font** (~14.0.0) - Custom font loading
- **@expo-google-fonts/inter** (^0.3.0) - Inter font family
- **@expo-google-fonts/roboto** (^0.3.0) - Roboto font family

### Additional Libraries

- **react-native-web** (^0.21.0) - Web platform support
- **react-native-deck-swiper** (^2.0.19) - Card swiping functionality

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher recommended)
- **npm** or **yarn** package manager
- **Expo CLI** (installed globally: `npm install -g expo-cli`)
- **iOS Simulator** (for iOS development on macOS)
- **Android Studio** (for Android development)
- **Expo Go** app on your physical device (for testing)

## 🚀 Getting Started

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start the development server**

   ```bash
   npm start
   ```

   This will open the Expo DevTools. You can then:

   - Press `i` to open iOS simulator
   - Press `a` to open Android emulator
   - Scan the QR code with Expo Go app on your device

### Running on Different Platforms

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web

# Start with tunnel mode (for devices on different networks)
npm run start-tunnel
```

## 📁 Project Structure

```
Africa Technology Expo/
├── src/
│   ├── assets/              # Images, logos, and static assets
│   │   ├── images/          # Image files
│   │   └── logos/           # Company/exhibitor logos
│   ├── components/          # Reusable UI components
│   │   ├── AttendeeCard.tsx
│   │   ├── BottomNavigation.tsx
│   │   ├── EventCard.tsx
│   │   ├── EventViewModal.tsx
│   │   ├── FilterModal.tsx
│   │   ├── HeaderBar.tsx
│   │   ├── LeaveFeedbackModal.tsx
│   │   ├── RequestMeetingModal.tsx
│   │   └── ...              # Other components
│   ├── constants/           # App-wide constants
│   ├── hooks/              # Custom React hooks
│   ├── navigation/         # Navigation configuration
│   │   ├── AppNavigator.tsx # Main navigation setup
│   │   └── types.ts        # Navigation type definitions
│   ├── screens/            # Screen components
│   │   ├── HomeScreen.tsx
│   │   ├── ScheduleScreen.tsx
│   │   ├── AttendeesScreen.tsx
│   │   ├── MeetingsScreen.tsx
│   │   ├── ConnectionsScreen.tsx
│   │   ├── ProfileScreen.tsx
│   │   ├── ScanQRScreen.tsx
│   │   └── ...             # Other screens
│   └── theme/              # Design system tokens
│       ├── theme.ts        # TypeScript theme definitions
│       └── theme.js        # JavaScript theme (for Tailwind)
├── App.tsx                  # Root component
├── app.json                 # Expo configuration
├── package.json             # Dependencies and scripts
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── README.md                # This file
```

## 🎨 Design System

The app uses a centralized design system defined in `src/theme/theme.ts`:

- **Colors**: Primary, secondary, neutral, and semantic color palettes
- **Typography**: Font families (Inter, Roboto), sizes, weights, and line heights
- **Spacing**: Consistent spacing scale for padding and margins
- **Border Radius**: Standardized corner radius values
- **Shadows**: Predefined shadow presets
- **Gradients**: Reusable gradient definitions

All theme values are automatically available in NativeWind classes via `tailwind.config.js`.

## 📱 Key Screens

### Main Navigation

- **Home**: Dashboard with event overview, quick actions, and featured content
- **Attendees**: Browse and search attendees with filtering options
- **Schedule**: View event schedule with stage filtering and time zones
- **Meetings**: Manage meeting requests and scheduled meetings
- **Connections**: View and manage your network connections

### Detail Screens

- **Company Detail**: Exhibitor/partner profiles with offers, social links, and positions
- **Speaker Detail**: Speaker profiles with bio, interests, and speaking sessions
- **Event Detail**: Detailed event information with speakers and description

### Utility Screens

- **Profile**: Personal and company profile management
- **Scan QR**: QR code scanning for tickets with transfer functionality
- **Notifications**: View and manage notifications
- **Contact**: Contact support and send messages

## 🔧 Development

### Available Scripts

```bash
npm start              # Start Expo development server
npm run start-tunnel   # Start with tunnel mode (for remote devices)
npm run ios           # Run on iOS simulator
npm run android       # Run on Android emulator
npm run web           # Run on web browser
```

### Code Style Guidelines

- **Styling**: Use NativeWind classes exclusively (no inline styles)
- **Components**: Extract reusable UI to `src/components/`
- **Types**: Define TypeScript types for all props and data structures
- **Navigation**: Use typed navigation hooks from `@react-navigation/native`
- **Theme**: Reference theme values via Tailwind classes when possible

### Modal Animations

All modals feature smooth drag-to-close functionality with:

- Spring animations (`tension: 65, friction: 11`)
- 100px drag threshold
- Smooth entrance animations
- Consistent behavior across all modals

## 🎯 Features in Detail

### Meeting System

- Request physical or virtual meetings
- Select date, time, and location/table
- 24-hour response window
- Meeting type selection (Physical/Virtual)

### QR Code Tickets

- Scan QR codes for ticket validation
- Transfer tickets to other attendees
- Edit assigned ticket information
- View ticket details and status

### Networking

- Browse attendees, speakers, and partners
- View detailed profiles with interests and tags
- Request connections
- Filter by various criteria

### Schedule Management

- Browse events by stage and time
- Filter by date and time slots
- Add events to personal schedule
- View event details with speakers and descriptions

## 🔐 Environment Setup

The app is configured for Expo development. For production builds:

1. Configure EAS Build (see `app.json` for project ID)
2. Set up environment variables if needed
3. Configure API endpoints (currently using mock data)

## 📝 Notes

- The app currently uses mock data for demonstration purposes
- API integration points are marked with `TODO` comments
- All form fields start empty (no pre-filled mock data)
- Modals use consistent drag-to-close animations

## 🤝 Contributing

This is a private project. For contributions, please contact the project owner.

## 📄 License

This project is private and proprietary.

## 👥 Credits

Built with ❤️ using Expo and React Native.

---

**Version**: 1.0.0  
**Last Updated**: 2024
