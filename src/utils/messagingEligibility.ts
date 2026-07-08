/**
 * Messaging access: accepted connection (primary) or accepted meeting (secondary).
 * Applies to all pass tiers — including investors.
 */

import { connectionService, type Connection } from "../services/connectionService";
import { meetingService, type Meeting } from "../services/meetingService";

export function getConnectionPeerUserId(
  connection: Connection,
  currentUserId: string
): string | null {
  const fromId = String(connection.from_user?.id ?? "").trim();
  const toId = String(connection.to_user?.id ?? "").trim();
  if (!fromId || !toId) return null;
  const me = String(currentUserId).trim();
  if (fromId === me) return toId;
  if (toId === me) return fromId;
  return null;
}

/** Peer user ids for meetings with status `accepted` involving the current user. */
export function getAcceptedMeetingPeerIds(
  meetings: Meeting[],
  currentUserId: string
): Set<string> {
  const peers = new Set<string>();
  const me = String(currentUserId).trim();
  if (!me) return peers;

  for (const meeting of meetings) {
    if (meeting.status !== "accepted") continue;
    const requester = String(meeting.requester ?? "").trim();
    const requestee = String(meeting.requestee ?? "").trim();
    if (requester === me && requestee) peers.add(requestee);
    else if (requestee === me && requester) peers.add(requester);
  }
  return peers;
}

export function canMessagePeer(ctx: {
  connectionStatus?: "pending" | "accepted" | null;
  hasAcceptedMeeting?: boolean;
}): boolean {
  return (
    ctx.connectionStatus === "accepted" || ctx.hasAcceptedMeeting === true
  );
}

export type MessagingEligiblePeersResult = {
  eligiblePeerIds: Set<string>;
  /** When false, inbox should not filter (network error on both sources). */
  shouldFilterInbox: boolean;
};

/**
 * Load peer ids the current user may message (accepted connection OR accepted meeting).
 */
export async function loadMessagingEligiblePeerIds(
  currentUserId: string
): Promise<MessagingEligiblePeersResult> {
  const me = String(currentUserId).trim();
  if (!me) {
    return {
      eligiblePeerIds: new Set(),
      shouldFilterInbox: false,
    };
  }

  let connectionsRequestOk = false;
  let meetingsRequestOk = false;

  const [connectionsResult, meetings] = await Promise.all([
    connectionService
      .getConnections(1, 200)
      .then((r) => {
        connectionsRequestOk = true;
        return r.connections;
      })
      .catch(() => [] as Connection[]),
    meetingService
      .getMeetings()
      .then((rows) => {
        meetingsRequestOk = true;
        return rows;
      })
      .catch(() => [] as Meeting[]),
  ]);

  const eligiblePeerIds = new Set<string>();

  for (const connection of connectionsResult) {
    if (connection.status !== "accepted") continue;
    const peerId = getConnectionPeerUserId(connection, me);
    if (peerId) eligiblePeerIds.add(peerId);
  }

  for (const peerId of getAcceptedMeetingPeerIds(meetings, me)) {
    eligiblePeerIds.add(peerId);
  }

  return {
    eligiblePeerIds,
    shouldFilterInbox: connectionsRequestOk || meetingsRequestOk,
  };
}

export function isPeerMessagingEligible(
  peerUserId: string,
  eligiblePeerIds: Set<string>
): boolean {
  const id = String(peerUserId).trim();
  if (!id) return false;
  return eligiblePeerIds.has(id);
}
