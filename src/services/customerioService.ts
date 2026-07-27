/**
 * Customer.io SDK — identify users, in-app messaging, and push token registration.
 *
 * Push tokens come from Firebase (see pushRegistration.ts); we register the same
 * FCM token with Customer.io via registerDeviceToken (multiple-push-providers).
 *
 * @see https://docs.customer.io/integrations/sdk/expo/push-notifications/push/
 */
import {
  CustomerIO,
  CioConfig,
  CioLogLevel,
  CioRegion,
} from "customerio-reactnative";
import type { User } from "../context/AuthContext";
import {
  CUSTOMERIO_CDP_API_KEY,
  CUSTOMERIO_REGION,
  CUSTOMERIO_SITE_ID,
  CUSTOMERIO_VERBOSE,
  isCustomerIOConfigured,
} from "../config/customerio";

let initPromise: Promise<void> | null = null;
let initialized = false;
let lastIdentifiedUserId: string | null = null;
let lastRegisteredToken: string | null = null;

function cioLog(message: string): void {
  if (__DEV__) console.log(`[CustomerIO] ${message}`);
}

function cioWarn(message: string): void {
  if (__DEV__) console.warn(`[CustomerIO] ${message}`);
}

export async function initializeCustomerIO(): Promise<void> {
  if (initPromise) return initPromise;
  if (!isCustomerIOConfigured()) {
    cioWarn("skipped — set EXPO_PUBLIC_CUSTOMERIO_CDP_API_KEY");
    return;
  }

  initPromise = (async () => {
    const config: CioConfig = {
      cdpApiKey: CUSTOMERIO_CDP_API_KEY,
      region:
        CUSTOMERIO_REGION === "eu" ? CioRegion.EU : CioRegion.US,
      logLevel: CUSTOMERIO_VERBOSE ? CioLogLevel.Debug : CioLogLevel.Error,
      trackApplicationLifecycleEvents: true,
      ...(CUSTOMERIO_SITE_ID
        ? { inApp: { siteId: CUSTOMERIO_SITE_ID } }
        : {}),
    };
    await CustomerIO.initialize(config);
    initialized = true;
    cioLog(
      `ready · region=${CUSTOMERIO_REGION}${CUSTOMERIO_SITE_ID ? " · in-app on" : ""}`,
    );
  })().catch((err) => {
    initPromise = null;
    cioWarn(`init failed — ${err instanceof Error ? err.message : String(err)}`);
    throw err;
  });

  return initPromise;
}

export async function identifyCustomerIOUser(user: User): Promise<void> {
  try {
    await initializeCustomerIO();
    if (!initialized) return;
    if (lastIdentifiedUserId === user.user_id) return;

    await CustomerIO.identify({
      userId: user.user_id,
      traits: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        ...(user.company?.name ? { company_name: user.company.name } : {}),
      },
    });

    lastIdentifiedUserId = user.user_id;
    cioLog(`identified · ${user.user_id} (${user.email})`);
  } catch (err) {
    cioWarn(`identify failed — ${err instanceof Error ? err.message : String(err)}`);
  }
}

export async function clearCustomerIOUser(): Promise<void> {
  if (!initialized) return;
  try {
    await CustomerIO.deleteDeviceToken();
    await CustomerIO.clearIdentify();
    lastIdentifiedUserId = null;
    lastRegisteredToken = null;
    cioLog("signed out · cleared user + device token");
  } catch (err) {
    cioWarn(`clear failed — ${err instanceof Error ? err.message : String(err)}`);
  }
}

/** Register FCM/APNs token obtained via Firebase with Customer.io. */
export async function registerCustomerIODeviceToken(
  token: string,
): Promise<void> {
  if (!token) return;
  if (lastRegisteredToken === token) return;

  try {
    await initializeCustomerIO();
    if (!initialized) return;
    await CustomerIO.registerDeviceToken(token);
    lastRegisteredToken = token;
    cioLog(`push token registered · ${token.length} chars`);
  } catch (err) {
    cioWarn(
      `push token failed — ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}
