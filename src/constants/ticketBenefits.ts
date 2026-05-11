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

/**
 * Aggressive normalization for set-diff between tier perk strings — ignores
 * parentheticals, case, and punctuation so phrasing variants like
 * "Center Stage access (broad industry sessions)" vs "Center Stage access"
 * collapse to the same key.
 */
function normalizeForDiff(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Upgrade preview — perks the user would gain by moving from `currentTier`
 * (their existing pass) to `targetTier`.
 *
 * - If `targetTier` is not one of the four supported tiers, returns `null` →
 *   caller should hide the "View benefits" affordance.
 * - If `currentTier` is unknown / unsupported (e.g. Limited Pass), the user is
 *   treated as having no named perks, so the delta is the full target list.
 * - Items are returned in `targetTier`'s original wording (no parenthetical
 *   stripping for display); normalization is only used for the diff itself.
 */
export function getUpgradeBenefitsDelta(
  currentTierOrName: string | undefined,
  targetTierOrName: string | undefined
): { tier: TicketBenefitTier; tierLabel: string; items: string[] } | null {
  const target = getTicketBenefits(targetTierOrName);
  if (!target) return null;
  const currentTier = resolveBenefitTier(currentTierOrName);
  if (!currentTier) return target;
  const have = new Set(
    TICKET_BENEFITS[currentTier].map(normalizeForDiff)
  );
  const items = target.items.filter(
    (i) => !have.has(normalizeForDiff(i))
  );
  return { ...target, items };
}
