/**
 * ASF2026 ticket upgrade ladder (backend class names, event 11).
 * Limited Investor Pass is grant-only (purchasable=0), not an upgrade target.
 */

import type { TicketClass } from "../services/ticketService";
import { asfTierSortKey } from "./asfTicketClassMatch";

export { asfTierSortKey, humanizeUpgradeError } from "./asfTicketClassMatch";

export const ASF_UPGRADE_TIER_ORDER_LABEL =
  "Limited Pass → Explorer Pass → Startup Pass → Operator Pass → Gold Investor Pass";

export function isTicketClassPurchasable(c: TicketClass): boolean {
  const p = c.purchasable;
  if (p === undefined || p === null) return true;
  return p === true || p === 1;
}

export function ticketClassUpgradeTierKey(c: TicketClass): number {
  return asfTierSortKey(c.name, c.user_type);
}

export function isNonUpgradeablePassType(nameOrType?: string): boolean {
  const key = asfTierSortKey(nameOrType);
  if (key < 0) return true;
  return false;
}

/** True when user can upgrade (not top Gold tier, on ladder). */
export function isUpgradeableAttendeeTier(ticketTypeOrName?: string): boolean {
  const key = asfTierSortKey(ticketTypeOrName);
  return key >= 0 && key < 4;
}

/**
 * Purchasable classes strictly above the user's current tier.
 * Deduplicates by tier key.
 */
export function filterUpgradeClasses(
  classes: TicketClass[],
  currentTierLabel: string,
): TicketClass[] {
  const userTierKey = asfTierSortKey(currentTierLabel);
  if (userTierKey < 0) return [];

  const filtered = classes
    .filter((c) => isTicketClassPurchasable(c))
    .filter((c) => ticketClassUpgradeTierKey(c) > userTierKey)
    .sort(
      (a, b) =>
        ticketClassUpgradeTierKey(a) - ticketClassUpgradeTierKey(b),
    );

  const seen = new Set<number>();
  return filtered.filter((c) => {
    const key = ticketClassUpgradeTierKey(c);
    if (key < 0 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
