import * as Sentry from "@sentry/react-native";

export function logError(error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error(error);
    if (context) console.error("Context:", context);
  }
  Sentry.captureException(error, { extra: context ?? {} });
}
