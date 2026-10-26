/**
 * Feature restrictions by ASF pass tier.
 *
 * - Limited Pass: exhibition + food court only — no networking.
 * - Every other pass: full connect, messaging, and meeting access.
 */

import { Alert } from "react-native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { ticketService } from "../services/ticketService";
import { EVENT_ID } from "../config/env";
import {
  blocksAcceptingConnectionForTicket,
  blocksAcceptingMeetingForTicket,
  blocksInitiatingConnectionForTicket,
  blocksMeetingBookingForTicket,
  collectTicketTypeStrings,
  ticketIsLimitedPass,
} from "./asfTicketClass";

export const LIMITED_PASS_NETWORKING_MESSAGE =
  "Limited Pass holders cannot use networking features. Upgrade your pass to connect and book meetings.";

async function getUserTicket() {
  return ticketService.getUserTicket(EVENT_ID, { bypassCache: true });
}

export async function getCanUserBookMeetings(): Promise<boolean> {
  try {
    const ticket = await getUserTicket();
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

/** Limited Pass is the sole networking restriction across ASF. */
export async function getCanUserUseNetworking(): Promise<boolean> {
  try {
    const ticket = await getUserTicket();
    return !ticketIsLimitedPass(ticket ?? null);
  } catch {
    return false;
  }
}

export async function getCanUserInitiateConnection(): Promise<boolean> {
  try {
    const ticket = await getUserTicket();
    const blocked = blocksInitiatingConnectionForTicket(ticket ?? null);
    if (__DEV__) {
      console.log("[meetingRestrictions] canInitiateConnection", {
        blocked,
        canInitiate: !blocked,
        ticketFields: collectTicketTypeStrings(ticket ?? null),
      });
    }
    return !blocked;
  } catch {
    return false;
  }
}

export async function getCanUserAcceptConnection(): Promise<boolean> {
  try {
    const ticket = await getUserTicket();
    return !blocksAcceptingConnectionForTicket(ticket ?? null);
  } catch {
    return false;
  }
}

export async function getCanUserAcceptMeeting(): Promise<boolean> {
  try {
    const ticket = await getUserTicket();
    return !blocksAcceptingMeetingForTicket(ticket ?? null);
  } catch {
    return false;
  }
}

function openUpgradeTicket(navigation: NavigationProp<RootStackParamList>): void {
  navigation.navigate("ScanQR", {
    initialTab: "My Ticket",
    openUpgrade: true,
  });
}

export function showExpoCannotBookMeetingAlert(
  navigation: NavigationProp<RootStackParamList>,
): void {
  void (async () => {
    let message =
      "We couldn't verify your meeting access. Please try again.";
    try {
      const ticket = await getUserTicket();
      if (ticketIsLimitedPass(ticket ?? null)) {
        message = LIMITED_PASS_NETWORKING_MESSAGE;
      }
    } catch {
      // Keep the verification fallback.
    }

    Alert.alert(
      "Access restricted",
      message,
      [
        {
          text: "Upgrade ticket",
          onPress: () => openUpgradeTicket(navigation),
        },
        { text: "OK" },
      ],
      { cancelable: true },
    );
  })();
}

export function showLimitedPassNetworkingAlert(
  navigation: NavigationProp<RootStackParamList>,
): void {
  Alert.alert(
    "Access restricted",
    LIMITED_PASS_NETWORKING_MESSAGE,
    [
      {
        text: "Upgrade ticket",
        onPress: () => openUpgradeTicket(navigation),
      },
      { text: "OK" },
    ],
    { cancelable: true },
  );
}

/** @deprecated Use showLimitedPassNetworkingAlert — kept for existing call sites. */
export function showExhibitionCannotInitiateConnectionAlert(
  navigation: NavigationProp<RootStackParamList>,
): void {
  showLimitedPassNetworkingAlert(navigation);
}
