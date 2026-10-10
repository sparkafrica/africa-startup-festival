import { Platform } from "react-native";
import Constants from "expo-constants";
import { ENV, EVENT_ID } from "../config/env";

export const APP_VERSION_POLICY_ENDPOINT =
  `/mobile-app/version-policy/?event_id=${encodeURIComponent(String(EVENT_ID))}`;
const VERSION_POLICY_TIMEOUT_MS = 5000;

export const IOS_APP_STORE_URL =
  "https://apps.apple.com/us/app/africa-startup-festival/id6788565156";
export const ANDROID_PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.sparkllc.asf";

export type PlatformVersionPolicy = {
  minimum_build: number | null;
  latest_build: number;
  store_url: string;
  title: string;
  message: string;
};

export type AppVersionPolicy = {
  enabled: boolean;
  ios: PlatformVersionPolicy;
  android: PlatformVersionPolicy;
};

export type AppUpdateDecision = {
  mode: "optional" | "required";
  installedBuild: number;
  policy: PlatformVersionPolicy;
};

const DEFAULT_TITLE = "A new version is available";
const DEFAULT_MESSAGE =
  "Update Africa Startup Festival for the latest improvements.";

/**
 * Safe policy while the backend endpoint is being completed. The build fields
 * remain at 6/6, but the gate is disabled so endpoint failure always fails open.
 */
export const LOCAL_VERSION_POLICY: AppVersionPolicy = {
  enabled: false,
  ios: {
    minimum_build: 6,
    latest_build: 6,
    store_url: IOS_APP_STORE_URL,
    title: DEFAULT_TITLE,
    message: DEFAULT_MESSAGE,
  },
  android: {
    minimum_build: 6,
    latest_build: 6,
    store_url: ANDROID_PLAY_STORE_URL,
    title: DEFAULT_TITLE,
    message: DEFAULT_MESSAGE,
  },
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function asBuild(value: unknown): number | null {
  if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
    return value;
  }
  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }
  return null;
}

function asNonEmptyString(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizePlatformPolicy(
  value: unknown,
  fallback: PlatformVersionPolicy,
): PlatformVersionPolicy {
  const raw = asRecord(value);
  if (!raw) return fallback;

  const latestBuild = asBuild(raw.latest_build);
  const minimumBuild =
    raw.minimum_build === null ? null : asBuild(raw.minimum_build);

  if (latestBuild === null) return fallback;
  // A malformed policy must never block users from reaching an available build.
  if (minimumBuild !== null && minimumBuild > latestBuild) return fallback;

  return {
    minimum_build: minimumBuild,
    latest_build: latestBuild,
    store_url: asNonEmptyString(raw.store_url, fallback.store_url),
    title: asNonEmptyString(raw.title, fallback.title),
    message: asNonEmptyString(raw.message, fallback.message),
  };
}

export function normalizeAppVersionPolicy(value: unknown): AppVersionPolicy {
  const root = asRecord(value);
  const wrapped = asRecord(root?.data);
  const raw =
    wrapped && ("ios" in wrapped || "android" in wrapped) ? wrapped : root;

  if (!raw) return LOCAL_VERSION_POLICY;

  return {
    enabled:
      typeof raw.enabled === "boolean"
        ? raw.enabled
        : "ios" in raw && "android" in raw,
    ios: normalizePlatformPolicy(raw.ios, LOCAL_VERSION_POLICY.ios),
    android: normalizePlatformPolicy(
      raw.android,
      LOCAL_VERSION_POLICY.android,
    ),
  };
}

/** Fetch the remote policy and fail open to the safe build-6 local policy. */
export async function fetchAppVersionPolicy(): Promise<AppVersionPolicy> {
  const controller = new AbortController();
  const timeout = setTimeout(
    () => controller.abort(),
    VERSION_POLICY_TIMEOUT_MS,
  );
  try {
    const baseUrl = ENV.BASE_URL.replace(/\/+$/, "");
    const response = await fetch(`${baseUrl}${APP_VERSION_POLICY_ENDPOINT}`, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    });
    if (!response.ok) return LOCAL_VERSION_POLICY;
    return normalizeAppVersionPolicy(await response.json());
  } catch {
    return LOCAL_VERSION_POLICY;
  } finally {
    clearTimeout(timeout);
  }
}

export function getInstalledNativeBuild(): number | null {
  // In production this is read from the installed binary and cannot be changed
  // by an OTA manifest. Metro uses app config so build-6 behavior is testable.
  const nativeBuild = asBuild(Constants.nativeBuildVersion);
  if (!__DEV__) return nativeBuild;

  const configuredBuild =
    Platform.OS === "ios"
      ? Constants.expoConfig?.ios?.buildNumber
      : Constants.expoConfig?.android?.versionCode;
  return asBuild(configuredBuild) ?? nativeBuild;
}

export function getAppUpdateDecision(
  policy: AppVersionPolicy,
  installedBuild: number | null,
): AppUpdateDecision | null {
  if (!policy.enabled || installedBuild === null) return null;
  if (Platform.OS !== "ios" && Platform.OS !== "android") return null;

  const platformPolicy = policy[Platform.OS];
  if (
    platformPolicy.minimum_build !== null &&
    installedBuild < platformPolicy.minimum_build
  ) {
    return {
      mode: "required",
      installedBuild,
      policy: platformPolicy,
    };
  }

  if (installedBuild < platformPolicy.latest_build) {
    return {
      mode: "optional",
      installedBuild,
      policy: platformPolicy,
    };
  }

  return null;
}
