import { EVENT_ID } from "../config/env";

/** Resolve nested API `event` fields (number or object with id). */
export function resolveEventId(
  event: number | { id?: number } | null | undefined,
): number | null {
  if (typeof event === "number" && Number.isFinite(event)) {
    return event;
  }
  if (event && typeof event === "object" && typeof event.id === "number") {
    return event.id;
  }
  return null;
}

export function matchesActiveEvent(
  event: number | { id?: number } | string | null | undefined,
  eventId: number = EVENT_ID,
): boolean {
  if (event == null || event === "") {
    return true;
  }
  if (typeof event === "string") {
    const parsed = Number.parseInt(event, 10);
    return Number.isFinite(parsed) ? parsed === eventId : true;
  }
  const resolved = resolveEventId(event);
  return resolved == null ? true : resolved === eventId;
}

/** Strict event match for meetings — excludes rows with missing/unknown event. */
export function meetingBelongsToEvent(
  meeting: {
    slot?: { event?: number | { id?: number } } | null;
    event?: number | { id?: number } | null;
    event_id?: number | null;
  },
  eventId: number = EVENT_ID,
): boolean {
  const fromSlot = resolveEventId(meeting.slot?.event ?? null);
  const fromEvent = resolveEventId(meeting.event ?? null);
  const fromId =
    typeof meeting.event_id === "number" && Number.isFinite(meeting.event_id)
      ? meeting.event_id
      : null;
  const resolved = fromSlot ?? fromEvent ?? fromId;
  return resolved === eventId;
}

/**
 * Event match for rows returned by an already event-scoped endpoint.
 *
 * Some virtual-meeting serializers currently omit `event`/`event_id`, even
 * though the request itself is scoped with `?event_id=...`. Missing scope is
 * therefore accepted, but an explicit event from another event is rejected.
 */
export function meetingMatchesRequestedEvent(
  meeting: {
    slot?: { event?: number | { id?: number } } | null;
    event?: number | { id?: number } | null;
    event_id?: number | null;
  },
  eventId: number = EVENT_ID,
): boolean {
  const fromSlot = resolveEventId(meeting.slot?.event ?? null);
  const fromEvent = resolveEventId(meeting.event ?? null);
  const fromId =
    typeof meeting.event_id === "number" && Number.isFinite(meeting.event_id)
      ? meeting.event_id
      : null;
  const resolved = fromSlot ?? fromEvent ?? fromId;
  return resolved == null || resolved === eventId;
}
