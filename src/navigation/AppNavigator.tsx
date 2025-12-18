import React, { useMemo } from "react";
import { View, ActivityIndicator } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import ProfileScreen from "../screens/ProfileScreen";
import type { RootStackParamList } from "./types";

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * AppNavigator - Main navigation router
 *
 * Conditionally renders:
 * - AuthNavigator (Login, VerificationCode, Welcome, Profile) if user is not authenticated
 * - MainNavigator (all app screens) if user is authenticated and profile completed
 *
 * Flow:
 * 1. First-time users → Login (email) → VerificationCode → Welcome (tickets) → Profile Completion → Main App
 * 2. Returning users → Check auth state → Login if needed → Main App
 * 3. Authenticated users → Direct to Main App
 */
export default function AppNavigator() {
  const { isAuthenticated, isLoading, hasCompletedProfile, user } = useAuth();

  // Memoize navigators to prevent recreation on every render (which would reset navigation state)
  // Must be called before any conditional returns to follow Rules of Hooks
  const authNavigator = useMemo(() => <AuthNavigator />, []);
  const mainNavigator = useMemo(() => <MainNavigator />, []);

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1BB273" />
      </View>
    );
  }

  // If user is authenticated and profile completed, show main app
  if (isAuthenticated && hasCompletedProfile) {
    return mainNavigator;
  }

  // For all other cases (not authenticated, verified but no profile, etc.)
  // Let AuthNavigator handle the entire flow: Login → VerificationCode → Welcome → Profile
  // AuthNavigator contains all these screens and will navigate between them
  return authNavigator;
}
