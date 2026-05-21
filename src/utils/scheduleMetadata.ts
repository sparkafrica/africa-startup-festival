/**
 * EventSchedule.metadata shapes for programme cards.
 * Keep sponsor and session-format badges separate — never put session labels in sponsoredBy.
 */

export type ScheduleBadgeColor = "blue" | "purple";

export interface ScheduleSponsorBadge {
  name: string;
  color?: ScheduleBadgeColor;
}

/** Session format label (e.g. Live Podcast Session) — no "Sponsored by" prefix in UI. */
export interface ScheduleSessionBadge {
  label: string;
  color?: ScheduleBadgeColor;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object" && !Array.isArray(value);
}

function parseBadgeColor(value: unknown): ScheduleBadgeColor | undefined {
  return value === "blue" || value === "purple" ? value : undefined;
}

function parseSponsoredBy(raw: unknown): ScheduleSponsorBadge | undefined {
  if (!isRecord(raw)) return undefined;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  if (!name) return undefined;
  return {
    name,
    color: parseBadgeColor(raw.color),
  };
}

function parseSessionBadge(raw: unknown): ScheduleSessionBadge | undefined {
  if (!isRecord(raw)) return undefined;
  const label =
    typeof raw.label === "string"
      ? raw.label.trim()
      : typeof raw.name === "string"
        ? raw.name.trim()
        : "";
  if (!label) return undefined;
  return {
    label,
    color: parseBadgeColor(raw.color),
  };
}

/** Read sponsor + session badges from schedule or nested event metadata. */
export function parseScheduleCardMetadata(
  scheduleMetadata: unknown,
  eventMetadata?: unknown,
): {
  sponsoredBy?: ScheduleSponsorBadge;
  sessionBadge?: ScheduleSessionBadge;
} {
  const scheduleMeta = isRecord(scheduleMetadata) ? scheduleMetadata : {};
  const eventMeta = isRecord(eventMetadata) ? eventMetadata : {};

  const sponsoredBy =
    parseSponsoredBy(scheduleMeta.sponsoredBy) ??
    parseSponsoredBy(eventMeta.sponsoredBy);

  const sessionBadge =
    parseSessionBadge(scheduleMeta.sessionBadge) ??
    parseSessionBadge(eventMeta.sessionBadge);

  return {
    sponsoredBy,
    sessionBadge,
  };
}
