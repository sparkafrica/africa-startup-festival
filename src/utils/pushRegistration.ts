/**
 * Push Notification Registration
 *
 * Requests permission, gets FCM token, and registers with backend.
 * Uses @react-native-firebase/messaging for FCM token on both iOS and Android
 * so the backend receives a valid FCM registration token (required for FCM delivery).
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import {
  getMessaging,
  getToken,
  requestPermission,
  AuthorizationStatus,
  registerDeviceForRemoteMessages,
  getAPNSToken,
} from "@react-native-firebase/messaging";
import { Platform } from "react-native";
import { notificationService } from "../services/notificationService";

/** Device type for backend: android | ios | web */
function getDeviceType(): "android" | "ios" | "web" {
  if (Platform.OS === "android") return "android";
  if (Platform.OS === "ios") return "ios";
  return "web";
}

/**
 * Request push permission and register device with backend.
 * Call when user is logged in.
 * Uses Firebase Messaging getToken() to obtain FCM token on both platforms
 * (iOS previously returned APNs token via expo-notifications, which FCM rejects).
 * @returns registration_id (FCM token) if successful, null otherwise
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Must run on physical device
  if (!Device.isDevice) {
    return null;
  }

  // Android: create notification channel via expo-notifications
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const messaging = getMessaging();

  // Request permission: expo-notifications for Android, Firebase for iOS
  if (Platform.OS === "ios") {
    const authStatus = await requestPermission(messaging);
    const granted =
      authStatus === AuthorizationStatus.AUTHORIZED ||
      authStatus === AuthorizationStatus.PROVISIONAL;
    if (!granted) {
      return null;
    }
    // iOS: Register with APNs BEFORE getToken. FCM requires APNs token to vend a valid FCM token.
    // Without this, getToken may return a token that FCM rejects when backend tries to send.
    await registerDeviceForRemoteMessages(messaging);
    // Wait for APNs token (delivered asynchronously). Poll up to 5s.
    for (let i = 0; i < 10; i++) {
      const apnsToken = await getAPNSToken(messaging);
      if (apnsToken) break;
      await new Promise((r) => setTimeout(r, 500));
    }
  } else if (Platform.OS === "android") {
    const { status } = await Notifications.getPermissionsAsync();
    let finalStatus = status;
    if (status !== "granted") {
      const { status: requested } = await Notifications.requestPermissionsAsync();
      finalStatus = requested;
    }
    if (finalStatus !== "granted") {
      return null;
    }
  }

  // Get FCM token via Firebase Messaging (valid for both iOS and Android)
  let registrationId: string;
  try {
    registrationId = await getToken(messaging);
  } catch (err) {
    if (__DEV__) {
      console.warn(
        "[push] getToken failed:",
        err instanceof Error ? err.message : String(err)
      );
    }
    return null;
  }

  if (!registrationId || typeof registrationId !== "string") {
    if (__DEV__) {
      console.warn("[push] getToken returned empty or non-string:", registrationId);
    }
    return null;
  }

  try {
    const deviceType = getDeviceType();
    await notificationService.registerDevice(registrationId, deviceType);
    if (__DEV__) {
      console.log(
        `[push] Registered ${deviceType} device, token length: ${registrationId.length}`
      );
    }
    return registrationId;
  } catch (err) {
    if (__DEV__) {
      console.warn(
        "[push] registerDevice failed:",
        err instanceof Error ? err.message : String(err)
      );
    }
    return null;
  }
}
