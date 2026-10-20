/**
 * Shared in-memory cache for physical + virtual meetings lists.
 * Dedupes concurrent fetches; stale-while-revalidate for Meetings tab, badge, messaging.
 */

import { isPostEventMode } from "../config/eventMode";
import {
  meetingService,
  type Meeting,
  type VirtualMeeting,
} from "../services/meetingService";
import { FOCUS_LIST_STALE_MS } from "./eventDataCache";

export type MeetingsListSnapshot = {
  physical: Meeting[];
  virtual: VirtualMeeting[];
  fetchedAt: number;
};

let snapshot: MeetingsListSnapshot | null = null;
let fetchPromise: Promise<MeetingsListSnapshot> | null = null;

const BADGE_STATUSES = new Set(["pending", "accepted"]);

export function getCachedMeetingsList(): MeetingsListSnapshot | null {
  return snapshot;
}

export function getCachedPhysicalMeetings(): Meeting[] {
  return snapshot?.physical ?? [];
}

export function getCachedVirtualMeetings(): VirtualMeeting[] {
  return snapshot?.virtual ?? [];
}

export function isMeetingsListCacheFresh(): boolean {
  if (!snapshot) return false;
  return Date.now() - snapshot.fetchedAt < FOCUS_LIST_STALE_MS;
}

export function shouldRefetchMeetingsOnFocus(hasLocalData: boolean): boolean {
  if (!hasLocalData) return true;
  return !isMeetingsListCacheFresh();
}

export function markMeetingsFetched(): void {
  if (snapshot) {
    snapshot = { ...snapshot, fetchedAt: Date.now() };
  }
}

export function setMeetingsListCache(
  physical: Meeting[],
  virtual: VirtualMeeting[],
): void {
  snapshot = {
    physical,
    virtual,
    fetchedAt: Date.now(),
  };
}

export function invalidateMeetingsListCache(): void {
  snapshot = null;
  fetchPromise = null;
}

export function countMeetingsForBadge(
  physical: Meeting[],
  virtual: VirtualMeeting[],
): number {
  const include = (status: string) => BADGE_STATUSES.has(status);
  return (
    physical.filter((m) => include(m.status)).length +
    virtual.filter((m) => include(m.status)).length
  );
}

export function countMeetingsForBadgeFromCache(): number {
  if (!snapshot) return 0;
  return countMeetingsForBadge(snapshot.physical, snapshot.virtual);
}

async function loadMeetingsFromApi(
  force: boolean,
): Promise<MeetingsListSnapshot> {
  if (!force && isMeetingsListCacheFresh() && snapshot) {
    return snapshot;
  }

  if (fetchPromise) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    const postEventVirtualOnly = isPostEventMode();
    let physical: Meeting[];
    let virtual: VirtualMeeting[];
    if (postEventVirtualOnly) {
      physical = [];
      virtual = await meetingService.getVirtualMeetings();
    } else {
      [physical, virtual] = await Promise.all([
        meetingService.getMeetings(),
        meetingService.getVirtualMeetings(),
      ]);
    }
    setMeetingsListCache(physical, virtual);
    return snapshot!;
  })();

  try {
    return await fetchPromise;
  } finally {
    fetchPromise = null;
  }
}

/** Load meetings; returns cache when fresh unless `force`. Dedupes in-flight requests. */
export function ensureMeetingsList(options?: {
  force?: boolean;
}): Promise<MeetingsListSnapshot> {
  return loadMeetingsFromApi(options?.force ?? false);
}
