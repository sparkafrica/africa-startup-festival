/**
 * ASF Kenya time handling.
 *
 * Backend contract:
 * - Programme and meeting wall-clock values are already event-local.
 * - Meeting payloads declare their IANA timezone.
 * - The client displays backend wall-clock values without shifting them.
 */
export const EVENT_TIME_ZONE = "Africa/Nairobi";
export const EVENT_TIME_ZONE_LABEL = "EAT";

/** Format a backend-owned wall-clock value without changing its timezone. */
export function formatBackendClockTime(value: string): string {
  const match = value
    .trim()
    .match(/(?:T|^)(\d{1,2}):(\d{2})(?::\d{2}(?:\.\d+)?)?/);
  if (!match) return value;
  const hour = Number(match[1]);
  if (!Number.isFinite(hour) || hour < 0 || hour > 23) return value;
  const period = hour >= 12 ? "PM" : "AM";
  return `${hour % 12 || 12}:${match[2]} ${period}`;
}

/** Calendar date supplied by the backend, with no device-timezone conversion. */
export function backendDateIso(value: string): string {
  const match = value.trim().match(/^(\d{4}-\d{2}-\d{2})/);
  return match?.[1] ?? "";
}

/** Short display label for the timezone supplied with a meeting payload. */
export function backendTimeZoneLabel(timeZone?: string | null): string {
  const value = timeZone?.trim();
  if (!value) return EVENT_TIME_ZONE_LABEL;
  const known: Record<string, string> = {
    "Africa/Nairobi": "EAT",
    "Africa/Lagos": "WAT",
    UTC: "UTC",
    "Etc/UTC": "UTC",
  };
  if (known[value]) return known[value];
  if (/^[A-Z]{2,5}$/.test(value)) return value;
  try {
    const part = new Intl.DateTimeFormat("en-US", {
      timeZone: value,
      timeZoneName: "short",
    })
      .formatToParts(new Date())
      .find((item) => item.type === "timeZoneName")?.value;
    return part || value;
  } catch {
    return value;
  }
}

/** Add minutes to a backend wall-clock time without converting timezones. */
export function addMinutesToBackendTime(
  time: string,
  minutesToAdd: number,
): string {
  const match = time.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return time;
  const total =
    (Number(match[1]) * 60 + Number(match[2]) + minutesToAdd) % (24 * 60);
  const normalized = total < 0 ? total + 24 * 60 : total;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(
    normalized % 60,
  ).padStart(2, "0")}:00`;
}

/**
 * Interpret a backend wall-clock date/time in its declared timezone.
 * Used only for countdown math; display values remain exactly backend-owned.
 */
export function zonedDateTimeFromParts(
  dateIso: string,
  time: string,
  timeZone: string = EVENT_TIME_ZONE,
): Date {
  const [year, month, day] = backendDateIso(dateIso).split("-").map(Number);
  const timeMatch = time.trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!year || !month || !day || !timeMatch) return new Date(NaN);
  const hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2]);
  const second = Number(timeMatch[3] ?? 0);
  const desiredWallMs = Date.UTC(year, month - 1, day, hour, minute, second);
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    });
    const probeParts = formatter.formatToParts(new Date(desiredWallMs));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(probeParts.find((item) => item.type === type)?.value ?? 0);
    const representedWallMs = Date.UTC(
      part("year"),
      part("month") - 1,
      part("day"),
      part("hour"),
      part("minute"),
      part("second"),
    );
    return new Date(desiredWallMs - (representedWallMs - desiredWallMs));
  } catch {
    return new Date(`${backendDateIso(dateIso)}T${normalizeBackendTime(time)}`);
  }
}

/** Absolute milliseconds for backend ISO/wall-clock values, for timers only. */
export function backendDateTimeMs(
  value: string,
  timeZone: string = EVENT_TIME_ZONE,
): number {
  const trimmed = value.trim();
  if (/(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed)) {
    return new Date(trimmed).getTime();
  }
  const date = backendDateIso(trimmed);
  const time = trimmed.match(/T(\d{1,2}:\d{2}(?::\d{2})?)/)?.[1];
  return date && time
    ? zonedDateTimeFromParts(date, time, timeZone).getTime()
    : new Date(trimmed).getTime();
}

const datePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: EVENT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function normalizeBackendTime(time: string): string {
  const trimmed = time.trim();
  return /^\d{2}:\d{2}$/.test(trimmed) ? `${trimmed}:00` : trimmed;
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
