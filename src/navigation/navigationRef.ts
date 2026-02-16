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
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(name, params);
  }
}
