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
