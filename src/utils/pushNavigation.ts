/**
 * Push tap navigation – handles getInitialNotification and onNotificationOpenedApp
 * to open the right screen when the user taps a push notification.
 *
 * Backend: When sending FCM, mirror the /notifications/ API fields in the data payload (all strings):
 * - id: backend notification id
 * - title, description: display text
 * - route: e.g. "meetings", "connections", "schedule", "tag-pickup", "meetings/requests/inbound"
 * - meeting_id: non-empty for meeting notifications
 * - connection_id: non-empty for connection notifications
 *
 * Example: { id: "123", route: "meetings/requests/inbound", meeting_id: "456", connection_id: "" }
 *
 * Email digest deeplinks use the same route grammar via deepLinkRoutes.ts.
 */
import {
  getMessaging,
  getInitialNotification,
  onNotificationOpenedApp,
} from "@react-native-firebase/messaging";
import type { RemoteMessage } from "@react-native-firebase/messaging";
import { isReady } from "../navigation/navigationRef";
import {
  applyRouteNavigation,
  type RouteNavigationInput,
} from "../navigation/deepLinkRoutes";

export type PushNotificationData = RouteNavigationInput;

function parseRemoteMessageData(
  message: RemoteMessage | null
): PushNotificationData | null {
  if (!message?.data || typeof message.data !== "object") return null;
  const d = message.data as Record<string, string | undefined>;
  return {
    id: typeof d.id === "string" ? d.id : undefined,
    route: typeof d.route === "string" ? d.route.trim() : undefined,
    meeting_id:
      typeof d.meeting_id === "string" && d.meeting_id ? d.meeting_id : undefined,
    connection_id:
      typeof d.connection_id === "string" && d.connection_id
        ? d.connection_id
        : undefined,
    conversation_id:
      typeof d.conversation_id === "string" && d.conversation_id
        ? d.conversation_id
        : undefined,
    event_id:
      typeof d.event_id === "string" && d.event_id ? d.event_id : undefined,
    other_party_name:
      typeof d.other_party_name === "string" && d.other_party_name
        ? d.other_party_name
        : undefined,
    sender_name:
      typeof d.sender_name === "string" && d.sender_name
        ? d.sender_name
        : undefined,
    title: typeof d.title === "string" ? d.title : undefined,
    description: typeof d.description === "string" ? d.description : undefined,
    notification_type:
      typeof d.notification_type === "string" ? d.notification_type : undefined,
    store_url: typeof d.store_url === "string" ? d.store_url : undefined,
  };
}

/**
 * Process a RemoteMessage (from getInitialNotification or onNotificationOpenedApp).
 */
export function handlePushMessage(message: RemoteMessage | null) {
  const data = parseRemoteMessageData(message);
  applyRouteNavigation(data);
}

const NAV_READY_INTERVAL_MS = 50;
const NAV_READY_MAX_WAIT_MS = 3000;

function waitForNavReady(): Promise<void> {
  return new Promise((resolve) => {
    if (isReady()) {
      resolve();
      return;
    }
    const start = Date.now();
    const check = () => {
      if (isReady() || Date.now() - start >= NAV_READY_MAX_WAIT_MS) {
        resolve();
        return;
      }
      setTimeout(check, NAV_READY_INTERVAL_MS);
    };
    setTimeout(check, NAV_READY_INTERVAL_MS);
  });
}

/**
 * Set up push tap handlers. Call when user is authenticated and main app is shown.
 * Returns unsubscribe function.
 */
export function setupPushTapHandlers(): () => void {
  const messaging = getMessaging();

  const unsubOpened = onNotificationOpenedApp(messaging, (message) => {
    handlePushMessage(message);
  });

  getInitialNotification(messaging).then((message) => {
    if (!message) return;
    waitForNavReady().then(() => handlePushMessage(message));
  });

  return () => {
    unsubOpened();
  };
}
