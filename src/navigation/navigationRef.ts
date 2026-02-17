/**
 * Root navigation ref for imperative navigation (e.g. push tap handling).
 * Use with NavigationContainer ref prop.
 */
import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

export const navigationRef =
  createNavigationContainerRef<RootStackParamList>();

export function isReady() {
  return navigationRef.isReady();
}

export function navigate(
  name: keyof RootStackParamList,
  params?: object,
) {
  if (!navigationRef.isReady()) return;
  // Avoid "NAVIGATE to Home was not handled" when current navigator is Auth (no Home screen)
  if (name === "Home") {
    if (!hasHomeScreen()) return;
  }
  (navigationRef.navigate as any)(name, params);
}

/** True if the root navigator has a "Home" screen (i.e. we're in Main app). */
export function hasHomeScreen(): boolean {
  if (!navigationRef.isReady()) return false;
  const state = navigationRef.getRootState();
  return Boolean(state?.routes?.some((r: { name?: string }) => r.name === "Home"));
}
