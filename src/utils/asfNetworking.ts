/**
 * ASF networking rules — investor pass shortcuts; others must connect first.
 */

import { Alert } from "react-native";
import {
  attendeeLooksLikeInvestor,
  getCurrentUserTicketType,
  isInvestorPass,
} from "./asfTicketClass";

export const INVESTOR_CONNECTION_REQUIRED_MESSAGE =
  "Please request a connection first. Once connected, you'll be able to access this feature.";

export async function currentUserIsInvestor(): Promise<boolean> {
  const tier = await getCurrentUserTicketType();
  return isInvestorPass(tier);
}

export function targetIsInvestor(attendee: {
  ticketType?: string;
  userType?: string;
  role?: string;
}): boolean {
  return attendeeLooksLikeInvestor(attendee);
}

/**
 * Non-investors messaging an investor require an accepted connection.
 * Investors may message anyone without a prior connection.
 */
export async function canMessageAttendee(attendee: {
  ticketType?: string;
  userType?: string;
  role?: string;
  connectionStatus?: "pending" | "accepted" | null;
}): Promise<boolean> {
  if (await currentUserIsInvestor()) return true;
  if (!targetIsInvestor(attendee)) return true;
  return attendee.connectionStatus === "accepted";
}

export async function canRequestMeetingWithAttendee(attendee: {
  ticketType?: string;
  userType?: string;
  role?: string;
  connectionStatus?: "pending" | "accepted" | null;
}): Promise<boolean> {
  return canMessageAttendee(attendee);
}

export function showInvestorConnectionRequiredAlert(): void {
  Alert.alert("Connection required", INVESTOR_CONNECTION_REQUIRED_MESSAGE, [
    { text: "OK" },
  ]);
}
