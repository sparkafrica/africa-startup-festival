/**
 * Shared route → screen mapping for push taps and email/universal deeplinks.
 */
import type { NavigationState, PartialState } from "@react-navigation/native";
import { getStateFromPath as defaultGetStateFromPath } from "@react-navigation/native";
import type { RootStackParamList } from "./types";
import { navigate, resetToHome, hasHomeScreen } from "./navigationRef";
import { EVENT_ID } from "../config/env";
import {
  DEEP_LINK_HOST,
  DEEP_LINK_HTTPS_PREFIX,
  DEEP_LINK_SCHEME,
} from "../config/deeplink";
import {
  isBookMeetingPromptNotificationType,
  routeFirstSegmentIsAttendees,
} from "../utils/notificationUtils";

export interface RouteNavigationInput {
  route?: string;
  meeting_id?: string;
  connection_id?: string;
  conversation_id?: string;
  event_id?: string;
  other_party_name?: string;
  sender_name?: string;
  id?: string;
  title?: string;
  description?: string;
  notification_type?: string;
  store_url?: string;
}

function isAppUpdateRoute(data: RouteNavigationInput): boolean {
  const nt = (data.notification_type || "").trim().toLowerCase();
  if (
    nt === "app_update" ||
    nt === "force_update" ||
    nt === "store_update" ||
    nt === "system_update"
  ) {
    return true;
  }
  const t = (data.title || "").toLowerCase();
  const b = (data.description || "").toLowerCase();
  if (/\bimportant update\b/i.test(t)) return true;
  if (b.includes("please update your app") || b.includes("update your app to")) {
    return true;
  }
  return false;
}

/**
 * Maps digest paths and push `route` strings to Meetings tab params.
 * Supported paths: meetings, meetings/inbound, meetings/outbound, meetings/scheduled
 */
function meetingsParamsFromRouteString(
  routeLower: string
): RootStackParamList["Meetings"] {
  const isScheduled =
    routeLower === "meetings/scheduled" ||
    routeLower.endsWith("/scheduled") ||
    routeLower.includes("accepted") ||
    routeLower.includes("approved");

  if (isScheduled) {
    return { primaryTab: "scheduled", secondaryTab: "inbound" };
  }

  const secondaryTab =
    routeLower.includes("inbound") || routeLower.includes("received")
      ? "inbound"
      : routeLower.includes("outbound") || routeLower.includes("sent")
        ? "outbound"
        : "inbound";

  return { primaryTab: "requests", secondaryTab };
}

/** Normalize URL or path to a lowercase path segment (no leading slash). */
export function normalizeDeepLinkPath(urlOrPath: string): string | null {
  const raw = urlOrPath?.trim();
  if (!raw) return null;

  if (raw.startsWith(`${DEEP_LINK_SCHEME}://`)) {
    const rest = raw.slice(`${DEEP_LINK_SCHEME}://`.length);
    return rest.split("?")[0].replace(/\/+$/, "").toLowerCase() || null;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const u = new URL(raw);
      if (u.hostname !== DEEP_LINK_HOST) return null;
      const path = u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
      return path.toLowerCase() || null;
    } catch {
      return null;
    }
  }

  const path = raw.replace(/^\/+/, "").split("?")[0].replace(/\/+$/, "");
  return path.toLowerCase() || null;
}

export function isDeepLinkUrl(url: string): boolean {
  const trimmed = url.trim();
  if (trimmed.startsWith(`${DEEP_LINK_SCHEME}://`)) return true;
  return trimmed.startsWith(DEEP_LINK_HTTPS_PREFIX);
}

/** Paths handled in-app; `/download` stays on web (excluded in AASA). */
export function isHandledDeepLinkPath(path: string | null): boolean {
  if (!path) return false;
  if (path === "download") return false;
  return (
    path === "meetings" ||
    path.startsWith("meetings/") ||
    path === "connections" ||
    path === "attendees" ||
    path === "schedule" ||
    path === "profile"
  );
}

export function getNavigationStateFromDeepLinkPath(
  path: string,
  options?: Parameters<typeof defaultGetStateFromPath>[1]
): PartialState<NavigationState> | undefined {
  const normalized = normalizeDeepLinkPath(path);
  if (!normalized || !isHandledDeepLinkPath(normalized)) {
    return defaultGetStateFromPath(path, options);
  }

  if (normalized === "connections") {
    return { routes: [{ name: "Connections" }] };
  }
  if (normalized === "attendees") {
    return { routes: [{ name: "Attendees" }] };
  }
  if (normalized === "schedule") {
    return { routes: [{ name: "Schedule" }] };
  }
  if (normalized === "profile") {
    return { routes: [{ name: "Profile" }] };
  }
  if (normalized === "meetings" || normalized.startsWith("meetings/")) {
    const routeKey = normalized === "meetings" ? "meetings" : normalized;
    const params = meetingsParamsFromRouteString(routeKey);
    return { routes: [{ name: "Meetings", params }] };
  }

  return defaultGetStateFromPath(path, options);
}

/**
 * Imperative navigation from a path or URL (push replay, pending deeplink).
 * Returns true if a main-app route was applied.
 */
export function navigateFromDeepLinkPath(urlOrPath: string): boolean {
  if (!hasHomeScreen()) return false;

  const normalized = normalizeDeepLinkPath(urlOrPath);
  if (!normalized || !isHandledDeepLinkPath(normalized)) {
    return false;
  }

  if (normalized === "connections") {
    navigate("Connections");
    return true;
  }
  if (normalized === "attendees") {
    navigate("Attendees");
    return true;
  }
  if (normalized === "schedule") {
    navigate("Schedule");
    return true;
  }
  if (normalized === "profile") {
    navigate("Profile");
    return true;
  }
  if (normalized === "meetings" || normalized.startsWith("meetings/")) {
    const routeKey = normalized === "meetings" ? "meetings" : normalized;
    navigate("Meetings", meetingsParamsFromRouteString(routeKey));
    return true;
  }

  return false;
}

export function navigateFromDeepLinkUrl(url: string): boolean {
  return navigateFromDeepLinkPath(url);
}

/** Push notification data payload → screens (same grammar as FCM docs). */
export function applyRouteNavigation(data: RouteNavigationInput | null): void {
  if (!data) {
    resetToHome({});
    return;
  }
  if (isAppUpdateRoute(data)) {
    const notificationId =
      data.id && /^\d+$/.test(data.id) ? parseInt(data.id, 10) : undefined;
    resetToHome({
      openAppUpdateFromPush: {
        title: data.title?.trim() || "Important Update!",
        description: data.description,
        notificationId,
        storeUrl: data.store_url,
      },
    });
    return;
  }
  if (data.conversation_id) {
    const conversationId = /^\d+$/.test(data.conversation_id)
      ? parseInt(data.conversation_id, 10)
      : undefined;
    const eventId =
      data.event_id && /^\d+$/.test(data.event_id)
        ? parseInt(data.event_id, 10)
        : EVENT_ID;
    if (conversationId != null) {
      const otherPartyName =
        data.other_party_name || data.sender_name || "Chat";
      navigate("Messages", {
        openConversationId: conversationId,
        eventId,
        otherPartyName,
      });
      return;
    }
  }
  if (data.connection_id) {
    navigate("Connections");
    return;
  }
  if (data.meeting_id) {
    const routeLower = (data.route || "").toLowerCase();
    navigate("Meetings", meetingsParamsFromRouteString(routeLower));
    return;
  }

  const routeLower = (data.route || "").toLowerCase();
  if (routeLower) {
    if (routeLower === "connections" || routeLower.startsWith("connections")) {
      navigate("Connections");
      return;
    }
    if (routeLower === "attendees" || routeLower.startsWith("attendees")) {
      navigate("Attendees");
      return;
    }
    if (routeLower === "schedule" || routeLower.startsWith("schedule")) {
      navigate("Schedule");
      return;
    }
    if (routeLower === "profile" || routeLower.startsWith("profile")) {
      navigate("Profile");
      return;
    }
    if (
      routeLower === "meetings" ||
      routeLower.startsWith("meetings/") ||
      routeLower.startsWith("meetings")
    ) {
      navigate("Meetings", meetingsParamsFromRouteString(routeLower));
      return;
    }
  }

  if (
    isBookMeetingPromptNotificationType(data.notification_type) ||
    routeFirstSegmentIsAttendees(data.route)
  ) {
    navigate("Attendees");
    return;
  }
  const openNotificationId =
    data.id && /^\d+$/.test(data.id) ? parseInt(data.id, 10) : undefined;
  if (openNotificationId != null) {
    resetToHome({ openPushNotificationId: openNotificationId });
    return;
  }
  resetToHome({});
}
