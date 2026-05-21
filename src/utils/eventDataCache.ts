/**
 * Shared in-memory cache for static event content (programme, speakers).
 * Bootstrapped from Home; Schedule/Speakers read cache first; stale refresh on focus.
 */

import { EVENT_ID } from "../config/env";
import {
  eventService,
  type EventSchedule,
  type Speaker,
} from "../services/eventService";
import {
  getEventDates,
  inferExpoDatesFromSchedules,
  setExpoEventDates,
} from "./scheduleFilters";

/** Refetch programme/speakers in background after this long (Phase 2). */
export const EVENT_DATA_STALE_MS = 60_000;

/** Meetings / connections: avoid refetch on every tab focus. */
export const FOCUS_LIST_STALE_MS = 60_000;

let cachedSchedules: EventSchedule[] | null = null;
let schedulesFetchedAt = 0;

let cachedSpeakers: Speaker[] | null = null;
let speakersFetchedAt = 0;

let programmeFetchPromise: Promise<EventSchedule[]> | null = null;
let speakersFetchPromise: Promise<Speaker[]> | null = null;

let meetingsListFetchedAt = 0;
let connectionsListFetchedAt = 0;

function isStale(fetchedAt: number): boolean {
  if (fetchedAt === 0) return true;
  return Date.now() - fetchedAt > EVENT_DATA_STALE_MS;
}

export function getCachedEventSchedules(): EventSchedule[] | null {
  return cachedSchedules;
}

export function getCachedEventSpeakers(): Speaker[] | null {
  return cachedSpeakers;
}

export function setCachedEventSchedules(schedules: EventSchedule[]): void {
  cachedSchedules = schedules;
  schedulesFetchedAt = Date.now();
  setExpoEventDates(inferExpoDatesFromSchedules(schedules));
}

export function setCachedEventSpeakers(speakers: Speaker[]): void {
  cachedSpeakers = speakers;
  speakersFetchedAt = Date.now();
}

export function clearCachedEventSchedules(): void {
  cachedSchedules = null;
  schedulesFetchedAt = 0;
  programmeFetchPromise = null;
  setExpoEventDates([]);
}

export function clearCachedEventSpeakers(): void {
  cachedSpeakers = null;
  speakersFetchedAt = 0;
  speakersFetchPromise = null;
}

export function isProgrammeCacheFresh(): boolean {
  return !!cachedSchedules?.length && !isStale(schedulesFetchedAt);
}

export function isSpeakersCacheFresh(): boolean {
  return !!cachedSpeakers?.length && !isStale(speakersFetchedAt);
}

async function loadProgrammeFromApi(force: boolean): Promise<EventSchedule[]> {
  if (!force && isProgrammeCacheFresh() && cachedSchedules) {
    return cachedSchedules;
  }

  if (programmeFetchPromise) {
    return programmeFetchPromise;
  }

  programmeFetchPromise = (async () => {
    const schedules = await eventService.getAllEventSchedules(EVENT_ID, {
      ordering: "start_time",
    });
    setCachedEventSchedules(schedules);
    try {
      const event = await eventService.getEventDetails(EVENT_ID);
      const dates = getEventDates(event);
      if (dates.length > 0) setExpoEventDates(dates);
    } catch {
      // inferExpoDatesFromSchedules already applied in setCachedEventSchedules
    }
    return schedules;
  })();

  try {
    return await programmeFetchPromise;
  } finally {
    programmeFetchPromise = null;
  }
}

async function loadSpeakersFromApi(force: boolean): Promise<Speaker[]> {
  if (!force && isSpeakersCacheFresh() && cachedSpeakers) {
    return cachedSpeakers;
  }

  if (speakersFetchPromise) {
    return speakersFetchPromise;
  }

  speakersFetchPromise = (async () => {
    const response = await eventService.getEventSpeakers(EVENT_ID, {
      page_size: 100,
      ordering: "-id",
    });
    setCachedEventSpeakers(response.speakers);
    return response.speakers;
  })();

  try {
    return await speakersFetchPromise;
  } finally {
    speakersFetchPromise = null;
  }
}

/** Ensure programme is loaded; dedupes concurrent callers. */
export function ensureEventProgramme(options?: {
  force?: boolean;
}): Promise<EventSchedule[]> {
  return loadProgrammeFromApi(options?.force ?? false);
}

/** Ensure speaker list is loaded; dedupes concurrent callers. */
export function ensureEventSpeakers(options?: {
  force?: boolean;
}): Promise<Speaker[]> {
  return loadSpeakersFromApi(options?.force ?? false);
}

/**
 * Warm programme + speakers after Home loads (Phase 1).
 * Safe to call multiple times; shares in-flight requests.
 */
export function bootstrapEventData(options?: {
  force?: boolean;
}): Promise<void> {
  const force = options?.force ?? false;
  return Promise.all([
    ensureEventProgramme({ force }),
    ensureEventSpeakers({ force }),
  ]).then(() => undefined);
}

export function shouldRefetchMeetingsOnFocus(hasLocalData: boolean): boolean {
  if (!hasLocalData) return true;
  return Date.now() - meetingsListFetchedAt > FOCUS_LIST_STALE_MS;
}

export function markMeetingsFetched(): void {
  meetingsListFetchedAt = Date.now();
}

export function shouldRefetchConnectionsOnFocus(hasLocalData: boolean): boolean {
  if (!hasLocalData) return true;
  return Date.now() - connectionsListFetchedAt > FOCUS_LIST_STALE_MS;
}

export function markConnectionsFetched(): void {
  connectionsListFetchedAt = Date.now();
}
