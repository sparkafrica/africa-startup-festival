/**
 * Feature restrictions by ticket tier.
 *
 * - Meeting booking: Expo + Limited Pass tickets cannot book meetings.
 * - Initiating connections: Limited Pass cannot send connection requests (scan / attendees).
 *   They can accept incoming connections, then message those users (reactive-only networking).
 * - Expo: cannot book meetings, but can connect and message like other non-Limited tiers.
 *
 * Restricted flows show an "Upgrade ticket" CTA that navigates to My Ticket
 * (ScanQR with initialTab "My Ticket").
 */

import { Alert } from "react-native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { ticketService } from "../services/ticketService";
import { EVENT_ID } from "../config/env";
import { isExhibitionPass, isExpoPass } from "./ticketColors";

const MEETING_BLOCK_MESSAGE =
  "You cannot book meetings with your current ticket. Please upgrade your ticket to book meetings.";

const EXHIBITION_INITIATE_CONNECTION_MESSAGE =
  "Your Limited Pass cannot send connection requests. Accept incoming connections in Connections, then you can message. Upgrade your ticket to start connections yourself.";

/**
 * Resolve ticket type the same way as Menu and My Ticket (single source of truth).
 * Order: type.name → type.user_type → ticket_class.name → ticket_class.user_type.
 */
function getTicketTypeForRestrictions(ticket: { type?: { name?: string; user_type?: string }; ticket_class?: { name?: string; user_type?: string } } | null): string {
  if (!ticket) return "";
  return (
    ticket.type?.name ??
    ticket.type?.user_type ??
    ticket.ticket_class?.name ??
    ticket.ticket_class?.user_type ??
    ""
  );
}

/**
 * Returns true if the current user can book meetings (not Expo or Limited Pass).
 * Uses fresh ticket (bypassCache) so we match Menu badge and My Ticket; on error, blocks to be safe.
 */
export async function getCanUserBookMeetings(): Promise<boolean> {
  try {
    const ticket = await ticketService.getUserTicket(EVENT_ID, { bypassCache: true });
    const type = getTicketTypeForRestrictions(ticket ?? null);
    return !(isExpoPass(type) || isExhibitionPass(type));
  } catch {
    return false; // on error, block to be safe
  }
}

/**
 * Show the Expo "cannot book meetings" popup with an "Upgrade ticket" button
 * that navigates to My Ticket (ScanQR with initialTab "My Ticket").
 */
export function showExpoCannotBookMeetingAlert(
  navigation: NavigationProp<RootStackParamList>
): void {
  Alert.alert(
    "Upgrade required",
    MEETING_BLOCK_MESSAGE,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Upgrade ticket",
        onPress: () => {
          navigation.navigate("ScanQR", { initialTab: "My Ticket" });
        },
      },
    ],
    { cancelable: true }
  );
}

/**
 * Returns true if the current user can send a connection request (initiator).
 * Limited Pass holders cannot initiate; they can only accept incoming connections.
 */
export async function getCanUserInitiateConnection(): Promise<boolean> {
  try {
    const ticket = await ticketService.getUserTicket(EVENT_ID, { bypassCache: true });
    const type = getTicketTypeForRestrictions(ticket ?? null);
    return !isExhibitionPass(type);
  } catch {
    return false; // on error, block to be safe
  }
}

/**
 * Shown when Limited Pass user taps Connect from scan / attendees (outbound request blocked).
 */
export function showExhibitionCannotInitiateConnectionAlert(
  navigation: NavigationProp<RootStackParamList>
): void {
  Alert.alert(
    "Upgrade required",
    EXHIBITION_INITIATE_CONNECTION_MESSAGE,
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Upgrade ticket",
        onPress: () => {
          navigation.navigate("ScanQR", { initialTab: "My Ticket" });
        },
      },
    ],
    { cancelable: true }
  );
}
