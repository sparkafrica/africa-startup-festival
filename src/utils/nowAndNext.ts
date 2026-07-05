/**
 * Next upcoming meeting + personal schedule session for Home "Now & Next" strip.
 */

import { EVENT_ID } from "../config/env";
import { eventService } from "../services/eventService";
import { meetingService, type Meeting, type VirtualMeeting } from "../services/meetingService";
import { enrichEventScheduleFromCache } from "./eventDataCache";
import { getWatDateIso } from "./eventDay";
import { formatCountdownToStart } from "./scheduleUpcoming";

export type NowAndNextKind = "meeting" | "session";

export interface NowAndNextItem {
  kind: NowAndNextKind;
  title: string;
  subtitle: string;
  countdown: string;
  startMs: number;
  meetingId?: number;
  eventScheduleId?: number;
}

function parseDateLabel(label: string): string | null {
  const match = label.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+),?\s+(\d{4})/i);
  if (!match) return null;
  const months: Record<string, string> = {
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
  const month = months[match[2].toLowerCase()];
  if (!month) return null;
  const day = match[1].padStart(2, "0");
  return `${match[3]}-${month}-${day}`;
}

function physicalMeetingStartMs(meeting: Meeting): number | null {
  if (meeting.status !== "accepted") return null;
  const slot = meeting.slot;
  if (!slot?.start_time) return null;

  let date = slot.date?.slice(0, 10);
  const metaDate = meeting.metadata?.selectedDate;
  if (!date && typeof metaDate === "string") {
    if (/^\d{4}-\d{2}-\d{2}/.test(metaDate)) {
      date = metaDate.slice(0, 10);
    } else {
      date = parseDateLabel(metaDate) ?? undefined;
    }
  }
  if (!date && meeting.created_at) {
    date = meeting.created_at.slice(0, 10);
  }
  if (!date) return null;

  const [h, m] = slot.start_time.split(":").map((v) => parseInt(v, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return new Date(
    `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+01:00`,
  ).getTime();
}

function virtualMeetingStartMs(meeting: VirtualMeeting): number | null {
  if (meeting.status !== "accepted") return null;
  const date = meeting.scheduled_date?.slice(0, 10);
  const time = meeting.scheduled_time;
  if (!date || !time) return null;
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return new Date(
    `${date}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00+01:00`,
  ).getTime();
}

function meetingParticipantName(
  meeting: Meeting | VirtualMeeting,
  currentUserId: string,
): string {
  const isRequester = String(meeting.requester) === String(currentUserId);
  const other = isRequester ? meeting.requestee_info : meeting.requester_info;
  const name =
    `${other?.first_name ?? ""} ${other?.last_name ?? ""}`.trim() ||
    other?.email ||
    "Attendee";
  return name;
}

export async function fetchNowAndNextItems(
  currentUserId: string,
  now = Date.now(),
): Promise<{ meeting: NowAndNextItem | null; session: NowAndNextItem | null }> {
  const todayIso = getWatDateIso(now);
  const candidates: NowAndNextItem[] = [];

  try {
    const [physical, virtual, personal] = await Promise.all([
      meetingService.getMeetings(),
      meetingService.getVirtualMeetings(),
      eventService.getPersonalSchedules(EVENT_ID),
    ]);

    for (const m of physical) {
      const startMs = physicalMeetingStartMs(m);
      if (startMs == null || startMs <= now) continue;
      const dateIso = new Date(startMs).toISOString().slice(0, 10);
      if (dateIso < todayIso) continue;
      candidates.push({
        kind: "meeting",
        title: `Meeting with ${meetingParticipantName(m, currentUserId)}`,
        subtitle: "Meetings",
        countdown: formatCountdownToStart(startMs, now),
        startMs,
        meetingId: m.id,
      });
    }

    for (const m of virtual) {
      const startMs = virtualMeetingStartMs(m);
      if (startMs == null || startMs <= now) continue;
      const dateIso = m.scheduled_date?.slice(0, 10) ?? "";
      if (dateIso && dateIso < todayIso) continue;
      candidates.push({
        kind: "meeting",
        title: `Meeting with ${meetingParticipantName(m, currentUserId)}`,
        subtitle: "Meetings",
        countdown: formatCountdownToStart(startMs, now),
        startMs,
        meetingId: m.id,
      });
    }

    for (const row of personal.schedules) {
      const schedule = enrichEventScheduleFromCache(row.event_schedule);
      if (!schedule || typeof schedule !== "object") continue;
      const startMs = new Date(schedule.start_time).getTime();
      const endMs = new Date(schedule.end_time).getTime();
      if (!Number.isFinite(startMs) || startMs <= now || now >= endMs) continue;
      const venue =
        schedule.venue?.trim() ||
        (typeof schedule.event === "object"
          ? schedule.event?.venue?.trim()
          : "") ||
        "Main Stage";
      candidates.push({
        kind: "session",
        title: schedule.name,
        subtitle: venue,
        countdown: formatCountdownToStart(startMs, now),
        startMs,
        eventScheduleId: schedule.id,
      });
    }
  } catch {
    return { meeting: null, session: null };
  }

  const meetings = candidates
    .filter((c) => c.kind === "meeting")
    .sort((a, b) => a.startMs - b.startMs);
  const sessions = candidates
    .filter((c) => c.kind === "session")
    .sort((a, b) => a.startMs - b.startMs);

  return {
    meeting: meetings[0] ?? null,
    session: sessions[0] ?? null,
  };
}
