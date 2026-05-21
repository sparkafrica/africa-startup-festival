import type { EventSchedule } from "../services/eventService";
import { parseScheduleSpeakersRaw } from "./scheduleSpeakers";

function formatTime12h(date: Date): string {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const minutesStr = minutes.toString().padStart(2, "0");
  return `${hour12}:${minutesStr} ${period}`;
}

export function formatTimeRangeFromIso(
  startTime: string,
  endTime: string,
): string {
  const start = new Date(startTime);
  const end = new Date(endTime);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "";
  return `${formatTime12h(start)} – ${formatTime12h(end)}`;
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
): "main-stage" | "enterprise-stage" {
  const v = (venue ?? "").toLowerCase();
  if (v.includes("enterprise")) return "enterprise-stage";
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
): "main-stage" | "enterprise-stage" {
  const row = schedules?.find((s) => s.id === scheduleId);
  return venueToStageKey(row?.venue);
}
