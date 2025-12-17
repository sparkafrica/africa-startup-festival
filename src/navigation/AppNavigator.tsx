import React from "react";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";

/**
 * AppNavigator - Main navigation router
 *
 * Conditionally renders:
 * - AuthNavigator (Onboarding, Login, Signup) if user is not authenticated
 * - MainNavigator (all app screens) if user is authenticated
 *
 * Flow:
 * 1. First-time users → Onboarding → Login/Signup → Main App
 * 2. Returning users → Check auth state → Login if needed → Main App
 * 3. Authenticated users → Direct to Main App
 */
export default function AppNavigator() {
  const { isAuthenticated, isLoading, hasCompletedOnboarding } = useAuth();

  // Show loading spinner while checking auth state
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#1BB273" />
      </View>
    );
  }

  // If user is authenticated, show main app
  if (isAuthenticated) {
    return <MainNavigator />;
  }

  // If not authenticated, show auth flow
  // AuthNavigator will handle showing Onboarding vs Login based on hasCompletedOnboarding
  return <AuthNavigator />;
}
