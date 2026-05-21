/**
 * Client-side schedule filtering (API has no venue/date query params).
 * See Spark EMS.yaml: EventSchedule.venue, start_time, event.dates.
 */

import type { Event, EventSchedule } from "../services/eventService";

/** Filter modal option ids → ISO date on schedule.start_time */
export const DAY_FILTER_ID_TO_ISO_DATE: Record<string, string> = {
  "26th June, 2026": "2026-06-26",
  "27th June, 2026": "2026-06-27",
};

export function scheduleStartDateIso(startTime: string): string {
  const trimmed = startTime.trim();
  if (trimmed.length >= 10 && trimmed[4] === "-" && trimmed[7] === "-") {
    return trimmed.slice(0, 10);
  }
  return new Date(startTime).toISOString().slice(0, 10);
}

export function getEventDates(event: Event | number | undefined): string[] {
  if (!event || typeof event === "number") return [];
  const dates = event.dates?.filter(Boolean);
  if (dates && dates.length > 0) return [...dates].sort();
  if (event.date) return [event.date];
  return [];
}

/** Unique calendar days from programme rows (when API only sends event: 10). */
export function inferExpoDatesFromSchedules(
  schedules: EventSchedule[],
): string[] {
  const unique = new Set<string>();
  for (const s of schedules) {
    unique.add(scheduleStartDateIso(s.start_time));
  }
  return [...unique].sort();
}

let expoEventDates: string[] = [];

/** Set after loading schedules or event details — used for Day 1 / Day 2 labels. */
export function setExpoEventDates(dates: string[]): void {
  expoEventDates = dates.length > 0 ? [...dates].sort() : [];
}

function resolveExpoDates(event: Event | number | undefined): string[] {
  const fromEvent = getEventDates(event);
  if (fromEvent.length > 0) return fromEvent;
  return expoEventDates;
}

/** Display label "Day 1", "Day 2" from start_time date vs expo dates (event.dates or inferred). */
export function deriveDayLabel(
  startTime: string,
  event: Event | number | undefined,
): string {
  const iso = scheduleStartDateIso(startTime);
  const eventDates = resolveExpoDates(event);
  if (eventDates.length === 0) return "Day 1";
  const idx = eventDates.indexOf(iso);
  if (idx >= 0) return `Day ${idx + 1}`;
  return "Day 1";
}

function normalizeVenue(venue: string | null | undefined): string {
  return (venue ?? "").trim();
}

export function scheduleVenue(schedule: EventSchedule): string {
  const eventObj = typeof schedule.event === "object" ? schedule.event : null;
  return (
    normalizeVenue(schedule.venue) ||
    normalizeVenue(eventObj?.venue) ||
    "Main Stage"
  );
}

export function matchesVenue(
  schedule: EventSchedule,
  selectedVenue: string,
): boolean {
  return scheduleVenue(schedule) === normalizeVenue(selectedVenue);
}

export function matchesDayFilterIds(
  schedule: EventSchedule,
  selectedFilterIds: string[],
): boolean {
  if (selectedFilterIds.length === 0) return true;
  const iso = scheduleStartDateIso(schedule.start_time);
  const allowed = new Set(
    selectedFilterIds
      .map((id) => DAY_FILTER_ID_TO_ISO_DATE[id])
      .filter(Boolean),
  );
  if (allowed.size === 0) return true;
  return allowed.has(iso);
}

export function filterEventSchedules(
  schedules: EventSchedule[],
  options: { venue?: string; dayFilterIds?: string[] },
): EventSchedule[] {
  const { venue, dayFilterIds = [] } = options;
  return schedules.filter((schedule) => {
    if (venue && !matchesVenue(schedule, venue)) return false;
    if (!matchesDayFilterIds(schedule, dayFilterIds)) return false;
    return true;
  });
}
