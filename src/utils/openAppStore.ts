/**
 * Open the app listing in the platform store (Play / App Store).
 * iOS requires numeric App Store ID (EXPO_PUBLIC_IOS_APP_STORE_ID / expo.extra.iosAppStoreId).
 */
import { Linking, Platform, Alert } from "react-native";
import Constants from "expo-constants";

const ANDROID_PACKAGE = "com.sparkllc.mobile";

function getIosAppStoreId(): string {
  const extra = Constants.expoConfig?.extra as
    | { iosAppStoreId?: string }
    | undefined;
  return extra?.iosAppStoreId?.trim() || "";
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
  if (!appStoreId) {
    Alert.alert(
      "Update",
      "Add your iOS App Store ID to EXPO_PUBLIC_IOS_APP_STORE_ID (or expo.extra.iosAppStoreId) so the Update button can open the App Store.",
    );
    return;
  }

  const itms = `itms-apps://apps.apple.com/app/id${appStoreId}`;
  const https = `https://apps.apple.com/app/id${appStoreId}`;
  try {
    const canItms = await Linking.canOpenURL(itms).catch(() => false);
    await Linking.openURL(canItms ? itms : https);
  } catch {
    await Linking.openURL(https);
  }
}
