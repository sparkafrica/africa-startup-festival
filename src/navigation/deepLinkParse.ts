/**
 * Parse universal-link paths into navigation targets (with optional entity ids).
 */

export type MeetingsDeepLinkTab = {
  primaryTab: "requests" | "scheduled";
  secondaryTab: "inbound" | "outbound";
};

export type DeepLinkTarget =
  | { screen: "Schedule"; scheduleId: number }
  | { screen: "Connections"; connectionId: number }
  | { screen: "Attendees"; userId: string }
  | {
      screen: "Meetings";
      meetingId: number;
      primaryTab: MeetingsDeepLinkTab["primaryTab"];
      secondaryTab: MeetingsDeepLinkTab["secondaryTab"];
    }
  | { screen: "Meetings"; primaryTab?: MeetingsDeepLinkTab["primaryTab"]; secondaryTab?: MeetingsDeepLinkTab["secondaryTab"] }
  | { screen: "Exhibitors"; companyId: number }
  | { screen: "Partners"; companyId: number }
  | { screen: "Profile" }
  | { screen: "Connections" }
  | { screen: "Attendees" }
  | { screen: "Schedule" }
  | { screen: "Exhibitors" }
  | { screen: "Partners" }
  | { screen: "TagPickup" };

function parsePositiveInt(value: string | undefined): number | null {
  if (!value) return null;
  const n = parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function meetingsTabFromSegment(
  segment: string | undefined,
): MeetingsDeepLinkTab | null {
  const s = segment?.toLowerCase();
  if (s === "inbound") {
    return { primaryTab: "requests", secondaryTab: "inbound" };
  }
  if (s === "outbound") {
    return { primaryTab: "requests", secondaryTab: "outbound" };
  }
  if (s === "scheduled") {
    return { primaryTab: "scheduled", secondaryTab: "inbound" };
  }
  return null;
}

/** Normalize to lowercase path without leading/trailing slashes. */
export function normalizePathSegments(path: string): string[] {
  return path
    .replace(/^\/+/, "")
    .split("?")[0]
    .replace(/\/+$/, "")
    .toLowerCase()
    .split("/")
    .filter(Boolean);
}

export function parseDeepLinkTarget(path: string): DeepLinkTarget | null {
  const parts = normalizePathSegments(path);
  if (parts.length === 0) return null;
  if (parts[0] === "download") return null;

  if (parts[0] === "profile") {
    return parts.length === 1 ? { screen: "Profile" } : null;
  }

  if (parts[0] === "schedule") {
    const scheduleId = parsePositiveInt(parts[1]);
    if (scheduleId != null) return { screen: "Schedule", scheduleId };
    return parts.length === 1 ? { screen: "Schedule" } : null;
  }

  if (parts[0] === "tag-pickup") {
    return parts.length === 1 ? { screen: "TagPickup" } : null;
  }

  if (parts[0] === "connections") {
    const connectionId = parsePositiveInt(parts[1]);
    if (connectionId != null) return { screen: "Connections", connectionId };
    return parts.length === 1 ? { screen: "Connections" } : null;
  }

  if (parts[0] === "attendees") {
    if (parts.length >= 2 && parts[1]) {
      return { screen: "Attendees", userId: decodeURIComponent(parts[1]) };
    }
    return parts.length === 1 ? { screen: "Attendees" } : null;
  }

  if (parts[0] === "exhibitors") {
    const companyId = parsePositiveInt(parts[1]);
    if (companyId != null) return { screen: "Exhibitors", companyId };
    return parts.length === 1 ? { screen: "Exhibitors" } : null;
  }

  if (parts[0] === "partners") {
    const companyId = parsePositiveInt(parts[1]);
    if (companyId != null) return { screen: "Partners", companyId };
    return parts.length === 1 ? { screen: "Partners" } : null;
  }

  if (parts[0] === "meetings") {
    if (parts.length === 1) {
      return { screen: "Meetings" };
    }
    const tab = meetingsTabFromSegment(parts[1]);
    const meetingId = parsePositiveInt(parts[2]);
    if (tab && meetingId != null) {
      return {
        screen: "Meetings",
        meetingId,
        primaryTab: tab.primaryTab,
        secondaryTab: tab.secondaryTab,
      };
    }
    if (tab) {
      return {
        screen: "Meetings",
        primaryTab: tab.primaryTab,
        secondaryTab: tab.secondaryTab,
      };
    }
    const bareMeetingId = parsePositiveInt(parts[1]);
    if (bareMeetingId != null) {
      return {
        screen: "Meetings",
        meetingId: bareMeetingId,
        primaryTab: "requests",
        secondaryTab: "inbound",
      };
    }
    return null;
  }

  return null;
}

export function isHandledDeepLinkPath(path: string | null): boolean {
  if (!path) return false;
  return parseDeepLinkTarget(path) != null;
}
