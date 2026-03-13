import * as Sentry from "@sentry/react-native";

/** Sentry tags for filtering (e.g. validation vs network vs server). */
export const ERROR_TAGS = {
  VALIDATION: "validation",
  NETWORK: "network",
  SERVER: "server",
} as const;

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
  Sentry.captureException(error, {
    extra: context ?? {},
    tags: tags ?? {},
  });
}
