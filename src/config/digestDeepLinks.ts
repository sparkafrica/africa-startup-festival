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

export function getDigestDeepLinkByPath(path: string): DigestDeepLink | undefined {
  const normalized = path.replace(/^\/+/, "").toLowerCase();
  return DIGEST_DEEP_LINKS.find((l) => l.path.replace(/^\/+/, "") === normalized);
}
