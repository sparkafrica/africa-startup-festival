/**
 * ASF2026 ticket upgrade ladder: Explorer → Startup → Operator → Investor.
 * Exhibitor / Partner / Media / Speaker are not upgradeable.
 */

import type { TicketClass } from "../services/ticketService";

export const ASF_UPGRADE_TIER_ORDER_LABEL =
  "Explorer → Startup → Operator → Gold Investor";

/** Lowest (0) to highest (3) for upgradeable attendee passes. */
export function asfTierSortKey(nameOrType?: string): number {
  const t = (nameOrType ?? "").toLowerCase();
  if (!t) return -1;
  if (t.includes("investor")) return 3;
  if (t.includes("operator")) return 2;
  if (t.includes("startup") || t.includes("founder")) return 1;
  if (
    t.includes("explorer") ||
    t.includes("exhibition") ||
    t.includes("limited pass")
  ) {
    return 0;
  }
  return -1;
}

export function isNonUpgradeablePassType(nameOrType?: string): boolean {
  const t = (nameOrType ?? "").toLowerCase();
  if (!t) return true;
  if (t.includes("exhibitor") || t.includes("partner") || t.includes("sponsor")) {
    return true;
  }
  if (t.includes("media") || t.includes("speaker")) return true;
  return false;
}

/** True for Explorer, Startup, and Operator — not Investor or special passes. */
export function isUpgradeableAttendeeTier(ticketTypeOrName?: string): boolean {
  if (isNonUpgradeablePassType(ticketTypeOrName)) return false;
  const key = asfTierSortKey(ticketTypeOrName);
  return key >= 0 && key < 3;
}

/**
 * Filter ticket classes to upgrade targets strictly above the user's current tier.
 * Deduplicates by normalized tier key so duplicate API rows don't repeat options.
 */
export function filterUpgradeClasses(
  classes: TicketClass[],
  currentTierLabel: string,
): TicketClass[] {
  const userTierKey = asfTierSortKey(currentTierLabel);
  if (userTierKey < 0) return [];

  const filtered = classes
    .filter((c) => {
      const tierKey = asfTierSortKey(c.name || c.user_type);
      return tierKey > userTierKey;
    })
    .sort(
      (a, b) =>
        asfTierSortKey(a.name || a.user_type) -
        asfTierSortKey(b.name || b.user_type),
    );

  const seen = new Set<number>();
  return filtered.filter((c) => {
    const key = asfTierSortKey(c.name || c.user_type);
    if (key < 0 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
