/**
 * ASF networking rules — meeting booking vs messaging eligibility.
 */

import { Alert } from "react-native";
import {
  getCanUserUseNetworking,
  LIMITED_PASS_NETWORKING_MESSAGE,
} from "./meetingRestrictions";

export const MESSAGING_ACCESS_REQUIRED_MESSAGE =
  LIMITED_PASS_NETWORKING_MESSAGE;

/**
 * Every non-Limited Pass holder may message any attendee. Connections and
 * accepted meetings are no longer prerequisites for messaging.
 */
export async function canMessageAttendee(attendee: {
  connectionStatus?: "pending" | "accepted" | null;
  hasAcceptedMeeting?: boolean;
}): Promise<boolean> {
  void attendee;
  return getCanUserUseNetworking();
}

/**
 * Every non-Limited Pass holder may request meetings with any attendee.
 */
export async function canRequestMeetingWithAttendee(attendee: {
  ticketType?: string;
  userType?: string;
  role?: string;
  connectionStatus?: "pending" | "accepted" | null;
}): Promise<boolean> {
  void attendee;
  return getCanUserUseNetworking();
}

export function showMessagingAccessRequiredAlert(): void {
  Alert.alert("Messaging unavailable", MESSAGING_ACCESS_REQUIRED_MESSAGE, [
    { text: "OK" },
  ]);
}
