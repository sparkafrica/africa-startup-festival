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
  blocksMeetingBookingForTicket,
  collectTicketTypeStrings,
} from "./asfTicketClass";

const MEETING_BLOCK_MESSAGE =
  "Explorer passes cannot book meetings. Upgrade your pass to access the meeting booking feature.";

export async function getCanUserBookMeetings(): Promise<boolean> {
  try {
    const ticket = await ticketService.getUserTicket(EVENT_ID, {
      bypassCache: true,
    });
    const blocked = blocksMeetingBookingForTicket(ticket ?? null);
    if (__DEV__) {
      console.log("[meetingRestrictions] canBookMeetings", {
        blocked,
        canBook: !blocked,
        ticketFields: collectTicketTypeStrings(ticket ?? null),
      });
    }
    return !blocked;
  } catch {
    return false;
  }
}

export function showExpoCannotBookMeetingAlert(
  navigation: NavigationProp<RootStackParamList>,
): void {
  Alert.alert(
    "Access restricted",
    MEETING_BLOCK_MESSAGE,
    [
      {
        text: "Upgrade ticket",
        onPress: () =>
          navigation.navigate("ScanQR", {
            initialTab: "My Ticket",
            openUpgrade: true,
          }),
      },
      { text: "OK" },
    ],
    { cancelable: true },
  );
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
