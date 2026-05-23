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

/**
 * Personal-schedule API rows are often slim (no metadata/speakers).
 * Merge with the cached full programme row so My Schedule badges match Schedule tab.
 */
export function enrichEventScheduleFromCache(
  schedule: EventSchedule,
): EventSchedule {
  const full = cachedSchedules?.find((row) => row.id === schedule.id);
  if (!full) return schedule;

  const fullMeta =
    full.metadata && typeof full.metadata === "object" ? full.metadata : {};
  const scheduleMeta =
    schedule.metadata && typeof schedule.metadata === "object"
      ? schedule.metadata
      : {};
  const mergedMeta =
    Object.keys(fullMeta).length > 0 || Object.keys(scheduleMeta).length > 0
      ? { ...fullMeta, ...scheduleMeta }
      : schedule.metadata ?? full.metadata;

  let mergedEvent = schedule.event;
  if (typeof schedule.event === "number" && typeof full.event === "object") {
    mergedEvent = full.event;
  } else if (
    typeof schedule.event === "object" &&
    schedule.event &&
    typeof full.event === "object" &&
    full.event
  ) {
    const fe = full.event;
    const se = schedule.event;
    const feMeta =
      fe.metadata && typeof fe.metadata === "object" ? fe.metadata : {};
    const seMeta =
      se.metadata && typeof se.metadata === "object" ? se.metadata : {};
    mergedEvent = {
      ...fe,
      ...se,
      metadata:
        Object.keys(feMeta).length > 0 || Object.keys(seMeta).length > 0
          ? { ...feMeta, ...seMeta }
          : se.metadata ?? fe.metadata,
    };
  }

  const speakersAreIdsOnly =
    Array.isArray(schedule.speakers) &&
    schedule.speakers.length > 0 &&
    typeof schedule.speakers[0] === "number";

  return {
    ...full,
    ...schedule,
    metadata: mergedMeta as EventSchedule["metadata"],
    description: schedule.description ?? full.description,
    venue: schedule.venue ?? full.venue,
    event: mergedEvent,
    speakers: speakersAreIdsOnly
      ? (full.speakers ?? schedule.speakers)
      : (schedule.speakers ?? full.speakers),
  };
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
