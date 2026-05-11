/**
 * Ticket benefits — informational, mobile-condensed copy of the website perks.
 *
 * Mirrors the website tiers (Expo / Oasis / Delegate / Chairperson). Other pass
 * types (Limited, Partner, Exhibitor, Media, Speaker, etc.) intentionally have
 * no entry here — `getTicketBenefits` returns `null` for them so the UI can
 * hide the affordance.
 *
 * No backend dependency; safe to ship via OTA.
 */

export type TicketBenefitTier =
  | "expo"
  | "oasis"
  | "delegate"
  | "chairperson";

/** Flat list — matches website pattern (no categorization in mobile view). */
export const TICKET_BENEFITS: Record<TicketBenefitTier, string[]> = {
  expo: [
    "Exhibitions access",
    "General networking areas",
    "Center Stage access",
  ],
  oasis: [
    "General networking areas",
    "Exhibitions access",
    "Scheduled meetings via mobile app",
    "Center Stage access (broad industry sessions)",
    "Networking Circles (themed, guided)",
    "Enterprise Stage access",
  ],
  delegate: [
    "Fast Track event entry",
    "General networking areas",
    "Exhibitions access",
    "Executive Lounge access",
    "Food Court access",
    "Scheduled meetings via mobile app",
    "Center Stage access",
    "Networking Circles",
    "Opening Reception invite (June 25th)",
    "Enterprise Stage access",
  ],
  chairperson: [
    "Fast Track event entry",
    "Complimentary tag delivery (pre-event)",
    "General networking areas",
    "Executive Lounge access",
    "Exhibitions access",
    "Complimentary drinks at Executive Lounge",
    "Scheduled meetings via mobile app",
    "Center Stage access",
    "Networking Circles",
    "Opening Reception invite (June 25th)",
    "Enterprise Stage access",
    "Ministerial & Policy Roundtables",
    "Private networking with keynote speakers",
  ],
};

/** Display label per tier (mirrors `ticketColors.ts` aliasing). */
const TIER_LABEL: Record<TicketBenefitTier, string> = {
  expo: "Expo",
  oasis: "Oasis",
  delegate: "Delegate",
  chairperson: "Chairperson",
};

function normalize(input?: string): string {
  if (!input || typeof input !== "string") return "";
  return input.toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolve a ticket type or class name into a benefit tier (or `null` if
 * unsupported). Uses the same substring rules as `ticketColors.ts` so labels
 * like "Delegate Pass" / "Founder" / "Attendee" / "General" map correctly.
 */
export function resolveBenefitTier(
  ticketTypeOrName?: string
): TicketBenefitTier | null {
  const t = normalize(ticketTypeOrName);
  if (!t) return null;
  if (t.includes("chairperson") || t.includes("founder")) return "chairperson";
  if (t.includes("delegate")) return "delegate";
  if (t.includes("oasis")) return "oasis";
  if (t.includes("expo") || t.includes("attendee") || t.includes("general"))
    return "expo";
  return null;
}

/** Returns `null` when the pass type has no perks list (UI should hide). */
export function getTicketBenefits(
  ticketTypeOrName?: string
): { tier: TicketBenefitTier; tierLabel: string; items: string[] } | null {
  const tier = resolveBenefitTier(ticketTypeOrName);
  if (!tier) return null;
  return {
    tier,
    tierLabel: TIER_LABEL[tier],
    items: TICKET_BENEFITS[tier],
  };
}
