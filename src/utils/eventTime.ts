/**
 * ASF Kenya time handling.
 *
 * Backend contract:
 * - ISO datetimes are UTC and include `Z` (or another explicit offset).
 * - Meeting slots use a UTC calendar date plus a UTC time-of-day.
 *
 * Physical event activity is always displayed in Kenya event time, regardless
 * of the device timezone.
 */
export const EVENT_TIME_ZONE = "Africa/Nairobi";
export const EVENT_TIME_ZONE_LABEL = "EAT";

const timeFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const datePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const dateTimePartsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

function normalizeUtcTime(time: string): string {
  const trimmed = time.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
}

/** Combine backend UTC date + time-only fields into an absolute instant. */
export function utcDateTimeFromParts(dateIso: string, time: string): Date {
  return new Date(`${dateIso.slice(0, 10)}T${normalizeUtcTime(time)}Z`);
}

/** Format an absolute timestamp as Kenya event time. */
export function formatEventTime(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);
  return timeFormatter.format(date);
}

/** Format backend UTC date + time-only fields as Kenya event time. */
export function formatUtcSlotTime(dateIso: string, time: string): string {
  return formatEventTime(utcDateTimeFromParts(dateIso, time));
}

/** Kenya calendar date (YYYY-MM-DD) for an absolute timestamp. */
export function getEventDateIso(value: string | number | Date): string {
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = datePartsFormatter.formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;
  return year && month && day ? `${year}-${month}-${day}` : "";
}

/** Absolute milliseconds for a backend UTC date + time-only value. */
export function utcSlotTimeMs(dateIso: string, time: string): number {
  return utcDateTimeFromParts(dateIso, time).getTime();
}

/** Convert a Kenya event-local wall time selected in the UI into UTC API fields. */
export function eventLocalDateTimeToUtcParts(
  dateIso: string,
  time: string,
): { date: string; time: string } {
  const [year, month, day] = dateIso.slice(0, 10).split("-").map(Number);
  const [hour, minute, second = 0] = normalizeUtcTime(time).split(":").map(Number);
  const desiredWallMs = Date.UTC(year, month - 1, day, hour, minute, second);

  // Derive the IANA-zone offset at this instant instead of hard-coding UTC+3.
  const probe = new Date(desiredWallMs);
  const parts = dateTimePartsFormatter.formatToParts(probe);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);
  const representedWallMs = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  const instant = new Date(desiredWallMs - (representedWallMs - desiredWallMs));

  return {
    date: instant.toISOString().slice(0, 10),
    time: instant.toISOString().slice(11, 19),
  };
}
