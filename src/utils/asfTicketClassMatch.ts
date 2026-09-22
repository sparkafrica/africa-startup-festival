/**
 * ASF event 11 ticket classes — match backend `name` + `user_type` (see TicketClass CSV).
 * Order of checks matters (e.g. Limited Investor before generic investor).
 */

export function normalizeAsfTicketLabel(input?: string): string {
  if (!input || typeof input !== "string") return "";
  return input.toLowerCase().replace(/\s+/g, " ").trim();
}

export function isLimitedInvestorLabel(nameOrType?: string): boolean {
  const t = normalizeAsfTicketLabel(nameOrType);
  return t.includes("limited investor");
}

export function isGoldInvestorLabel(nameOrType?: string, userType?: string): boolean {
  if (isLimitedInvestorLabel(nameOrType)) return false;
  const t = normalizeAsfTicketLabel(nameOrType);
  const ut = normalizeAsfTicketLabel(userType);
  if (t.includes("gold investor")) return true;
  if (t.includes("investor") && !t.includes("limited")) return true;
  if (ut === "investor" && t && !t.includes("limited")) return true;
  if (ut === "investor" && !t) return true;
  return false;
}

/** Exhibition / Limited Pass — not Limited Investor. */
export function isLimitedPassLabel(
  nameOrType?: string,
  userType?: string,
): boolean {
  if (isLimitedInvestorLabel(nameOrType)) return false;
  const t = normalizeAsfTicketLabel(nameOrType);
  const ut = normalizeAsfTicketLabel(userType);
  if (ut === "limited") return true;
  if (t.includes("exhibition")) return true;
  if (t === "limited" || t.includes("limited pass")) return true;
  return false;
}

export function isExplorerLabel(nameOrType?: string, userType?: string): boolean {
  const t = normalizeAsfTicketLabel(nameOrType);
  const ut = normalizeAsfTicketLabel(userType);
  if (isLimitedPassLabel(nameOrType, userType)) return false;
  return t.includes("explorer") || ut === "general";
}

export function isStartupLabel(nameOrType?: string, userType?: string): boolean {
  if (isLimitedInvestorLabel(nameOrType)) return false;
  const t = normalizeAsfTicketLabel(nameOrType);
  const ut = normalizeAsfTicketLabel(userType);
  return t.includes("startup") || ut === "founder" || t.includes("founder");
}

export function isOperatorLabel(nameOrType?: string, userType?: string): boolean {
  const t = normalizeAsfTicketLabel(nameOrType);
  const ut = normalizeAsfTicketLabel(userType);
  return t.includes("operator") || ut === "operator";
}

/**
 * Paid / grant ladder sort key (low → high). -1 = not on attendee upgrade ladder.
 * Limited Investor = 2 (same band as Startup for upgrade targets).
 */
export function asfTierSortKey(
  nameOrType?: string,
  userType?: string,
): number {
  const t = normalizeAsfTicketLabel(nameOrType);
  const ut = normalizeAsfTicketLabel(userType);
  if (!t && !ut) return -1;

  if (isLimitedInvestorLabel(t)) return 2;
  if (isGoldInvestorLabel(t, ut)) return 4;
  if (isOperatorLabel(t, ut)) return 3;
  if (isStartupLabel(t, ut)) return 2;
  if (isExplorerLabel(t, ut)) return 1;
  if (isLimitedPassLabel(t, ut)) return 0;

  if (
    t.includes("exhibitor") ||
    t.includes("partner") ||
    t.includes("sponsor") ||
    t.includes("media") ||
    t.includes("speaker") ||
    ut === "exhibitor" ||
    ut === "partner" ||
    ut === "media"
  ) {
    return -1;
  }

  // Short UI labels (e.g. "Startup" from getTicketTypeDisplay)
  if (t === "explorer") return 1;
  if (t === "startup" || t === "operator") return t === "operator" ? 3 : 2;
  if (t === "investor") return 4;

  return -1;
}

export function humanizeUpgradeError(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("more expensive") ||
    lower.includes("ticket class must be")
  ) {
    return "Choose a ticket class above your current level.";
  }
  return message;
}
