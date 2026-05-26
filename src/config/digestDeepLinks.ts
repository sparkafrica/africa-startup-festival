/**
 * Numbered digest / email deeplinks — handoff list for backend & PM.
 * Host files (AASA + assetlinks): add /schedule on server when enabling link #8 (iOS).
 * New paths here are JS-only → OTA-safe (no new native build).
 */
import { DEEP_LINK_HTTPS_PREFIX } from "./deeplink";

export type DigestDeepLinkId =
  | "download"
  | "meetings"
  | "meetings_inbound"
  | "meetings_outbound"
  | "meetings_scheduled"
  | "connections"
  | "attendees"
  | "schedule"
  | "profile";

export interface DigestDeepLink {
  id: DigestDeepLinkId;
  /** 1-based number for email spec / PM docs */
  number: number;
  path: string;
  url: string;
  purpose: string;
  /** Opens native app when installed; false = web only */
  opensApp: boolean;
}

const BASE = DEEP_LINK_HTTPS_PREFIX;

export const DIGEST_DEEP_LINKS: readonly DigestDeepLink[] = [
  {
    id: "download",
    number: 1,
    path: "/download",
    url: `${BASE}/download`,
    purpose: "Download app — store / install landing (browser only)",
    opensApp: false,
  },
  {
    id: "meetings",
    number: 2,
    path: "/meetings",
    url: `${BASE}/meetings`,
    purpose: "Meetings hub (default tabs)",
    opensApp: true,
  },
  {
    id: "meetings_inbound",
    number: 3,
    path: "/meetings/inbound",
    url: `${BASE}/meetings/inbound`,
    purpose: "Meetings → Requests → Inbound invites",
    opensApp: true,
  },
  {
    id: "meetings_outbound",
    number: 4,
    path: "/meetings/outbound",
    url: `${BASE}/meetings/outbound`,
    purpose: "Meetings → Requests → Outbound",
    opensApp: true,
  },
  {
    id: "meetings_scheduled",
    number: 5,
    path: "/meetings/scheduled",
    url: `${BASE}/meetings/scheduled`,
    purpose: "Meetings → Scheduled tab",
    opensApp: true,
  },
  {
    id: "connections",
    number: 6,
    path: "/connections",
    url: `${BASE}/connections`,
    purpose: "Connections — pending requests",
    opensApp: true,
  },
  {
    id: "attendees",
    number: 7,
    path: "/attendees",
    url: `${BASE}/attendees`,
    purpose: "Attendees — discover people",
    opensApp: true,
  },
  {
    id: "schedule",
    number: 8,
    path: "/schedule",
    url: `${BASE}/schedule`,
    purpose: "Schedule — event programme / sessions",
    opensApp: true,
  },
  {
    id: "profile",
    number: 9,
    path: "/profile",
    url: `${BASE}/profile`,
    purpose: "Profile — manage / update your profile",
    opensApp: true,
  },
] as const;

/**
 * Entity deeplinks — open a specific row/detail (like `/attendees/{userId}`).
 * OTA-safe once AASA includes the path wildcards (see docs/deeplink-well-known).
 */
export type EntityDeepLinkId =
  | "schedule_item"
  | "connection"
  | "attendee"
  | "meeting_inbound"
  | "meeting_outbound"
  | "meeting_scheduled"
  | "exhibitor"
  | "partner";

export interface EntityDeepLink {
  id: EntityDeepLinkId;
  pathTemplate: string;
  /** Example with placeholder ids for PM / email copy */
  urlExample: string;
  idParam: string;
  idType: string;
  screen: string;
  purpose: string;
  /** True when parseDeepLinkTarget + screen handling are wired in the app */
  implemented: boolean;
}

export const ENTITY_DEEP_LINKS: readonly EntityDeepLink[] = [
  {
    id: "schedule_item",
    pathTemplate: "/schedule/{scheduleId}",
    urlExample: `${BASE}/schedule/12345`,
    idParam: "scheduleId",
    idType: "number (programme / event_schedule id)",
    screen: "Schedule",
    purpose:
      "Schedule tab → scroll to session row, ~3s highlight, expand session detail",
    implemented: true,
  },
  {
    id: "connection",
    pathTemplate: "/connections/{connectionId}",
    urlExample: `${BASE}/connections/678`,
    idParam: "connectionId",
    idType: "number (connection request id from API)",
    screen: "Connections",
    purpose:
      "Connections → scroll to request row, ~3s highlight, open connection sheet",
    implemented: true,
  },
  {
    id: "attendee",
    pathTemplate: "/attendees/{userId}",
    urlExample: `${BASE}/attendees/userid_u2b6op6untvchled`,
    idParam: "userId",
    idType: "string (Spark user id, e.g. userid_…)",
    screen: "Attendees",
    purpose:
      "Attendees → scroll to person, ~3s highlight, open attendee profile sheet",
    implemented: true,
  },
  {
    id: "meeting_inbound",
    pathTemplate: "/meetings/inbound/{meetingId}",
    urlExample: `${BASE}/meetings/inbound/42`,
    idParam: "meetingId",
    idType: "number",
    screen: "Meetings (Requests → Inbound)",
    purpose: "Meetings → Inbound tab → highlight meeting row",
    implemented: true,
  },
  {
    id: "meeting_outbound",
    pathTemplate: "/meetings/outbound/{meetingId}",
    urlExample: `${BASE}/meetings/outbound/42`,
    idParam: "meetingId",
    idType: "number",
    screen: "Meetings (Requests → Outbound)",
    purpose: "Meetings → Outbound tab → highlight meeting row",
    implemented: true,
  },
  {
    id: "meeting_scheduled",
    pathTemplate: "/meetings/scheduled/{meetingId}",
    urlExample: `${BASE}/meetings/scheduled/42`,
    idParam: "meetingId",
    idType: "number",
    screen: "Meetings (Scheduled)",
    purpose: "Meetings → Scheduled tab → highlight meeting row",
    implemented: true,
  },
  {
    id: "exhibitor",
    pathTemplate: "/exhibitors/{companyId}",
    urlExample: `${BASE}/exhibitors/88`,
    idParam: "companyId",
    idType: "number (directory company pk, same as CompanyDetail exhibitorId)",
    screen: "Exhibitors → CompanyDetail",
    purpose:
      "Exhibitors → brief card highlight → exhibitor company profile",
    implemented: true,
  },
  {
    id: "partner",
    pathTemplate: "/partners/{companyId}",
    urlExample: `${BASE}/partners/91`,
    idParam: "companyId",
    idType: "number (directory company pk, same as CompanyDetail exhibitorId)",
    screen: "Partners → CompanyDetail",
    purpose:
      "Partners → brief card highlight → partner company profile",
    implemented: true,
  },
] as const;

/** Copy-paste lines for backend email templates (replace {placeholders}). */
export const BACKEND_EMAIL_DEEP_LINK_LINES: readonly string[] = [
  "— Screen links (no id) —",
  `${BASE}/download`,
  `${BASE}/meetings`,
  `${BASE}/meetings/inbound`,
  `${BASE}/meetings/outbound`,
  `${BASE}/meetings/scheduled`,
  `${BASE}/connections`,
  `${BASE}/attendees`,
  `${BASE}/schedule`,
  `${BASE}/profile`,
  "— Entity links (replace id in path) —",
  `${BASE}/schedule/{scheduleId}`,
  `${BASE}/connections/{connectionId}`,
  `${BASE}/attendees/{userId}`,
  `${BASE}/meetings/inbound/{meetingId}`,
  `${BASE}/meetings/outbound/{meetingId}`,
  `${BASE}/meetings/scheduled/{meetingId}`,
  `${BASE}/meetings/{meetingId}`,
  `${BASE}/exhibitors/{companyId}`,
  `${BASE}/partners/{companyId}`,
] as const;

/** Build a universal link for an entity id (encode userId yourself if needed). */
export function entityDeepLinkUrl(
  id: EntityDeepLinkId,
  rawId: string | number,
): string | undefined {
  const entry = ENTITY_DEEP_LINKS.find((l) => l.id === id);
  if (!entry) return undefined;
  const encoded =
    typeof rawId === "string" ? encodeURIComponent(rawId) : String(rawId);
  return `${BASE}${entry.pathTemplate.replace(/\{[^}]+\}/, encoded)}`;
}

export function getDigestDeepLinkByPath(path: string): DigestDeepLink | undefined {
  const normalized = path.replace(/^\/+/, "").toLowerCase();
  return DIGEST_DEEP_LINKS.find((l) => l.path.replace(/^\/+/, "") === normalized);
}
