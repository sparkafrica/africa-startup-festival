/**
 * Messaging access: accepted connection (primary) or accepted meeting (secondary).
 * Investors bypass this check at the call site (see asfNetworking.canMessageAttendee).
 */

import type { Connection } from "../services/connectionService";
import type { Meeting } from "../services/meetingService";
import { ensureConnectionsList } from "../utils/connectionsListCache";
import {
  ensureMeetingsList,
  getCachedPhysicalMeetings,
} from "../utils/meetingsListCache";

export function getConnectionPeerUserId(
  connection: Connection,
  currentUserId: string,
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
  currentUserId: string,
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

/** Peer user ids for meetings still awaiting response. */
export function getPendingMeetingPeerIds(
  meetings: Meeting[],
  currentUserId: string,
): Set<string> {
  const peers = new Set<string>();
  const me = String(currentUserId).trim();
  if (!me) return peers;

  for (const meeting of meetings) {
    if (meeting.status !== "pending") continue;
    const requester = String(meeting.requester ?? "").trim();
    const requestee = String(meeting.requestee ?? "").trim();
    if (requester === me && requestee) peers.add(requestee);
    else if (requestee === me && requester) peers.add(requester);
  }
  return peers;
}

/**
 * True when current user already has a pending meeting with this peer
 * (either direction). Used to block duplicate requests in the UI.
 */
export async function hasPendingMeetingWithPeer(
  peerUserId: string,
  currentUserId: string,
): Promise<boolean> {
  const peer = String(peerUserId).trim();
  const me = String(currentUserId).trim();
  if (!peer || !me) return false;
  try {
    const cached = getCachedPhysicalMeetings();
    const meetings =
      cached.length > 0
        ? cached
        : (await ensureMeetingsList()).physical;
    return getPendingMeetingPeerIds(meetings, me).has(peer);
  } catch {
    return false;
  }
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
  currentUserId: string,
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

  const [connectionsResult, meetingsSnap] = await Promise.all([
    ensureConnectionsList()
      .then((snap) => {
        connectionsRequestOk = true;
        return snap.connections;
      })
      .catch(() => [] as Connection[]),
    ensureMeetingsList()
      .then((snap) => {
        meetingsRequestOk = true;
        return snap.physical;
      })
      .catch(() => [] as Meeting[]),
  ]);

  const eligiblePeerIds = new Set<string>();

  for (const connection of connectionsResult) {
    if (connection.status !== "accepted") continue;
    const peerId = getConnectionPeerUserId(connection, me);
    if (peerId) eligiblePeerIds.add(peerId);
  }

  for (const peerId of getAcceptedMeetingPeerIds(meetingsSnap, me)) {
    eligiblePeerIds.add(peerId);
  }

  return {
    eligiblePeerIds,
    shouldFilterInbox: connectionsRequestOk || meetingsRequestOk,
  };
}

export function isPeerMessagingEligible(
  peerUserId: string,
  eligiblePeerIds: Set<string>,
): boolean {
  const id = String(peerUserId).trim();
  if (!id) return false;
  return eligiblePeerIds.has(id);
}
