/** Calendar + time helpers for virtual meeting requests. */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

export function toDateIso(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

export function parseDateIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split("-").map(Number);
  return { y, m, d };
}

export function todayIsoLocal(): string {
  const now = new Date();
  return toDateIso(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDaysToIso(iso: string, days: number): string {
  const { y, m, d } = parseDateIso(iso);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + days);
  return toDateIso(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

export function formatDateLong(iso: string): string {
  const { y, m, d } = parseDateIso(iso);
  const dt = new Date(y, m - 1, d);
  const weekday = dt.toLocaleDateString("en-GB", { weekday: "long" });
  return `${weekday}, ${d} ${MONTH_NAMES[m - 1]} ${y}`;
}

export function formatMonthYear(y: number, m: number): string {
  return `${MONTH_NAMES[m - 1]} ${y}`;
}

export function compareIso(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export interface CalendarCell {
  iso: string;
  day: number;
  inMonth: boolean;
}

/** Monday-first grid cells for a month view. */
export function buildMonthGrid(year: number, month: number): CalendarCell[] {
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7; // Mon=0
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startWeekday; i++) {
    const prev = new Date(year, month - 1, -startWeekday + i + 1);
    cells.push({
      iso: toDateIso(prev.getFullYear(), prev.getMonth() + 1, prev.getDate()),
      day: prev.getDate(),
      inMonth: false,
    });
  }

  for (let d = 1; d <= lastDay; d++) {
    cells.push({ iso: toDateIso(year, month, d), day: d, inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    const nextIndex = cells.length - (startWeekday + lastDay) + 1;
    const next = new Date(year, month, nextIndex);
    cells.push({
      iso: toDateIso(next.getFullYear(), next.getMonth() + 1, next.getDate()),
      day: next.getDate(),
      inMonth: false,
    });
  }

  return cells;
}

export function shiftMonth(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const dt = new Date(year, month - 1 + delta, 1);
  return { year: dt.getFullYear(), month: dt.getMonth() + 1 };
}

export interface TimeOption {
  id: string;
  label: string;
  apiValue: string;
}

/** Generate start times every `intervalMinutes` between startHour and endHour (exclusive end). */
export function generateTimeOptions(
  intervalMinutes = 15,
  startHour = 8,
  endHour = 21,
): TimeOption[] {
  const options: TimeOption[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += intervalMinutes) {
      const period = h >= 12 ? "PM" : "AM";
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const label = `${hour12}:${pad2(m)} ${period}`;
      options.push({
        id: `${h}-${m}`,
        label,
        apiValue: `${pad2(h)}:${pad2(m)}:00`,
      });
    }
  }
  return options;
}

/** Parse display time ("2:30 PM" or "2:30 PM - 3:00 PM") to HH:MM:SS. */
export function parseDisplayTimeToApi(timeDisplay: string): string {
  try {
    const startStr = timeDisplay.split(" - ")[0].trim();
    const match = startStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return "10:00:00";
    let h = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();
    if (period === "PM" && h !== 12) h += 12;
    else if (period === "AM" && h === 12) h = 0;
    return `${pad2(h)}:${minutes}:00`;
  } catch {
    return "10:00:00";
  }
}

export function extractStartTimeDisplay(timeDisplay: string): string {
  const trimmed = timeDisplay.trim();
  if (trimmed.includes(" - ")) return trimmed.split(" - ")[0].trim();
  return trimmed;
}

/** Parse "26th June, 2026" or YYYY-MM-DD to ISO date. */
export function parseFlexibleDateToIso(input: string): string | null {
  const trimmed = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const match = trimmed.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+),\s+(\d{4})/i);
  if (!match) return null;
  const [, day, monthName, year] = match;
  const monthMap: Record<string, string> = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };
  const month = monthMap[monthName?.toLowerCase() ?? ""];
  if (!month) return null;
  return `${year}-${month}-${pad2(parseInt(day, 10))}`;
}

export { WEEKDAY_LABELS };
