/**
 * ASF networking rules — meeting booking vs messaging eligibility.
 */

import { Alert } from "react-native";
import {
  attendeeLooksLikeInvestor,
  getCurrentUserTicketType,
  isInvestorPass,
} from "./asfTicketClass";
import { canMessagePeer } from "./messagingEligibility";

export const INVESTOR_CONNECTION_REQUIRED_MESSAGE =
  "Please request a connection first. Once connected, you'll be able to access this feature.";

export const MESSAGING_ACCESS_REQUIRED_MESSAGE =
  "Connect with this attendee, or accept a meeting request, to send messages.";

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
 * Messaging requires an accepted connection or an accepted meeting — all pass tiers.
 */
export async function canMessageAttendee(attendee: {
  connectionStatus?: "pending" | "accepted" | null;
  hasAcceptedMeeting?: boolean;
}): Promise<boolean> {
  return canMessagePeer(attendee);
}

/**
 * Non-investors booking with an investor require an accepted connection first.
 * Investors may request meetings with anyone.
 */
export async function canRequestMeetingWithAttendee(attendee: {
  ticketType?: string;
  userType?: string;
  role?: string;
  connectionStatus?: "pending" | "accepted" | null;
}): Promise<boolean> {
  if (await currentUserIsInvestor()) return true;
  if (!targetIsInvestor(attendee)) return true;
  return attendee.connectionStatus === "accepted";
}

export function showInvestorConnectionRequiredAlert(): void {
  Alert.alert("Connection required", INVESTOR_CONNECTION_REQUIRED_MESSAGE, [
    { text: "OK" },
  ]);
}

export function showMessagingAccessRequiredAlert(): void {
  Alert.alert("Messaging unavailable", MESSAGING_ACCESS_REQUIRED_MESSAGE, [
    { text: "OK" },
  ]);
}
