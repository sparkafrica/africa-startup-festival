import React, { useMemo } from "react";
import { View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { HomeDirectorySkeleton } from "../components/Skeleton";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import BootsplashScreen from "../screens/BootsplashScreen";

/**
 * AppNavigator - Main navigation router
 *
 * Conditionally renders:
 * - AuthNavigator (Login, VerificationCode, Welcome, Profile) if user is not authenticated
 * - MainNavigator (all app screens) if user is authenticated and profile completed
 *
 * Flow:
 * 1. First-time users → Login (email) → VerificationCode → Welcome (tickets) → Profile Completion → Bootsplash → Main App
 * 2. Returning users → Check auth state → Login if needed → Bootsplash → Main App
 * 3. Authenticated users → Direct to Main App
 */
export default function AppNavigator() {
  const {
    isAuthenticated,
    isLoading,
    hasCompletedProfile,
    showBootsplash,
    dismissBootsplash,
  } = useAuth();

  const authNavigator = useMemo(() => <AuthNavigator />, []);
  const mainNavigator = useMemo(() => <MainNavigator />, []);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <HomeDirectorySkeleton fullScreen />
      </View>
    );
  }

  if (isAuthenticated && hasCompletedProfile) {
    return (
      <>
        {mainNavigator}
        <BootsplashScreen
          visible={showBootsplash}
          onComplete={dismissBootsplash}
        />
      </>
    );
  }

  return authNavigator;
}
