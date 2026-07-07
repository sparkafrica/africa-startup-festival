/**
 * Feature restrictions by ASF pass tier.
 *
 * - Explorer: main-stage access only — no in-app meeting booking.
 * - All other passes: standard networking (subject to investor connection rules).
 */

import { Alert } from "react-native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { ticketService } from "../services/ticketService";
import { EVENT_ID } from "../config/env";
import {
  blocksMeetingBooking,
  ticketTypeFromTicket,
} from "./asfTicketClass";

const MEETING_BLOCK_MESSAGE =
  "Explorer passes cannot book meetings in the app. Upgrade your pass or connect at the event.";

function getTicketTypeForRestrictions(
  ticket: {
    type?: { name?: string; user_type?: string };
    ticket_class?: { name?: string; user_type?: string };
  } | null,
): string {
  return ticketTypeFromTicket(ticket);
}

export async function getCanUserBookMeetings(): Promise<boolean> {
  try {
    const ticket = await ticketService.getUserTicket(EVENT_ID, {
      bypassCache: true,
    });
    const type = getTicketTypeForRestrictions(ticket ?? null);
    return !blocksMeetingBooking(type);
  } catch {
    return false;
  }
}

export function showExpoCannotBookMeetingAlert(
  _navigation: NavigationProp<RootStackParamList>,
): void {
  Alert.alert("Access restricted", MEETING_BLOCK_MESSAGE, [{ text: "OK" }], {
    cancelable: true,
  });
}

/** ASF: all pass holders may initiate connections (investor rules handled separately). */
export async function getCanUserInitiateConnection(): Promise<boolean> {
  return true;
}

export function showExhibitionCannotInitiateConnectionAlert(
  _navigation: NavigationProp<RootStackParamList>,
): void {
  Alert.alert("Access restricted", "You cannot send connection requests.", [
    { text: "OK" },
  ]);
}
