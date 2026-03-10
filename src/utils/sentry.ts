import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN = process.env.EXPO_PUBLIC_SENTRY_DSN || "";

export function initSentry() {
  if (!SENTRY_DSN) {
    if (__DEV__) {
      console.warn("[Sentry] No DSN configured, skipping init");
    }
    return;
  }

  Sentry.init({
    dsn: SENTRY_DSN,
    enabled: !__DEV__,
    debug: false,
    environment: __DEV__ ? "development" : "production",
    release: Constants.expoConfig?.extra?.eas?.projectId
      ? `spark@${Constants.expoConfig?.version ?? "1.0.0"}`
      : undefined,
    integrations: [
      // Sentry's default integrations; sentry-expo adds source map support
    ],
    tracesSampleRate: 0.2,
  });
}

export { Sentry };