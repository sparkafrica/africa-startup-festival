/**
 * ASF pass tier helpers — event ticket classes:
 * explorer, startup, operator, investor, exhibitor, partner, media
 */

import { ticketService } from "../services/ticketService";
import { EVENT_ID } from "../config/env";

function normalizeType(input?: string): string {
  if (!input || typeof input !== "string") return "";
  return input.toLowerCase().replace(/\s+/g, " ");
}

export function ticketTypeFromTicket(ticket: {
  type?: { name?: string; user_type?: string };
  ticket_class?: { name?: string; user_type?: string };
  ticket_type?: string;
  ticket_class_name?: string;
} | null): string {
  if (!ticket) return "";
  if (ticket.ticket_type) {
    return normalizeType(ticket.ticket_type);
  }
  return (
    ticket.type?.user_type ??
    ticket.type?.name ??
    ticket.ticket_class?.user_type ??
    ticket.ticket_class?.name ??
    ""
  );
}

export function ticketClassNameFromTicket(ticket: {
  type?: { name?: string };
  ticket_class?: { name?: string };
  ticket_class_name?: string;
} | null): string {
  if (!ticket) return "";
  return (
    ticket.type?.name?.trim() ??
    ticket.ticket_class?.name?.trim() ??
    ticket.ticket_class_name?.trim() ??
    ""
  );
}

export type UserTicketInfo = {
  ticketType: string;
  ticketClassName: string;
};

export async function getCurrentUserTicketInfo(): Promise<UserTicketInfo> {
  try {
    const ticket = await ticketService.getUserTicket(EVENT_ID, {
      bypassCache: true,
    });
    return {
      ticketType: normalizeType(ticketTypeFromTicket(ticket ?? null)),
      ticketClassName: ticketClassNameFromTicket(ticket ?? null),
    };
  } catch {
    return { ticketType: "", ticketClassName: "" };
  }
}

export async function getCurrentUserTicketType(): Promise<string> {
  const info = await getCurrentUserTicketInfo();
  return info.ticketType;
}

export function isExplorerPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  return t.includes("explorer");
}

/** Startup pass — company connect flow after personal profile. Legacy "founder" tickets map here. */
export function isStartupPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  return t.includes("startup") || t.includes("founder");
}

/** @deprecated Use isStartupPass — kept for call-site compatibility */
export function isFounderPass(ticketTypeOrName?: string): boolean {
  return isStartupPass(ticketTypeOrName);
}

export function isOperatorPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  return t.includes("operator");
}

export function isInvestorPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  return t.includes("investor");
}

export function isExhibitorPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  return t.includes("exhibitor");
}

export function isPartnerPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  return t.includes("partner") || t.includes("sponsor");
}

export function isMediaPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  return t.includes("media");
}

/** Explorer pass: main-stage access only — no meeting booking in-app. */
export function blocksMeetingBooking(ticketTypeOrName?: string): boolean {
  return isExplorerPass(ticketTypeOrName);
}

export function attendeeLooksLikeInvestor(attendee: {
  ticketType?: string;
  userType?: string;
  role?: string;
}): boolean {
  const haystack = normalizeType(
    [attendee.ticketType, attendee.userType, attendee.role].filter(Boolean).join(" "),
  );
  return haystack.includes("investor");
}
