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
import {
  isHandledDeepLinkPath,
  normalizePathSegments,
  parseDeepLinkTarget,
} from "./deepLinkParse";
import {
  navigateDeepLinkTarget,
  paramsForDeepLinkTarget,
} from "./deepLinkNavigation";

export { isHandledDeepLinkPath, parseDeepLinkTarget } from "./deepLinkParse";

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
  user_id?: string;
  schedule_id?: string;
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
  routeLower: string,
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

export function getNavigationStateFromDeepLinkPath(
  path: string,
  options?: Parameters<typeof defaultGetStateFromPath>[1],
): PartialState<NavigationState> | undefined {
  const normalized = normalizeDeepLinkPath(path);
  if (!normalized || !isHandledDeepLinkPath(normalized)) {
    return defaultGetStateFromPath(path, options);
  }

  const target = parseDeepLinkTarget(normalized);
  if (!target) {
    return defaultGetStateFromPath(path, options);
  }

  const { screen, params } = paramsForDeepLinkTarget(target);
  return {
    routes: [{ name: screen, params }],
  };
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

  const target = parseDeepLinkTarget(normalized);
  if (!target) return false;

  return navigateDeepLinkTarget(target);
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

  if (data.user_id?.trim()) {
    navigate("Attendees", { highlightUserId: data.user_id.trim() });
    return;
  }

  if (data.schedule_id && /^\d+$/.test(data.schedule_id)) {
    navigate("Schedule", {
      highlightScheduleId: parseInt(data.schedule_id, 10),
    });
    return;
  }

  if (data.connection_id && /^\d+$/.test(data.connection_id)) {
    navigate("Connections", {
      highlightConnectionId: parseInt(data.connection_id, 10),
    });
    return;
  }

  if (data.meeting_id && /^\d+$/.test(data.meeting_id)) {
    const routeLower = (data.route || "").toLowerCase();
    const tabParams = meetingsParamsFromRouteString(routeLower);
    navigate("Meetings", {
      ...tabParams,
      highlightMeetingId: parseInt(data.meeting_id, 10),
    });
    return;
  }

  const routeLower = (data.route || "").toLowerCase();
  if (routeLower) {
    const segments = normalizePathSegments(routeLower);
    const path = segments.join("/");
    const target = parseDeepLinkTarget(path);
    if (target) {
      navigateDeepLinkTarget(target);
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
