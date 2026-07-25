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
  isCustomerIOConfigured,
} from "../config/customerio";

let initPromise: Promise<void> | null = null;
let initialized = false;

export async function initializeCustomerIO(): Promise<void> {
  if (initPromise) return initPromise;
  if (!isCustomerIOConfigured()) {
    if (__DEV__) {
      console.warn(
        "[CustomerIO] Skipping init — set EXPO_PUBLIC_CUSTOMERIO_CDP_API_KEY",
      );
    }
    return;
  }

  initPromise = (async () => {
    const config: CioConfig = {
      cdpApiKey: CUSTOMERIO_CDP_API_KEY,
      region:
        CUSTOMERIO_REGION === "eu" ? CioRegion.EU : CioRegion.US,
      logLevel: __DEV__ ? CioLogLevel.Debug : CioLogLevel.Error,
      trackApplicationLifecycleEvents: true,
      ...(CUSTOMERIO_SITE_ID
        ? { inApp: { siteId: CUSTOMERIO_SITE_ID } }
        : {}),
    };
    await CustomerIO.initialize(config);
    initialized = true;
    if (__DEV__) {
      console.log("[CustomerIO] SDK initialized", {
        region: CUSTOMERIO_REGION,
        inApp: Boolean(CUSTOMERIO_SITE_ID),
      });
    }
  })().catch((err) => {
    initPromise = null;
    if (__DEV__) {
      console.warn(
        "[CustomerIO] Init failed:",
        err instanceof Error ? err.message : String(err),
      );
    }
    throw err;
  });

  return initPromise;
}

export async function identifyCustomerIOUser(user: User): Promise<void> {
  try {
    await initializeCustomerIO();
    if (!initialized) return;

    await CustomerIO.identify({
      userId: user.user_id,
      traits: {
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        ...(user.company?.name ? { company_name: user.company.name } : {}),
      },
    });

    if (__DEV__) {
      console.log("[CustomerIO] Identified user", user.user_id);
    }
  } catch (err) {
    if (__DEV__) {
      console.warn(
        "[CustomerIO] identify failed:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}

export async function clearCustomerIOUser(): Promise<void> {
  if (!initialized) return;
  try {
    await CustomerIO.deleteDeviceToken();
    await CustomerIO.clearIdentify();
    if (__DEV__) console.log("[CustomerIO] Cleared user + device token");
  } catch (err) {
    if (__DEV__) {
      console.warn(
        "[CustomerIO] clear failed:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}

/** Register FCM/APNs token obtained via Firebase with Customer.io. */
export async function registerCustomerIODeviceToken(
  token: string,
): Promise<void> {
  if (!token) return;
  try {
    await initializeCustomerIO();
    if (!initialized) return;
    await CustomerIO.registerDeviceToken(token);
    if (__DEV__) {
      console.log("[CustomerIO] Device token registered, length:", token.length);
    }
  } catch (err) {
    if (__DEV__) {
      console.warn(
        "[CustomerIO] registerDeviceToken failed:",
        err instanceof Error ? err.message : String(err),
      );
    }
  }
}
