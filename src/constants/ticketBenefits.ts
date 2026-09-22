/**
 * ASF2026 ticket benefits — informational copy for My Ticket and upgrade modal.
 * Tier resolution aligned with backend ticket class names (event 11).
 */

import {
  isExplorerLabel,
  isGoldInvestorLabel,
  isLimitedInvestorLabel,
  isLimitedPassLabel,
  isOperatorLabel,
  isStartupLabel,
  normalizeAsfTicketLabel,
} from "../utils/asfTicketClassMatch";

export type TicketBenefitTier =
  | "limited"
  | "explorer"
  | "startup"
  | "limited_investor"
  | "operator"
  | "investor";

export const TICKET_BENEFITS: Record<TicketBenefitTier, string[]> = {
  limited: [
    "Access to Exhibition floor only",
    "Access to Food Court only",
  ],
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
  limited_investor: [
    "Access to Investor Hours meetings only",
    "Does not include access to the main event program",
    "2–3 curated Investor Hours meetings",
    "Access to exhibitions",
    "Access to ASF mobile app for networking and confirmed meetings",
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
  limited: "Limited Pass",
  explorer: "Explorer Pass",
  startup: "Startup Pass",
  limited_investor: "Limited Investor Pass",
  operator: "Operator pass",
  investor: "Gold Investor Pass",
};

export function resolveBenefitTier(
  ticketTypeOrName?: string,
  userType?: string,
): TicketBenefitTier | null {
  const t = normalizeAsfTicketLabel(ticketTypeOrName);
  if (!t && !userType) return null;
  if (isLimitedInvestorLabel(t)) return "limited_investor";
  if (isGoldInvestorLabel(ticketTypeOrName, userType)) return "investor";
  if (isOperatorLabel(t, userType)) return "operator";
  if (isStartupLabel(t, userType)) return "startup";
  if (isExplorerLabel(t, userType)) return "explorer";
  if (isLimitedPassLabel(t, userType)) return "limited";
  return null;
}

export function getTicketBenefits(
  ticketTypeOrName?: string,
  userType?: string,
): { tier: TicketBenefitTier; tierLabel: string; items: string[] } | null {
  const tier = resolveBenefitTier(ticketTypeOrName, userType);
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
