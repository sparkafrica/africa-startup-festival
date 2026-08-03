import type { Attendee as BackendAttendee } from "../services/attendeeService";
import { getEventMetadata } from "./eventMetadata";

export type AttendeeRoleFilter = "all" | "startup" | "investor";

/** Resolve ASF role bucket from ticket user_type, type name, or user metadata. */
export function getAttendeeRoleBucket(
  backend?: BackendAttendee | null,
): "startup" | "investor" | "other" {
  if (!backend) return "other";

  const meta = getEventMetadata(backend.user?.metadata);
  const ticketType = String(backend.ticket?.ticket_type ?? "").toLowerCase();
  const metaType = String(meta.user_type ?? meta.role ?? meta.pass_type ?? "").toLowerCase();
  const haystack = `${ticketType} ${metaType}`;

  if (haystack.includes("investor")) return "investor";
  if (haystack.includes("startup") || haystack.includes("founder")) return "startup";
  return "other";
}

export function attendeeMatchesRoleFilter(
  backend: BackendAttendee | undefined,
  filter: AttendeeRoleFilter,
): boolean {
  if (filter === "all") return true;
  return getAttendeeRoleBucket(backend) === filter;
}
