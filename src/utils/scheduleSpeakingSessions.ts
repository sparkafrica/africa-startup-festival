import type { EventSchedule } from "../services/eventService";
import { parseScheduleSpeakersRaw } from "./scheduleSpeakers";
import { EVENT_TIME_ZONE_LABEL, formatBackendClockTime } from "./eventTime";

export function formatTimeRangeFromIso(
  startTime: string,
  endTime: string,
): string {
  const start = formatBackendClockTime(startTime);
  const end = formatBackendClockTime(endTime);
  if (!start || !end) return "";
  return `${start} – ${end} ${EVENT_TIME_ZONE_LABEL}`;
}

/** "Session title · 1:25 PM – 1:55 PM" */
export function formatSpeakingSessionTitleLine(
  title: string,
  timeRange: string,
): string {
  const name = title.trim();
  const time = timeRange.trim();
  return time ? `${name} · ${time}` : name;
}

export interface SpeakingSessionRow {
  id: string;
  scheduleId: number;
  title: string;
  timeRange: string;
  titleLine: string;
  description: string;
  venue?: string;
}

export function venueToStageKey(
  venue: string | null | undefined,
): "main-stage" | "mentor-hours" {
  const v = (venue ?? "").toLowerCase();
  if (v.includes("mentor")) return "mentor-hours";
  return "main-stage";
}

export function scheduleIncludesSpeaker(
  schedule: EventSchedule,
  speakerId: number,
): boolean {
  return parseScheduleSpeakersRaw(schedule.speakers).some((item) => {
    if (typeof item === "number") return item === speakerId;
    if (item && typeof item === "object" && "id" in item) {
      return (item as { id: number }).id === speakerId;
    }
    return false;
  });
}

export function buildSpeakingSessionsFromSchedules(
  schedules: EventSchedule[],
  speakerId: number,
): SpeakingSessionRow[] {
  return schedules
    .filter((s) => scheduleIncludesSpeaker(s, speakerId))
    .map((schedule) => {
      const timeRange = formatTimeRangeFromIso(
        schedule.start_time,
        schedule.end_time,
      );
      const title = schedule.name;
      const description = schedule.description?.trim() || "";
      return {
        id: String(schedule.id),
        scheduleId: schedule.id,
        title,
        timeRange,
        titleLine: formatSpeakingSessionTitleLine(title, timeRange),
        description,
        venue: schedule.venue ?? undefined,
      };
    });
}

export function stageKeyForScheduleId(
  scheduleId: number,
  schedules: EventSchedule[] | null | undefined,
): "main-stage" | "mentor-hours" {
  const row = schedules?.find((s) => s.id === scheduleId);
  return venueToStageKey(row?.venue);
}
