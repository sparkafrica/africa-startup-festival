/**
 * ASF event calendar (West Africa Time).
 * TODO: Set Kenya / Lagos dates when confirmed with backend.
 */

import { DAY_FILTER_ID_TO_ISO_DATE } from "./scheduleFilters";
import { getEventDateIso } from "./eventTime";

/** Placeholder — update when ASF programme days are confirmed. */
export const EVENT_DAY_1_ISO = "2099-01-01";
export const EVENT_DAY_2_ISO = "2099-01-02";

export const EVENT_DAY_1_FILTER_ID = "Day 1";
export const EVENT_DAY_2_FILTER_ID = "Day 2";

/** Today's calendar date at the Kenya event (YYYY-MM-DD). */
export function getEventTodayIso(now = Date.now()): string {
  return getEventDateIso(now);
}

export function isDay2OrLater(now = Date.now()): boolean {
  return getEventTodayIso(now) >= EVENT_DAY_2_ISO;
}

/** Default programme day filter — Day 2 once day 2 has started in Kenya. */
export function getDefaultScheduleDayFilterIds(now = Date.now()): string[] {
  const today = getEventTodayIso(now);
  if (today >= EVENT_DAY_2_ISO) return [EVENT_DAY_2_FILTER_ID];
  if (today >= EVENT_DAY_1_ISO) return [EVENT_DAY_1_FILTER_ID];
  return [];
}

export function dayFilterIdToIso(filterId: string): string | undefined {
  return DAY_FILTER_ID_TO_ISO_DATE[filterId];
}
