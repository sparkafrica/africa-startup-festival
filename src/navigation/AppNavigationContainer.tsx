/**
 * NavigationContainer with auth-aware deeplink handling.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  NavigationContainer,
  type NavigationState,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "../context/AuthContext";
import AppNavigator from "./AppNavigator";
import { hasHomeScreen, navigationRef } from "./navigationRef";
import { createNavigationAnalyticsHandlers, getActiveRouteName } from "../utils/analytics";
import { createLinkingConfig } from "./linking";
import DeeplinkReplayHandler from "../components/DeeplinkReplayHandler";
import PushTapHandler from "../components/PushTapHandler";
import FloatingBottomNavHost from "./FloatingBottomNavHost";

export default function AppNavigationContainer() {
  const { isAuthenticated, hasCompletedProfile, isLoading } = useAuth();
  const deepLinksEnabled =
    isAuthenticated && hasCompletedProfile && !isLoading;

  const [activeRouteName, setActiveRouteName] = useState("");
  const [mainStackMounted, setMainStackMounted] = useState(false);

  const syncNavigationRoute = useCallback(
    (state?: NavigationState | Readonly<NavigationState>) => {
      const rootState =
        state ??
        (navigationRef.isReady() ? navigationRef.getRootState() : undefined);
      const name = getActiveRouteName(rootState) ?? "";
      setActiveRouteName(name);
      setMainStackMounted(hasHomeScreen());
    },
    [],
  );

  const linking = useMemo(
    () => createLinkingConfig(deepLinksEnabled),
    [deepLinksEnabled],
  );

  const { onReady: onNavigationAnalyticsReady, onStateChange: onNavigationAnalyticsStateChange } =
    useMemo(
      () =>
        createNavigationAnalyticsHandlers(() =>
          navigationRef.isReady() ? navigationRef.getRootState() : undefined,
        ),
      [],
    );

  const handleNavigationReady = useCallback(() => {
    onNavigationAnalyticsReady();
    syncNavigationRoute();
  }, [onNavigationAnalyticsReady, syncNavigationRoute]);

  const handleNavigationStateChange = useCallback(
    (state: Readonly<NavigationState> | undefined) => {
      onNavigationAnalyticsStateChange(state);
      syncNavigationRoute(state);
    },
    [onNavigationAnalyticsStateChange, syncNavigationRoute],
  );

  // Main stack mounts after auth bootstrap — onStateChange may not fire until
  // the first user navigation unless we sync when the main app becomes ready.
  useEffect(() => {
    if (!isAuthenticated || !hasCompletedProfile || isLoading) {
      setMainStackMounted(false);
      return;
    }

    syncNavigationRoute();
    const frame = requestAnimationFrame(() => syncNavigationRoute());
    const timer = setTimeout(() => syncNavigationRoute(), 0);
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
    };
  }, [
    isAuthenticated,
    hasCompletedProfile,
    isLoading,
    syncNavigationRoute,
  ]);

  return (
    <>
      <PushTapHandler />
      <DeeplinkReplayHandler />
      <NavigationContainer
        ref={navigationRef}
        linking={linking}
        onReady={handleNavigationReady}
        onStateChange={handleNavigationStateChange}
      >
        <AppNavigator />
        <FloatingBottomNavHost
          routeName={activeRouteName}
          mainStackMounted={mainStackMounted}
        />
        <StatusBar style="auto" />
      </NavigationContainer>
    </>
  );
}
