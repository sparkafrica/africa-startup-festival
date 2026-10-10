/**
 * Open the app listing in the platform store (Play / App Store).
 * The canonical iOS ID is bundled; expo.extra.iosAppStoreId may override it.
 */
import { Linking, Platform } from "react-native";
import Constants from "expo-constants";

const ANDROID_PACKAGE = "com.sparkllc.asf";
const IOS_APP_STORE_ID = "6788565156";

function getIosAppStoreId(): string {
  const extra = Constants.expoConfig?.extra as
    | { iosAppStoreId?: string }
    | undefined;
  return extra?.iosAppStoreId?.trim() || IOS_APP_STORE_ID;
}

export async function openPlatformAppStore(customUrl?: string | null): Promise<void> {
  const trimmed = customUrl?.trim();
  if (trimmed) {
    const can = await Linking.canOpenURL(trimmed).catch(() => false);
    if (can) {
      await Linking.openURL(trimmed);
      return;
    }
  }

  if (Platform.OS === "android") {
    const market = `market://details?id=${ANDROID_PACKAGE}`;
    const web = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
    try {
      const canMarket = await Linking.canOpenURL(market).catch(() => false);
      await Linking.openURL(canMarket ? market : web);
    } catch {
      await Linking.openURL(web);
    }
    return;
  }

  const appStoreId = getIosAppStoreId();
  const itms = `itms-apps://apps.apple.com/app/id${appStoreId}`;
  const https = `https://apps.apple.com/app/id${appStoreId}`;
  try {
    const canItms = await Linking.canOpenURL(itms).catch(() => false);
    await Linking.openURL(canItms ? itms : https);
  } catch {
    await Linking.openURL(https);
  }
}
