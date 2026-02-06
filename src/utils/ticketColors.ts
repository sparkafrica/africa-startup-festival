/**
 * Ticket color and badge mapping for ATE (Africa Technology Expo) and other events.
 *
 * ATE hierarchy (top to bottom): Chairperson, Delegate, Oasis, Expo
 * Option C theme: Black, Slate, Teal, Green + Blue for Exhibitor/Partner
 */

// ATE event colors - Option C with teal & slate (app event themes)
const TICKET_COLORS: Record<string, string> = {
  chairperson: "#000000", // Black - prestige, top tier (replaces Founder)
  founder: "#000000", // Black - legacy
  delegate: "#475569", // Slate - professional, mid-tier
  oasis: "#14B8A6", // Teal - app event theme, oasis/lounge feel
  expo: "#10B981", // Green - general attendees
  attendee: "#10B981",
  general: "#10B981",
  exhibitor: "#3B82F6", // Blue
  partner: "#3B82F6", // Blue
};

const TICKET_LABELS: Record<string, string> = {
  chairperson: "Chairperson",
  founder: "Founder",
  delegate: "Delegate",
  oasis: "Oasis",
  expo: "Expo",
  attendee: "Attendee",
  general: "Attendee",
  exhibitor: "Exhibitor",
  partner: "Partner",
};

function normalizeType(input?: string): string {
  if (!input || typeof input !== "string") return "";
  return input.toLowerCase().replace(/\s+/g, " ");
}

/**
 * Get background color for a ticket from its type/class name.
 * Matches: "Chairperson Pass", "Delegate Pass", "Oasis Pass", "Expo Pass",
 * "Exhibitor Ticket", "Partner Ticket", etc.
 */
export function getTicketBackgroundColor(ticketTypeOrName?: string): string {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return "#10B981"; // Default green

  // Check keywords in order of specificity
  if (t.includes("chairperson") || t.includes("founder")) return TICKET_COLORS.chairperson;
  if (t.includes("delegate")) return TICKET_COLORS.delegate;
  if (t.includes("oasis")) return TICKET_COLORS.oasis;
  if (t.includes("expo") || t.includes("attendee") || t.includes("general")) return TICKET_COLORS.expo;
  if (t.includes("exhibitor")) return TICKET_COLORS.exhibitor;
  if (t.includes("partner")) return TICKET_COLORS.partner;

  return "#10B981"; // Default green
}

/**
 * Get display label and color for ticket type (e.g. for Menu badge).
 */
export function getTicketTypeDisplay(ticketTypeOrName?: string): {
  label: string;
  color: string;
} {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return { label: "Attendee", color: "#10B981" };

  if (t.includes("chairperson") || t.includes("founder"))
    return { label: TICKET_LABELS.chairperson, color: TICKET_COLORS.chairperson };
  if (t.includes("delegate"))
    return { label: TICKET_LABELS.delegate, color: TICKET_COLORS.delegate };
  if (t.includes("oasis"))
    return { label: TICKET_LABELS.oasis, color: TICKET_COLORS.oasis };
  if (t.includes("expo") || t.includes("attendee") || t.includes("general"))
    return { label: TICKET_LABELS.expo, color: TICKET_COLORS.expo };
  if (t.includes("exhibitor"))
    return { label: TICKET_LABELS.exhibitor, color: TICKET_COLORS.exhibitor };
  if (t.includes("partner"))
    return { label: TICKET_LABELS.partner, color: TICKET_COLORS.partner };

  return { label: "Attendee", color: "#10B981" };
}
