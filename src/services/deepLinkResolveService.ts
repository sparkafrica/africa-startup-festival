/**
 * Resolve deeplink entity ids when the target row is not yet in a loaded list.
 */

import { EVENT_ID } from "../config/env";
import { attendeeService, type Attendee } from "./attendeeService";
import { connectionService, type Connection } from "./connectionService";
import {
  eventService,
  type EventSchedule,
} from "./eventService";
import { meetingService, type Meeting } from "./meetingService";
import { enrichEventScheduleFromCache } from "../utils/eventDataCache";

export async function resolveEventScheduleById(
  scheduleId: number,
): Promise<EventSchedule | null> {
  try {
    const schedule = await eventService.getEventScheduleDetails(
      EVENT_ID,
      scheduleId,
    );
    return enrichEventScheduleFromCache(schedule);
  } catch {
    return null;
  }
}

export async function resolveConnectionById(
  connectionId: number,
): Promise<Connection | null> {
  return connectionService.getConnectionById(connectionId);
}

export async function resolveAttendeeByUserId(
  userId: string,
): Promise<Attendee | null> {
  return attendeeService.getAttendeeByUserId(EVENT_ID, userId);
}

export async function resolveMeetingById(
  meetingId: number,
): Promise<Meeting | null> {
  return meetingService.getMeetingById(meetingId);
}

export async function resolveCompanyById(
  companyId: number,
  companyType: "exhibitor" | "partner",
) {
  try {
    return await eventService.getCompanyDetail(EVENT_ID, companyType, companyId);
  } catch {
    return null;
  }
}
