/**
 * ASF2026 ticket benefits — informational copy for My Ticket and upgrade modal.
 * No backend dependency; safe to ship via OTA.
 */

export type TicketBenefitTier =
  | "explorer"
  | "startup"
  | "operator"
  | "investor";

export const TICKET_BENEFITS: Record<TicketBenefitTier, string[]> = {
  explorer: [
    "Access to the Main Stage only (first-come, first-served)",
    "Access to Exhibitions",
    "Access to the Night Festival",
    "Access to City Circles community meetups (subject to individual events)",
  ],
  startup: [
    "Access to Exhibitions",
    "Access to the Night Festival",
    "Full access to Main Stage & Impact Stage content",
    "Access to the networking app and booking meetings",
    "Access to City Circles community meetups (subject to individual events)",
    "Access to investor matches through Investor Hours (complimentary perk driven by investor interest)",
    "Access to Mentor Hours (first-come, first-served)",
  ],
  operator: [
    "Fast Track Access to Event",
    "Access to complimentary coffee and drinks",
    "Full access to the Expo floor on October 29th",
    "Access to Exhibitions",
    "Access to the Night Festival",
    "Full access to Main Stage & Impact Stage content",
    "Access to the networking app and booking meetings",
    "Access to City Circles community meetups (subject to individual events)",
    "Invitation to the Opening Mixer",
    "Access to Mentor Hours (first-come, first-served)",
  ],
  investor: [
    "Access to Speaker Lounge",
    "Fast-track entry to the event",
    "Access to complimentary coffee and drinks",
    "Full access to the Festival floor on October 29th",
    "Access to Exhibitions",
    "Access to the Night Festival (October 29th evening)",
    "Access to the Food Court",
    "Full access to Main Stage & Impact Stage content",
    "Access to the networking app and booking meetings",
    "Access to City Circles (courtesy of individual events)",
    "Invitation to the Opening Mixer",
    "Access to Mentor Hours",
    "Access to Concierge Investor Hours — our team helps book meetings for you with aligned startups",
    "Priority Seating at all stages and events",
  ],
};

const TIER_LABEL: Record<TicketBenefitTier, string> = {
  explorer: "Explorer",
  startup: "Startup",
  operator: "Operator",
  investor: "Gold Investor",
};

function normalize(input?: string): string {
  if (!input || typeof input !== "string") return "";
  return input.toLowerCase().replace(/\s+/g, " ");
}

export function resolveBenefitTier(
  ticketTypeOrName?: string,
): TicketBenefitTier | null {
  const t = normalize(ticketTypeOrName);
  if (!t) return null;
  if (t.includes("investor")) return "investor";
  if (t.includes("operator")) return "operator";
  if (t.includes("startup") || t.includes("founder")) return "startup";
  if (
    t.includes("explorer") ||
    t.includes("exhibition") ||
    t.includes("limited pass")
  ) {
    return "explorer";
  }
  return null;
}

export function getTicketBenefits(
  ticketTypeOrName?: string,
): { tier: TicketBenefitTier; tierLabel: string; items: string[] } | null {
  const tier = resolveBenefitTier(ticketTypeOrName);
  if (!tier) return null;
  return {
    tier,
    tierLabel: TIER_LABEL[tier],
    items: TICKET_BENEFITS[tier],
  };
}

function normalizeForDiff(s: string): string {
  return s
    .toLowerCase()
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function getUpgradeBenefitsDelta(
  currentTierOrName: string | undefined,
  targetTierOrName: string | undefined,
): { tier: TicketBenefitTier; tierLabel: string; items: string[] } | null {
  const target = getTicketBenefits(targetTierOrName);
  if (!target) return null;
  const currentTier = resolveBenefitTier(currentTierOrName);
  if (!currentTier) return target;
  const have = new Set(TICKET_BENEFITS[currentTier].map(normalizeForDiff));
  const items = target.items.filter((i) => !have.has(normalizeForDiff(i)));
  return { ...target, items };
}
