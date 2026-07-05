import * as Sentry from "@sentry/react-native";
import Constants from "expo-constants";

const SENTRY_DSN =
  (Constants?.expoConfig?.extra as Record<string, string> | undefined)
    ?.SENTRY_DSN ??
  process.env.EXPO_PUBLIC_SENTRY_DSN ??
  "";

/**
 * Response codes from {@link ApiClientError} (and axios no-response → 0).
 * We avoid sending these to Sentry: they are expected user/network/client issues,
 * not app bugs. Re-enable locally by temporarily returning false here while debugging.
 */
function getApiClientResponseCode(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const e = error as Record<string, unknown>;
  if (e.name !== "ApiClientError") return undefined;
  if (typeof e.responseCode === "number") return e.responseCode;
  if (typeof e.statusCode === "number") return e.statusCode;
  return undefined;
}

/**
 * True for API errors that should not inflate Sentry volume:
 * - 0: no response (network offline, timeout, DNS)
 * - 4xx: validation, not found, conflict, auth (expected or user-driven)
 *
 * Still reported: 5xx, JS crashes, React render errors, native crashes.
 */
export function shouldOmitFromSentry(error: unknown): boolean {
  const code = getApiClientResponseCode(error);
  if (code === undefined) return false;
  if (code === 0) return true;
  if (code >= 400 && code < 500) return true;
  return false;
}

function beforeSend(event: any, hint: any): any {
  if (event?.tags?.force_report === "true") {
    return event;
  }
  if (shouldOmitFromSentry(hint?.originalException)) {
    return null;
  }
  return event;
}

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
    release: Constants.expoConfig?.version
      ? `africa-startup-festival@${Constants.expoConfig.version}`
      : undefined,
    integrations: [
      // Sentry's default integrations; sentry-expo adds source map support
    ],
    tracesSampleRate: 0.2,
    beforeSend,
  });
}

export { Sentry };
