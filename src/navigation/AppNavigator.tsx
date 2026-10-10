import React, { useEffect, useMemo, useState } from "react";
import { View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { HomeScreenSkeleton } from "../components/Skeleton";
import AuthNavigator from "./AuthNavigator";
import MainNavigator from "./MainNavigator";
import BootsplashScreen from "../screens/BootsplashScreen";
import { applyOtaUpdateWithSplash } from "../utils/otaUpdateFlow";
import AppUpdateGate from "../components/AppUpdateGate";

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
  const [otaCheckComplete, setOtaCheckComplete] = useState(false);

  const authNavigator = useMemo(() => <AuthNavigator />, []);
  const mainNavigator = useMemo(() => <MainNavigator />, []);

  useEffect(() => {
    if (!isAuthenticated || !hasCompletedProfile || isLoading) {
      setOtaCheckComplete(false);
      return;
    }

    let cancelled = false;

    void (async () => {
      await applyOtaUpdateWithSplash({
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
      if (!cancelled) {
        setOtaCheckComplete(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, hasCompletedProfile, isLoading]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface">
        <HomeScreenSkeleton />
      </View>
    );
  }

  if (isAuthenticated && hasCompletedProfile) {
    const splashVisible = showBootsplash || otaApplying;
    const brandedOnly = showBootsplash && !otaApplying;

    return (
      <>
        {mainNavigator}
        <AppUpdateGate
          active={otaCheckComplete && !splashVisible}
          delayMs={4000}
        />
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
