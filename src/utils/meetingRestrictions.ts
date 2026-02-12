/**
 * Meeting booking restrictions: Expo pass holders cannot book meetings.
 * Show popup with upgrade CTA that links to ticket upgrade (My Ticket).
 */

import { Alert } from "react-native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { ticketService } from "../services/ticketService";
import { EVENT_ID } from "../config/env";
import { isExpoPass } from "./ticketColors";

const EXPO_BLOCK_MESSAGE =
  "You cannot book meetings with an Expo Pass. Please upgrade your ticket to book meetings.";

/**
 * Returns true if the current user can book meetings (not an Expo pass).
 * Fetches user ticket; returns false for Expo / attendee / general.
 */
export async function getCanUserBookMeetings(): Promise<boolean> {
  try {
    const ticket = await ticketService.getUserTicket(EVENT_ID);
    const type = ticket?.type?.user_type ?? ticket?.type?.name ?? "";
    return !isExpoPass(type);
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
    EXPO_BLOCK_MESSAGE,
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
