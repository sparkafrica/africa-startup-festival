/**
 * Push Notification Registration
 *
 * Requests permission, gets FCM/APNs token, and registers with backend.
 */

import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
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
 * @returns registration_id if successful, null otherwise
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Must run on physical device
  if (!Device.isDevice) {
    return null;
  }

  // Android: create notification channel
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Check / request permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    return null;
  }

  // Get device push token (FCM on Android, APNs on iOS)
  const tokenData = await Notifications.getDevicePushTokenAsync();
  const registrationId = tokenData?.data;

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
