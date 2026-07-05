/**
 * ASF event calendar (West Africa Time).
 * TODO: Set Kenya / Lagos dates when confirmed with backend.
 */

import { DAY_FILTER_ID_TO_ISO_DATE } from "./scheduleFilters";

/** Placeholder — update when ASF programme days are confirmed. */
export const EVENT_DAY_1_ISO = "2099-01-01";
export const EVENT_DAY_2_ISO = "2099-01-02";

export const EVENT_DAY_1_FILTER_ID = "Day 1";
export const EVENT_DAY_2_FILTER_ID = "Day 2";

const WAT_TIME_ZONE = "Africa/Lagos";

/** Today's calendar date in Lagos (YYYY-MM-DD). */
export function getWatDateIso(now = Date.now()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: WAT_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(now));
}

export function isDay2OrLater(now = Date.now()): boolean {
  return getWatDateIso(now) >= EVENT_DAY_2_ISO;
}

/** Default programme day filter — Day 2 once day 2 (WAT) has started. */
export function getDefaultScheduleDayFilterIds(now = Date.now()): string[] {
  const today = getWatDateIso(now);
  if (today >= EVENT_DAY_2_ISO) return [EVENT_DAY_2_FILTER_ID];
  if (today >= EVENT_DAY_1_ISO) return [EVENT_DAY_1_FILTER_ID];
  return [];
}

export function dayFilterIdToIso(filterId: string): string | undefined {
  return DAY_FILTER_ID_TO_ISO_DATE[filterId];
}
