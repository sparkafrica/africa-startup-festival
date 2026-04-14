/**
 * EAS / expo-updates OTA flow: check early (no download), apply only after Home is stable.
 * Ships as JS — no new native store build required for these calls.
 */
import * as Updates from "expo-updates";

/** Time Home must stay focused before we check again, fetch, and reload. */
export const OTA_HOME_STABLE_DELAY_MS = 3000;

/** Light check only — run on verification or main mount; does not download or reload. */
export async function runEarlyOtaCheckOnly(): Promise<void> {
  if (__DEV__) return;
  try {
    if (typeof Updates.checkForUpdateAsync !== "function") return;
    await Updates.checkForUpdateAsync();
  } catch {
    // ignore — offline or updates disabled
  }
}

/**
 * Authoritative check + download + reload. Call only after {@link OTA_HOME_STABLE_DELAY_MS} on Home.
 * Invokes `onDownloadStart` right before `fetchUpdateAsync` (show "Updating...").
 */
export async function checkFetchAndReloadOta(
  onDownloadStart: () => void
): Promise<void> {
  if (__DEV__) return;
  try {
    if (typeof Updates.checkForUpdateAsync !== "function") return;
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) return;
    onDownloadStart();
    if (typeof Updates.fetchUpdateAsync === "function") {
      await Updates.fetchUpdateAsync();
    }
    if (typeof Updates.reloadAsync === "function") {
      await Updates.reloadAsync();
    }
  } catch {
    throw new Error("ota-apply-failed");
  }
}
