import * as Sentry from "@sentry/react-native";
import { shouldOmitFromSentry } from "./sentry";

/** Sentry tags for filtering (e.g. validation vs network vs server). */
export const ERROR_TAGS = {
  VALIDATION: "validation",
  NETWORK: "network",
  SERVER: "server",
} as const;

/**
 * Logs locally in dev; sends to Sentry in production except for routine
 * {@link ApiClientError} (network + 4xx). Use {@link forceLogErrorToSentry} if a 4xx must be tracked.
 */
export function logError(
  error: unknown,
  context?: Record<string, unknown>,
  tags?: Record<string, string>
) {
  if (__DEV__) {
    console.error(error);
    if (context) console.error("Context:", context);
    if (tags) console.error("Tags:", tags);
  }
  if (shouldOmitFromSentry(error)) return;
  Sentry.captureException(error, {
    extra: context ?? {},
    tags: tags ?? {},
  });
}

/** Bypasses client/network omission — use sparingly (e.g. suspected backend bug on 400). */
export function forceLogErrorToSentry(
  error: unknown,
  context?: Record<string, unknown>,
  tags?: Record<string, string>
) {
  if (__DEV__) {
    console.error("[force Sentry]", error);
    if (context) console.error("Context:", context);
  }
  Sentry.captureException(error, {
    extra: context ?? {},
    tags: { ...tags, force_report: "true" },
  });
}
