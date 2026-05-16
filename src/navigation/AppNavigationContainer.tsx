/**
 * NavigationContainer with auth-aware deeplink handling.
 */
import React, { useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";
import AppNavigator from "./AppNavigator";
import { navigationRef } from "./navigationRef";
import { createNavigationAnalyticsHandlers } from "../utils/analytics";
import { createLinkingConfig } from "./linking";
import DeeplinkReplayHandler from "../components/DeeplinkReplayHandler";
import PushTapHandler from "../components/PushTapHandler";

export default function AppNavigationContainer() {
  const { isAuthenticated, hasCompletedProfile, isLoading } = useAuth();
  const deepLinksEnabled =
    isAuthenticated && hasCompletedProfile && !isLoading;

  const linking = useMemo(
    () => createLinkingConfig(deepLinksEnabled),
    [deepLinksEnabled]
  );

  const { onReady: onNavigationAnalyticsReady, onStateChange: onNavigationAnalyticsStateChange } =
    useMemo(
      () =>
        createNavigationAnalyticsHandlers(() =>
          navigationRef.isReady() ? navigationRef.getRootState() : undefined
        ),
      []
    );

  return (
    <>
      <PushTapHandler />
      <DeeplinkReplayHandler />
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={onNavigationAnalyticsReady}
        onStateChange={onNavigationAnalyticsStateChange}
      >
        <AppNavigator />
        <StatusBar style="auto" />
      </NavigationContainer>
    </>
  );
}
