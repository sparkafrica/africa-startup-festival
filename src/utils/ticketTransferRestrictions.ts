/** Client-side cutoff for ASF Kenya ticket transfers and quota assignments. */
import { Alert } from "react-native";
import { EVENT_DAY_ISO } from "../config/env";
import { getEventDateIso } from "./eventTime";

export function isTicketTransferDeadlinePassed(now = Date.now()): boolean {
  return getEventDateIso(now) >= EVENT_DAY_ISO;
}

export function isTicketTransferBlockedForEvent(eventId: number): boolean {
  return eventId === 11 && isTicketTransferDeadlinePassed();
}

export function showTicketTransferDeadlineAlert(): void {
  Alert.alert("Ticket transfers closed", "Ticket transfers are closed for this event.");
}
