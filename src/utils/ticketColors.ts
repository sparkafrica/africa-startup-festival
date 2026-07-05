/**
 * Ticket color and label mapping — ASF Africa Startup Festival.
 * Pass types from backend are mapped to founder / investor / attendee / startup / sponsor labels.
 */

// Solid (left) color per pass type – used for fallbacks and badge text
const TICKET_COLORS: Record<string, string> = {
  founder: "#171717",
  investor: "#0F766E",
  attendee: "#059669",
  general: "#059669",
  expo: "#059669",
  exhibition: "#FFFFFF",
  startup: "#7C3AED",
  exhibitor: "#7C3AED",
  sponsor: "#4F46E5",
  partner: "#4F46E5",
  media: "#EAB308",
  speaker: "#EA580C",
};

/** Left-to-right gradient [start, end] for each pass type */
const TICKET_GRADIENTS: Record<string, [string, string]> = {
  founder: ["#171717", "#404040"],
  investor: ["#0F766E", "#14B8A6"],
  attendee: ["#059669", "#10B981"],
  general: ["#059669", "#10B981"],
  expo: ["#059669", "#10B981"],
  exhibition: ["#FFFFFF", "#F3F4F6"],
  startup: ["#7C3AED", "#8B5CF6"],
  exhibitor: ["#7C3AED", "#8B5CF6"],
  sponsor: ["#4F46E5", "#6366F1"],
  partner: ["#4F46E5", "#6366F1"],
  media: ["#EAB308", "#FACC15"],
  speaker: ["#EA580C", "#F97316"],
};

const TICKET_LABELS: Record<string, string> = {
  founder: "Founder",
  investor: "Investor",
  attendee: "Attendee",
  general: "Attendee",
  expo: "Attendee",
  exhibition: "Attendee",
  startup: "Startup",
  exhibitor: "Startup",
  sponsor: "Sponsor",
  partner: "Sponsor",
  media: "Media",
  speaker: "Speaker",
};

function normalizeType(input?: string): string {
  if (!input || typeof input !== "string") return "";
  return input.toLowerCase().replace(/\s+/g, " ");
}

function isLimitedPassAlias(normalized: string): boolean {
  return normalized.includes("exhibition") || normalized.includes("limited pass");
}

/**
 * Get background color for a ticket from its type/class name.
 */
export function getTicketBackgroundColor(ticketTypeOrName?: string): string {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return TICKET_COLORS.attendee;

  if (t.includes("founder") || t.includes("chairperson")) return TICKET_COLORS.founder;
  if (t.includes("investor") || t.includes("delegate")) return TICKET_COLORS.investor;
  if (t.includes("sponsor")) return TICKET_COLORS.sponsor;
  if (t.includes("partner")) return TICKET_COLORS.partner;
  if (t.includes("startup") || t.includes("exhibitor")) return TICKET_COLORS.startup;
  if (isLimitedPassAlias(t) || t.includes("oasis")) return TICKET_COLORS.exhibition;
  if (t.includes("expo") || t.includes("attendee") || t.includes("general"))
    return TICKET_COLORS.attendee;
  if (t.includes("media")) return TICKET_COLORS.media;
  if (t.includes("speaker")) return TICKET_COLORS.speaker;

  return TICKET_COLORS.attendee;
}

export function getTicketTypeDisplay(ticketTypeOrName?: string): {
  label: string;
  color: string;
} {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return { label: TICKET_LABELS.attendee, color: TICKET_COLORS.attendee };

  if (t.includes("founder") || t.includes("chairperson"))
    return { label: TICKET_LABELS.founder, color: TICKET_COLORS.founder };
  if (t.includes("investor") || t.includes("delegate"))
    return { label: TICKET_LABELS.investor, color: TICKET_COLORS.investor };
  if (t.includes("sponsor"))
    return { label: TICKET_LABELS.sponsor, color: TICKET_COLORS.sponsor };
  if (t.includes("partner"))
    return { label: TICKET_LABELS.partner, color: TICKET_COLORS.partner };
  if (t.includes("startup") || t.includes("exhibitor"))
    return { label: TICKET_LABELS.startup, color: TICKET_COLORS.startup };
  if (isLimitedPassAlias(t) || t.includes("oasis"))
    return { label: TICKET_LABELS.attendee, color: TICKET_COLORS.exhibition };
  if (t.includes("expo") || t.includes("attendee") || t.includes("general"))
    return { label: TICKET_LABELS.attendee, color: TICKET_COLORS.attendee };
  if (t.includes("media"))
    return { label: TICKET_LABELS.media, color: TICKET_COLORS.media };
  if (t.includes("speaker"))
    return { label: TICKET_LABELS.speaker, color: TICKET_COLORS.speaker };

  return { label: TICKET_LABELS.attendee, color: TICKET_COLORS.attendee };
}

export function getTicketGradientColors(ticketTypeOrName?: string): [string, string] {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return TICKET_GRADIENTS.attendee;
  if (t.includes("founder") || t.includes("chairperson")) return TICKET_GRADIENTS.founder;
  if (t.includes("investor") || t.includes("delegate")) return TICKET_GRADIENTS.investor;
  if (t.includes("sponsor") || t.includes("partner")) return TICKET_GRADIENTS.sponsor;
  if (t.includes("startup") || t.includes("exhibitor")) return TICKET_GRADIENTS.startup;
  if (isLimitedPassAlias(t) || t.includes("oasis")) return TICKET_GRADIENTS.exhibition;
  if (t.includes("expo") || t.includes("attendee") || t.includes("general")) return TICKET_GRADIENTS.attendee;
  if (t.includes("media")) return TICKET_GRADIENTS.media;
  if (t.includes("speaker")) return TICKET_GRADIENTS.speaker;
  return TICKET_GRADIENTS.attendee;
}

export function isExhibitionPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return false;
  return isLimitedPassAlias(t);
}

/** True if this pass type is the (restricted) Expo pass. */
export function isExpoPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return false;
  // Avoid ever treating Exhibition as Expo.
  if (isExhibitionPass(t)) return false;
  // Canonical match for Expo.
  if (t.includes("expo")) return true;
  // Back-compat: old backend may still label these as "attendee"/"general".
  if (t.includes("attendee") || t.includes("general")) return true;
  return false;
}

/** Tier order (lowest to highest): Limited Pass → Expo → Oasis → Delegate → Chairperson */
const TIER_LABELS: Record<string, string> = {
  exhibition: "Limited Pass",
  expo: "Expo",
  attendee: "Expo",
  general: "Expo",
  oasis: "Oasis",
  delegate: "Delegate",
  chairperson: "Chairperson",
  founder: "Chairperson",
};

export function isHighestTier(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  return t.includes("chairperson") || t.includes("founder");
}

export function getNextTierLabel(ticketTypeOrName?: string): string | null {
  const t = normalizeType(ticketTypeOrName);
  if (!t || t.includes("chairperson") || t.includes("founder")) return null;
  if (isLimitedPassAlias(t)) return TIER_LABELS.expo;
  if (t.includes("delegate")) return TIER_LABELS.chairperson;
  if (t.includes("oasis")) return TIER_LABELS.delegate;
  if (t.includes("expo") || t.includes("attendee") || t.includes("general"))
    return TIER_LABELS.oasis;
  return TIER_LABELS.oasis;
}

const TIER_VALUES: Record<string, string> = {
  exhibition: "exhibition",
  expo: "expo",
  attendee: "expo",
  general: "expo",
  oasis: "oasis",
  delegate: "delegate",
  chairperson: "chairperson",
  founder: "chairperson",
};

const TIER_ORDER: { value: string; label: string }[] = [
  { value: "exhibition", label: "Limited Pass" },
  { value: "expo", label: "Expo" },
  { value: "oasis", label: "Oasis" },
  { value: "delegate", label: "Delegate" },
  { value: "chairperson", label: "Chairperson" },
];

/**
 * Upgradeable tiers: Exhibition → Expo → Oasis → Delegate. Chairperson, Partner, Exhibitor, Media, Speaker cannot.
 */
export function isUpgradeableAttendeeTier(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return false;
  if (t.includes("chairperson") || t.includes("founder")) return false;
  if (t.includes("exhibitor") || t.includes("partner")) return false;
  if (t.includes("media") || t.includes("speaker")) return false;
  if (t.includes("delegate") || t.includes("oasis")) return true;
  if (isLimitedPassAlias(t)) return true;
  if (t.includes("expo") || t.includes("attendee") || t.includes("general"))
    return true;
  return false;
}

export function getHigherTierOptions(ticketTypeOrName?: string): { value: string; label: string }[] {
  const t = normalizeType(ticketTypeOrName);
  if (!t || t.includes("chairperson") || t.includes("founder")) return [];
  if (t.includes("delegate")) return [{ value: "chairperson", label: "Chairperson" }];
  if (t.includes("oasis"))
    return [
      { value: "delegate", label: "Delegate" },
      { value: "chairperson", label: "Chairperson" },
    ];
  if (t.includes("expo") || t.includes("attendee") || t.includes("general"))
    return [
      { value: "oasis", label: "Oasis" },
      { value: "delegate", label: "Delegate" },
      { value: "chairperson", label: "Chairperson" },
    ];
  if (isLimitedPassAlias(t))
    return [
      { value: "expo", label: "Expo" },
      { value: "oasis", label: "Oasis" },
      { value: "delegate", label: "Delegate" },
      { value: "chairperson", label: "Chairperson" },
    ];
  return TIER_ORDER;
}
