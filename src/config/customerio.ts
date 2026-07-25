/**
 * Customer.io credentials (Expo public env + EAS extra).
 *
 * Add to .env (dev) and EAS secrets (production builds):
 *   EXPO_PUBLIC_CUSTOMERIO_CDP_API_KEY=
 *   EXPO_PUBLIC_CUSTOMERIO_SITE_ID=
 *   EXPO_PUBLIC_CUSTOMERIO_REGION=us   # or eu
 */
import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string>;

export const CUSTOMERIO_CDP_API_KEY =
  extra.CUSTOMERIO_CDP_API_KEY ||
  process.env.EXPO_PUBLIC_CUSTOMERIO_CDP_API_KEY ||
  "";

export const CUSTOMERIO_SITE_ID =
  extra.CUSTOMERIO_SITE_ID ||
  process.env.EXPO_PUBLIC_CUSTOMERIO_SITE_ID ||
  "";

export const CUSTOMERIO_REGION = (
  extra.CUSTOMERIO_REGION ||
  process.env.EXPO_PUBLIC_CUSTOMERIO_REGION ||
  "us"
).toLowerCase();

export function isCustomerIOConfigured(): boolean {
  return CUSTOMERIO_CDP_API_KEY.length > 0;
}
