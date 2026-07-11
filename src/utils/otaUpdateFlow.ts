/**
 * EAS / expo-updates OTA: check on main-app entry, show Bootsplash while fetching, then reload.
 * Ships as JS — no new native store build required for these calls.
 */
import * as Updates from "expo-updates";

/** Match BootsplashScreen branded animation length (hold before fade-out). */
export const OTA_SPLASH_MIN_DURATION_MS = 3500;

/** Abort fetch and continue on cached bundle if download stalls. */
export const OTA_FETCH_TIMEOUT_MS = 20000;

export type OtaApplyResult = "no-update" | "reloaded" | "failed";

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isUpdatesAvailable(): boolean {
  return (
    !__DEV__ &&
    typeof Updates.checkForUpdateAsync === "function" &&
    typeof Updates.fetchUpdateAsync === "function" &&
    typeof Updates.reloadAsync === "function"
  );
}

/**
 * Check for an OTA update. When one exists, invoke `onSplashStart`, download in parallel
 * with the branded splash minimum duration, then reload to apply.
 */
export async function applyOtaUpdateWithSplash(callbacks: {
  onSplashStart: () => void;
  onSplashEnd?: () => void;
}): Promise<OtaApplyResult> {
  if (!isUpdatesAvailable()) {
    return "no-update";
  }

  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) {
      return "no-update";
    }

    callbacks.onSplashStart();

    const fetchWithTimeout = Promise.race([
      Updates.fetchUpdateAsync(),
      wait(OTA_FETCH_TIMEOUT_MS).then(() =>
        Promise.reject(new Error("ota-fetch-timeout")),
      ),
    ]);

    await Promise.all([fetchWithTimeout, wait(OTA_SPLASH_MIN_DURATION_MS)]);
    await Updates.reloadAsync();
    return "reloaded";
  } catch {
    callbacks.onSplashEnd?.();
    return "failed";
  }
}
