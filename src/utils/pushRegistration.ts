/**
 * Push Notification Registration
 *
 * Requests permission, gets FCM token, and registers with backend.
 * Uses @react-native-firebase/messaging for FCM token on both iOS and Android
 * so the backend receives a valid FCM registration token (required for FCM delivery).
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
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

  // Request permission: expo-notifications for Android, Firebase for iOS
  if (Platform.OS === "ios") {
    const authStatus = await messaging().requestPermission();
    const granted =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;
    if (!granted) {
      return null;
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
    registrationId = await messaging().getToken();
  } catch {
    return null;
  }

  if (!registrationId || typeof registrationId !== "string") {
    return null;
  }

  try {
    const deviceType = getDeviceType();
    await notificationService.registerDevice(registrationId, deviceType);
    return registrationId;
  } catch {
    return null;
  }
}
