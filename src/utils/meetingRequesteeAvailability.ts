/**
 * Client-side hints: hide physical slots where the requestee already has a
 * pending/accepted meeting overlapping that window (from *our* GET /meetings/
 * and virtual meetings). Meetings where the requestee is busy with someone
 * else are not visible in that list — backend remains authoritative.
 */

import type { Meeting, MeetingSlot, VirtualMeeting } from "../services/meetingService";

const ACTIVE_STATUSES = new Set(["pending", "accepted"]);

function timeToSeconds(t: string): number {
  const parts = t.split(":").map((x) => parseInt(x, 10));
  const h = parts[0] || 0;
  const m = parts[1] || 0;
  const s = parts[2] || 0;
  return h * 3600 + m * 60 + s;
}

/** True if [startA, endA) overlaps [startB, endB) (wall-clock, same calendar day). */
export function timeRangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
): boolean {
  const a1 = timeToSeconds(startA);
  const a2 = timeToSeconds(endA);
  const b1 = timeToSeconds(startB);
  const b2 = timeToSeconds(endB);
  return a1 < b2 && b1 < a2;
}

function meetingPhysicalDate(m: Meeting): string | undefined {
  const d = m.slot?.date;
  return d ? d.slice(0, 10) : undefined;
}

function involvesUser(
  meeting: Meeting | VirtualMeeting,
  userId: string,
): boolean {
  const u = String(userId);
  return String(meeting.requester) === u || String(meeting.requestee) === u;
}

function virtualBlockEndTime(
  scheduledTime: string,
  durationMinutes: number,
): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const startSec = timeToSeconds(scheduledTime);
  let endSec = startSec + durationMinutes * 60;
  const hh = Math.floor(endSec / 3600) % 24;
  endSec %= 3600;
  const mm = Math.floor(endSec / 60);
  const ss = endSec % 60;
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

/** Physical table slot vs in-person meetings in the list. */
export function physicalSlotConflictsWithMeetings(
  slot: MeetingSlot,
  meetings: Meeting[],
  requesteeId: string,
): boolean {
  const slotDate = slot.date?.slice(0, 10);
  if (!slotDate) return false;

  for (const m of meetings) {
    if (!ACTIVE_STATUSES.has(m.status)) continue;
    if (!involvesUser(m, requesteeId)) continue;
    const md = meetingPhysicalDate(m);
    if (md !== slotDate) continue;
    if (
      timeRangesOverlap(
        slot.start_time,
        slot.end_time,
        m.slot.start_time,
        m.slot.end_time,
      )
    ) {
      return true;
    }
  }
  return false;
}

/** Physical table slot vs virtual meetings (same day + overlapping time). */
export function physicalSlotConflictsWithVirtualMeetings(
  slot: MeetingSlot,
  virtualMeetings: VirtualMeeting[],
  requesteeId: string,
): boolean {
  const slotDate = slot.date?.slice(0, 10);
  if (!slotDate) return false;

  for (const v of virtualMeetings) {
    if (!ACTIVE_STATUSES.has(v.status)) continue;
    if (!involvesUser(v, requesteeId)) continue;
    const vd = v.scheduled_date?.slice(0, 10);
    if (vd !== slotDate) continue;
    const duration = v.duration_minutes ?? 20;
    const vEnd = virtualBlockEndTime(v.scheduled_time, duration);
    if (
      timeRangesOverlap(
        slot.start_time,
        slot.end_time,
        v.scheduled_time,
        vEnd,
      )
    ) {
      return true;
    }
  }
  return false;
}

export function filterPhysicalSlotsExcludingRequesteeBusyWindows(
  slots: MeetingSlot[],
  meetings: Meeting[],
  virtualMeetings: VirtualMeeting[],
  requesteeId: string,
): MeetingSlot[] {
  return slots.filter(
    (s) =>
      !physicalSlotConflictsWithMeetings(s, meetings, requesteeId) &&
      !physicalSlotConflictsWithVirtualMeetings(s, virtualMeetings, requesteeId),
  );
}
