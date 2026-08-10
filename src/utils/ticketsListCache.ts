/**
 * Stale-while-revalidate gate for My Ticket(s) fetches (ScanQR screen).
 */

import { FOCUS_LIST_STALE_MS } from "./eventDataCache";

let ticketsFetchedAt = 0;

export function markTicketsFetched(): void {
  ticketsFetchedAt = Date.now();
}

export function invalidateTicketsFetchedAt(): void {
  ticketsFetchedAt = 0;
}

export function shouldRefetchTicketsOnFocus(hasLocalData: boolean): boolean {
  if (!hasLocalData) return true;
  if (ticketsFetchedAt === 0) return true;
  return Date.now() - ticketsFetchedAt > FOCUS_LIST_STALE_MS;
}
