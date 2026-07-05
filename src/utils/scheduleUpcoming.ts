/**
 * Upcoming session helpers — happening soon, Slido live window, countdown copy.
 */

import type { EventSchedule } from "../services/eventService";
import { parseScheduleCardMetadata } from "./scheduleMetadata";
import { getWatDateIso } from "./eventDay";
import { scheduleStartDateIso } from "./scheduleFilters";

/** Sessions starting within this window get the "Starting soon" badge. */
export const HAPPENING_SOON_MS = 60 * 60 * 1000;

/** Slido nudge: from this long before start until session end. */
export const SLIDO_NUDGE_LEAD_MS = 15 * 60 * 1000;

export function parseScheduleTimes(
  startTime: string,
  endTime: string,
): { startMs: number; endMs: number } {
  return {
    startMs: new Date(startTime).getTime(),
    endMs: new Date(endTime).getTime(),
  };
}

export function isSessionSoonOrLive(
  startMs: number,
  endMs: number,
  now = Date.now(),
): boolean {
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return false;
  if (now >= endMs) return false;
  if (now >= startMs) return true;
  return startMs - now <= HAPPENING_SOON_MS;
}

export function formatCountdownToStart(
  startMs: number,
  now = Date.now(),
): string {
  const diff = startMs - now;
  if (diff <= 0) return "Now";
  const totalMins = Math.ceil(diff / (60 * 1000));
  if (totalMins < 60) return `in ${totalMins} min`;
  const hrs = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `in ${hrs}h ${mins}m` : `in ${hrs}h`;
}

export interface LiveSlidoSession {
  eventScheduleId: number;
  title: string;
  slidoUrl: string;
  stage: string;
}

export function findLiveSlidoSession(
  schedules: EventSchedule[],
  now = Date.now(),
): LiveSlidoSession | null {
  const todayIso = getWatDateIso(now);
  let best: LiveSlidoSession | null = null;
  let bestStart = Infinity;

  for (const schedule of schedules) {
    if (scheduleStartDateIso(schedule.start_time) !== todayIso) continue;
    const eventObj =
      typeof schedule.event === "object" ? schedule.event : null;
    const { slidoUrl } = parseScheduleCardMetadata(
      schedule.metadata,
      eventObj?.metadata,
    );
    if (!slidoUrl) continue;

    const { startMs, endMs } = parseScheduleTimes(
      schedule.start_time,
      schedule.end_time,
    );
    const windowStart = startMs - SLIDO_NUDGE_LEAD_MS;
    if (now < windowStart || now >= endMs) continue;

    if (startMs < bestStart) {
      bestStart = startMs;
      const venue =
        schedule.venue?.trim() ||
        (typeof schedule.event === "object"
          ? schedule.event?.venue?.trim()
          : "") ||
        "Main Stage";
      best = {
        eventScheduleId: schedule.id,
        title: schedule.name,
        slidoUrl,
        stage: venue,
      };
    }
  }

  return best;
}
