import type { Attendee as BackendAttendee } from "../services/attendeeService";

export type AttendeeRoleFilter = "all" | "founder" | "investor";

function parseMetadata(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

/** Resolve ASF role bucket from ticket user_type, type name, or user metadata. */
export function getAttendeeRoleBucket(
  backend?: BackendAttendee | null,
): "founder" | "investor" | "other" {
  if (!backend) return "other";

  const meta = parseMetadata(backend.user?.metadata);
  const ticketType = String(backend.ticket?.ticket_type ?? "").toLowerCase();
  const metaType = String(meta.user_type ?? meta.role ?? meta.pass_type ?? "").toLowerCase();
  const haystack = `${ticketType} ${metaType}`;

  if (haystack.includes("investor")) return "investor";
  if (haystack.includes("founder")) return "founder";
  return "other";
}

export function attendeeMatchesRoleFilter(
  backend: BackendAttendee | undefined,
  filter: AttendeeRoleFilter,
): boolean {
  if (filter === "all") return true;
  return getAttendeeRoleBucket(backend) === filter;
}
