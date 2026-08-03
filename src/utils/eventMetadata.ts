/**
 * Event-scoped user metadata — nested under stable festival keys (e.g. asfkenya26).
 * Numeric EVENT_ID differs between dev/prod; metadata keys stay the same.
 */
import { EVENT_METADATA_KEY } from "../config/env";
import { getSafeMetadataObjectForMerge } from "./sanitizeUserMetadata";

/** Fields stored inside the active event bag (not at metadata root). */
export const EVENT_SCOPED_USER_METADATA_KEYS = [
  "linkedIn",
  "linkedin_url",
  "industry",
  "interests",
  "event_goals",
  "industries_to_meet",
  "event_checklist",
  "event_checklist_day2",
  "user_type",
  "role",
  "pass_type",
  "ticket_type",
  "ticketType",
  "passType",
  "userType",
] as const;

export type EventScopedUserMetadataKey =
  (typeof EVENT_SCOPED_USER_METADATA_KEYS)[number];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Active event's metadata bag with legacy flat-root fallback for unmigrated users.
 */
export function getEventMetadata(
  raw: unknown,
  eventKey: string = EVENT_METADATA_KEY,
): Record<string, unknown> {
  const root = getSafeMetadataObjectForMerge(raw);
  const bag = root[eventKey];
  const scoped = isRecord(bag) ? bag : {};

  const legacy: Record<string, unknown> = {};
  for (const key of EVENT_SCOPED_USER_METADATA_KEYS) {
    if (root[key] !== undefined && scoped[key] === undefined) {
      legacy[key] = root[key];
    }
  }

  return { ...legacy, ...scoped };
}

/**
 * Merge a patch into the active event bag only; other event bags and root keys are preserved.
 */
export function mergeEventMetadata(
  raw: unknown,
  patch: Record<string, unknown>,
  eventKey: string = EVENT_METADATA_KEY,
): Record<string, unknown> {
  const root = getSafeMetadataObjectForMerge(raw);
  const currentBag = getEventMetadata(raw, eventKey);
  const nextBag = { ...currentBag, ...patch };

  return {
    ...root,
    [eventKey]: nextBag,
  };
}
