/**
 * Local 24h reminders for startup admins with pending join requests.
 * Complements backend push/in-app notifications when the app is backgrounded.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const REMINDER_STORAGE_KEY = "@spark:startup_join_reminder_scheduled";
const REMINDER_NOTIFICATION_ID = "startup-join-admin-reminder";
const ANDROID_CHANNEL_ID = "startup-join-reminders";
const REMINDER_SECONDS = 24 * 60 * 60;

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Startup join reminders",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
}

export async function syncStartupJoinAdminReminders(
  pendingCount: number,
): Promise<void> {
  await ensureAndroidChannel();

  if (pendingCount <= 0) {
    try {
      await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
    } catch {
      /* ignore */
    }
    await AsyncStorage.removeItem(REMINDER_STORAGE_KEY);
    return;
  }

  const already = await AsyncStorage.getItem(REMINDER_STORAGE_KEY);
  if (already === "1") {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
  } catch {
    /* ignore */
  }

  await Notifications.scheduleNotificationAsync({
    identifier: REMINDER_NOTIFICATION_ID,
    content: {
      title: "Pending startup join requests",
      body:
        pendingCount === 1
          ? "1 person is waiting for you to approve their startup join request."
          : `${pendingCount} people are waiting for you to approve startup join requests.`,
      data: {
        route: "profile/startup",
        notification_type: "startup_join_reminder",
      },
      ...(Platform.OS === "android"
        ? { channelId: ANDROID_CHANNEL_ID }
        : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: REMINDER_SECONDS,
      repeats: true,
    },
  });

  await AsyncStorage.setItem(REMINDER_STORAGE_KEY, "1");
}

export async function clearStartupJoinAdminReminders(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(REMINDER_NOTIFICATION_ID);
  } catch {
    /* ignore */
  }
  await AsyncStorage.removeItem(REMINDER_STORAGE_KEY);
}
