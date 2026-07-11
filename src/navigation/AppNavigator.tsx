import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { HomeDirectorySkeleton } from "../components/Skeleton";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import BootsplashScreen from "../screens/BootsplashScreen";
import { applyOtaUpdateWithSplash } from "../utils/otaUpdateFlow";

/**
 * AppNavigator - Main navigation router
 *
 * Conditionally renders:
 * - AuthNavigator (Login, VerificationCode, Welcome, Profile) if user is not authenticated
 * - MainNavigator (all app screens) if user is authenticated and profile completed
 *
 * OTA: on main-app entry, check for a JS update; if available, Bootsplash runs while
 * the bundle downloads, then the app reloads. Branded bootsplash still runs after login.
 */
export default function AppNavigator() {
  const {
    isAuthenticated,
    isLoading,
    hasCompletedProfile,
    showBootsplash,
    dismissBootsplash,
  } = useAuth();

  const [otaApplying, setOtaApplying] = useState(false);

  const authNavigator = useMemo(() => <AuthNavigator />, []);
  const mainNavigator = useMemo(() => <MainNavigator />, []);

  useEffect(() => {
    if (!isAuthenticated || !hasCompletedProfile || isLoading) {
      return;
    }

    let cancelled = false;

    void applyOtaUpdateWithSplash({
      onSplashStart: () => {
        if (!cancelled) {
          setOtaApplying(true);
        }
      },
      onSplashEnd: () => {
        if (!cancelled) {
          setOtaApplying(false);
        }
      },
    });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, hasCompletedProfile, isLoading]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-white">
        <HomeDirectorySkeleton fullScreen />
      </View>
    );
  }

  if (isAuthenticated && hasCompletedProfile) {
    const splashVisible = showBootsplash || otaApplying;
    const brandedOnly = showBootsplash && !otaApplying;

    return (
      <>
        {mainNavigator}
        <BootsplashScreen
          visible={splashVisible}
          autoComplete={brandedOnly}
          onComplete={dismissBootsplash}
        />
      </>
    );
  }

  return authNavigator;
}
