/**
 * Environment Configuration
 *
 * Manages API base URLs and environment-specific settings.
 * Update these values based on your backend deployment.
 *
 * SPARK_API_KEY: Set via EXPO_PUBLIC_SPARK_API_KEY in .env or in app.json extra.SPARK_API_KEY.
 * Used for public endpoints that require X-SPARK-KEY header (e.g. GET /jobs/).
 */

import Constants from "expo-constants";

// Determine environment
const getEnvironment = (): "development" | "staging" | "production" => {
  // Local dev (Metro / __DEV__) → development (dev-api)
  if (__DEV__) {
    return "development";
  }

  // Store and OTA builds → production (live API). Takes effect on next app/OTA update.
  return "production";
};

const environment = getEnvironment();

/** Resolved once at load: `development` in Metro/__DEV__, else `production` (store + OTA). */
export const APP_ENVIRONMENT = environment;

// API Configuration
export const API_CONFIG = {
  development: {
    // BASE_URL: "https://api.sparkafrica.co",
    //  Development server
    // TIMEOUT: 30000,
    BASE_URL: "https://dev-api.sparkafrica.co/", // Development server
    TIMEOUT: 30000, // 30 seconds
    WS_URL: "wss://dev-api.sparkafrica.co/",
  },
  staging: {
    BASE_URL: "https://dev-api.sparkafrica.co/", // Staging server (update when staging URL is available)
    TIMEOUT: 30000,
    WS_URL: "wss://dev-api.sparkafrica.co/",
  },
  production: {
    BASE_URL: "https://api.sparkafrica.co", // Production server
    TIMEOUT: 30000,
    WS_URL: "wss://api.sparkafrica.co", // Production WebSocket URL
  },
} as const;

// Get current environment config
export const ENV = API_CONFIG[environment];

// CDN Configuration (for images, assets)
export const CDN_CONFIG = {
  development: "http://localhost:3000",
  staging: "https://cdn-staging.spark-events.com",
  production: "https://cdn.spark-events.com",
} as const;

export const CDN_BASE_URL = CDN_CONFIG[environment];

// Event Configuration
// TODO: Consider fetching current event from backend API in the future
export const EVENT_ID = 10;

// Realtime chat (Pusher)
// Public client values used to establish websocket connection.
export const PUSHER_API_KEY = "2ed4ec1984333f9e92d1";
export const PUSHER_CLUSTER = "eu";

// Spark API Key for public endpoints (e.g. GET /jobs/, partner offers). Required for Talent Board and partner offers.
// - Dev: set EXPO_PUBLIC_SPARK_API_KEY in .env (app.config.js loads it; .env is not shipped).
// - Production: EAS secret at build time (extra.SPARK_API_KEY), or fallback below so OTA can deliver the key.
//   (.env and OTA do not mix: OTA only updates JS; the key must be in the bundle for production to get it.)
const EXTRA_SPARK_KEY =
  (Constants?.expoConfig?.extra as Record<string, string> | undefined)
    ?.SPARK_API_KEY ?? "";
const ENV_SPARK_KEY =
  typeof process !== "undefined"
    ? (process.env?.EXPO_PUBLIC_SPARK_API_KEY ?? "")
    : "";

/** Production API key when extra/env are empty. OTA delivers this so production build uses prod key; dev keeps using .env. */
const PRODUCTION_SPARK_API_KEY = "fbc8ba2ab4b7f7a2159f4e38043d2c0a";

export const SPARK_API_KEY =
  ENV_SPARK_KEY ||
  EXTRA_SPARK_KEY ||
  (environment === "production" ? PRODUCTION_SPARK_API_KEY : "") ||
  "";

const SPARK_KEY_SOURCE = ENV_SPARK_KEY
  ? "process.env"
  : EXTRA_SPARK_KEY
    ? "expo.extra"
    : environment === "production" && PRODUCTION_SPARK_API_KEY
      ? "production_fallback"
      : "none";

// Upgrade ticket: backend requires new_ticket_class_id (per tier), payment_method, currency.
// Set EXPO_PUBLIC_UPGRADE_CLASS_ID_OASIS etc. in .env (get IDs from backend for the event).
type Extra = Record<string, unknown> & {
  UPGRADE_CLASS_ID_OASIS?: number;
  UPGRADE_CLASS_ID_DELEGATE?: number;
  UPGRADE_CLASS_ID_CHAIRPERSON?: number;
  UPGRADE_PAYMENT_METHOD?: string;
  UPGRADE_CURRENCY?: string;
};

export function getUpgradeTierClassId(tier: string): number | undefined {
  const extra = (Constants?.expoConfig?.extra ?? {}) as Extra;
  const t = tier.toLowerCase();
  if (t === "oasis") return extra.UPGRADE_CLASS_ID_OASIS;
  if (t === "delegate") return extra.UPGRADE_CLASS_ID_DELEGATE;
  if (t === "chairperson") return extra.UPGRADE_CLASS_ID_CHAIRPERSON;
  return undefined;
}

export function getUpgradePaymentDefaults(): {
  payment_method: string;
  currency: string;
} {
  const extra = (Constants?.expoConfig?.extra ?? {}) as Extra;
  return {
    payment_method: extra.UPGRADE_PAYMENT_METHOD ?? "free",
    currency: extra.UPGRADE_CURRENCY ?? "USD",
  };
}


/** One-time runtime fingerprint log (masked) to compare app key vs backend logs safely. */
let didLogSparkKeyFingerprint = false;

const maskKeyFingerprint = (value: string): string => {
  if (!value) return "(empty)";
  if (value.length <= 10) return `${value.slice(0, 2)}...${value.slice(-2)}`;
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
};

if (!didLogSparkKeyFingerprint) {
  didLogSparkKeyFingerprint = true;
  console.warn("[SPARK_KEY] runtime fingerprint", {
    env: environment,
    source: SPARK_KEY_SOURCE,
    length: SPARK_API_KEY.length,
    fingerprint: maskKeyFingerprint(SPARK_API_KEY),
  });
}

/** Safe diagnostics for telemetry/debugging (never exposes full key). */
export function getSparkKeyDiagnostics() {
  return {
    env: environment,
    source: SPARK_KEY_SOURCE,
    length: SPARK_API_KEY.length,
    fingerprint: maskKeyFingerprint(SPARK_API_KEY),
  } as const;
}