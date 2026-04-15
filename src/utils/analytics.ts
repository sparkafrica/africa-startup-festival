/**
 * Firebase Analytics (GA4) — structured `feature_action` events for dashboards & funnels.
 *
 * - All custom events use snake_case: `connection_sent`, `meeting_request_started`, …
 * - Every event is merged with `source` (screen or logical origin) and `user_type` when known.
 * - Screen changes: `logEvent('screen_view', …)` (GA4 “Screens”); debounced duplicate avoided.
 *
 * Mark “key conversions” in Firebase Console (Configure → Events) using existing names:
 *   meeting_request_submitted, connection_sent, ticket_assigned, profile_completed
 */
import type { NavigationState, PartialState } from "@react-navigation/native";
import {
  getAnalytics,
  logEvent as firebaseLogEvent,
  setUserId,
  setUserProperty,
} from "@react-native-firebase/analytics";

/** Modular API — avoids namespaced `analytics()` deprecation warnings in RN Firebase v22+. */
const analytics = getAnalytics();

const PARAM_MAX = 100;
const MAX_PARAMS = 25;
const SCREEN_DEBOUNCE_MS = 400;

let lastScreenName: string | undefined;
let lastScreenLoggedAt = 0;

/** Coarse ticket / pass label from profile metadata (best-effort; no backend change). */
let cachedUserType: string | undefined;

function safeEventName(name: string): string {
  const s = name.replace(/[^a-zA-Z0-9_]/g, "_").replace(/_+/g, "_").slice(0, 40);
  return s.length > 0 ? s : "event";
}

function parseMetadata(meta: unknown): Record<string, unknown> | null {
  if (meta == null) return null;
  if (typeof meta === "object" && !Array.isArray(meta)) {
    return meta as Record<string, unknown>;
  }
  if (typeof meta === "string") {
    try {
      return JSON.parse(meta) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
  return null;
}

/** Exported for tests / debugging; used when syncing auth → analytics. */
export function deriveUserTypeForAnalytics(user: {
  metadata?: unknown;
} | null): string | undefined {
  if (!user) return undefined;
  const m = parseMetadata(user.metadata);
  if (!m) return undefined;
  const t =
    m.ticket_type ??
    m.ticketType ??
    m.pass_type ??
    m.passType ??
    m.user_type ??
    m.userType;
  if (typeof t === "string" && t.trim()) return t.trim().slice(0, 64);
  return undefined;
}

/**
 * Call whenever `user` changes (login, logout, profile refresh).
 * Sets Analytics user id + user property for segmentation; merges into future events.
 */
export async function setAnalyticsUserContext(
  user: { user_id?: string; metadata?: unknown } | null
): Promise<void> {
  cachedUserType = deriveUserTypeForAnalytics(user);
  try {
    await setUserId(analytics, user?.user_id ? String(user.user_id) : null);
  } catch {
    /* ignore */
  }
  try {
    await setUserProperty(
      analytics,
      "user_ticket_type",
      cachedUserType ? cachedUserType.slice(0, 36) : null
    );
  } catch {
    /* ignore */
  }
}

/** Firebase Analytics allows string | number params only. */
export function sanitizeAnalyticsParams(
  params?: Record<string, unknown>
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  if (!params) return out;
  let n = 0;
  for (const [k, v] of Object.entries(params)) {
    if (n >= MAX_PARAMS) break;
    const key = safeEventName(k).slice(0, 40);
    if (typeof v === "string") out[key] = v.slice(0, PARAM_MAX);
    else if (typeof v === "number" && Number.isFinite(v)) out[key] = v;
    else if (typeof v === "boolean") out[key] = v ? 1 : 0;
    else if (v != null) out[key] = String(v).slice(0, PARAM_MAX);
    n++;
  }
  return out;
}

function enrichEventParams(params?: Record<string, unknown>): Record<string, unknown> {
  const p: Record<string, unknown> = { ...(params || {}) };
  if (p.source == null || p.source === "") p.source = "unknown";
  if (cachedUserType && (p.user_type == null || p.user_type === "")) {
    p.user_type = cachedUserType;
  }
  return p;
}

export async function trackEvent(
  eventName: string,
  params?: Record<string, unknown>
): Promise<void> {
  try {
    const name = safeEventName(eventName);
    const payload = sanitizeAnalyticsParams(enrichEventParams(params));
    await firebaseLogEvent(analytics, name as never, payload);
  } catch (e) {
    if (__DEV__) console.log("[Analytics] trackEvent", eventName, e);
  }
}

/**
 * One log per real navigation change; debounces duplicate route.name bursts.
 * Uses GA4 recommended `screen_view` event → engagement / screen reporting.
 */
export async function trackScreenView(screenName: string): Promise<void> {
  const now = Date.now();
  if (lastScreenName === screenName && now - lastScreenLoggedAt < SCREEN_DEBOUNCE_MS) {
    return;
  }
  lastScreenName = screenName;
  lastScreenLoggedAt = now;
  try {
    // Prefer `logEvent('screen_view')` over deprecated modular `logScreenView` wrapper.
    await firebaseLogEvent(analytics, "screen_view", {
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch (e) {
    if (__DEV__) console.log("[Analytics] trackScreenView", e);
  }
}

export async function trackTabSwitched(
  fromScreen: string,
  toScreen: string
): Promise<void> {
  return trackEvent("tab_switched", {
    source: "bottom_navigation",
    from_screen: fromScreen,
    to_screen: toScreen,
  });
}

export function getActiveRouteName(
  state: NavigationState | PartialState<NavigationState> | undefined
): string | undefined {
  if (!state || state.index == null || !state.routes?.length) return undefined;
  const route = state.routes[state.index];
  if (!route) return undefined;
  if (route.state) {
    return getActiveRouteName(route.state as NavigationState);
  }
  return route.name as string;
}

const TAB_ROUTES = new Set([
  "Home",
  "Attendees",
  "Schedule",
  "Meetings",
  "Connections",
]);

export function createNavigationAnalyticsHandlers(
  getRootState: () => NavigationState | undefined
) {
  const routeNameRef = { current: undefined as string | undefined };

  const onReady = () => {
    try {
      const name = getActiveRouteName(getRootState());
      if (name) {
        routeNameRef.current = name;
        void trackScreenView(name);
      }
    } catch {
      /* ignore */
    }
  };

  const onStateChange = (state: Readonly<NavigationState> | undefined) => {
    try {
      const name = getActiveRouteName(state);
      if (!name || name === routeNameRef.current) return;
      const prev = routeNameRef.current;
      routeNameRef.current = name;
      void trackScreenView(name);
      if (prev && TAB_ROUTES.has(prev) && TAB_ROUTES.has(name)) {
        void trackTabSwitched(prev, name);
      }
    } catch {
      /* ignore */
    }
  };

  return { onReady, onStateChange };
}

// --- Domain helpers (`feature_action` event names) ---

export type MeetingInteraction =
  | "request_started"
  | "request_submitted"
  | "accepted"
  | "rejected";

const MEETING_EVENT: Record<MeetingInteraction, string> = {
  request_started: "meeting_request_started",
  request_submitted: "meeting_request_submitted",
  accepted: "meeting_accepted",
  rejected: "meeting_rejected",
};

export function trackMeetingEvent(
  type: MeetingInteraction,
  params: { source: string } & Record<string, unknown> = { source: "unknown" }
): Promise<void> {
  return trackEvent(MEETING_EVENT[type], params);
}

export type ConnectionInteraction = "sent" | "accepted" | "declined";

const CONNECTION_EVENT: Record<ConnectionInteraction, string> = {
  sent: "connection_sent",
  accepted: "connection_accepted",
  declined: "connection_declined",
};

export function trackConnectionEvent(
  type: ConnectionInteraction,
  params: { source: string } & Record<string, unknown> = { source: "unknown" }
): Promise<void> {
  return trackEvent(CONNECTION_EVENT[type], params);
}

export type TicketInteraction = "viewed" | "assigned" | "transferred" | "revoked";

const TICKET_EVENT: Record<TicketInteraction, string> = {
  viewed: "ticket_viewed",
  assigned: "ticket_assigned",
  transferred: "ticket_transferred",
  revoked: "ticket_revoked",
};

export function trackTicketEvent(
  type: TicketInteraction,
  params: { source: string } & Record<string, unknown> = { source: "unknown" }
): Promise<void> {
  return trackEvent(TICKET_EVENT[type], params);
}

export type QrInteraction = "started" | "success" | "failed";

const QR_EVENT: Record<QrInteraction, string> = {
  started: "qr_scan_started",
  success: "qr_scan_success",
  failed: "qr_scan_failed",
};

export function trackQrEvent(
  type: QrInteraction,
  params: { source: string } & Record<string, unknown> = { source: "unknown" }
): Promise<void> {
  return trackEvent(QR_EVENT[type], params);
}

export type ProfileInteraction = "started" | "completed" | "updated";

const PROFILE_EVENT: Record<ProfileInteraction, string> = {
  started: "profile_started",
  completed: "profile_completed",
  updated: "profile_updated",
};

export function trackProfileEvent(
  type: ProfileInteraction,
  params: { source: string } & Record<string, unknown> = { source: "unknown" }
): Promise<void> {
  return trackEvent(PROFILE_EVENT[type], params);
}
