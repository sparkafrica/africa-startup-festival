/**
 * Ticket color and label mapping — ASF Africa Startup Festival.
 * Event pass types: explorer, startup, operator, investor, exhibitor, partner, media.
 */

const DEFAULT_PASS = "explorer";

// Solid (left) color per pass type – used for fallbacks and badge text
const TICKET_COLORS: Record<string, string> = {
  explorer: "#525252",
  startup: "#171717",
  operator: "#1D4ED8",
  investor: "#0F766E",
  exhibitor: "#7C3AED",
  sponsor: "#4F46E5",
  partner: "#4F46E5",
  media: "#EAB308",
  speaker: "#EA580C",
};

/** Left-to-right gradient [start, end] for each pass type */
const TICKET_GRADIENTS: Record<string, [string, string]> = {
  explorer: ["#525252", "#737373"],
  startup: ["#171717", "#404040"],
  operator: ["#1D4ED8", "#3B82F6"],
  investor: ["#0F766E", "#14B8A6"],
  exhibitor: ["#7C3AED", "#8B5CF6"],
  sponsor: ["#4F46E5", "#6366F1"],
  partner: ["#4F46E5", "#6366F1"],
  media: ["#EAB308", "#FACC15"],
  speaker: ["#EA580C", "#F97316"],
};

const TICKET_LABELS: Record<string, string> = {
  explorer: "Explorer",
  startup: "Startup",
  operator: "Operator",
  investor: "Investor",
  exhibitor: "Exhibitor",
  sponsor: "Sponsor",
  partner: "Sponsor",
  media: "Media",
  speaker: "Speaker",
};

function isStartupPassAlias(normalized: string): boolean {
  return normalized.includes("startup") || normalized.includes("founder");
}

function normalizeType(input?: string): string {
  if (!input || typeof input !== "string") return "";
  return input.toLowerCase().replace(/\s+/g, " ");
}

function isLimitedPassAlias(normalized: string): boolean {
  return (
    normalized.includes("exhibition") || normalized.includes("limited pass")
  );
}

/**
 * Get background color for a ticket from its type/class name.
 */
export function getTicketBackgroundColor(ticketTypeOrName?: string): string {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return TICKET_COLORS[DEFAULT_PASS];

  if (t.includes("explorer") || isLimitedPassAlias(t))
    return TICKET_COLORS.explorer;
  if (t.includes("operator")) return TICKET_COLORS.operator;
  if (isStartupPassAlias(t)) return TICKET_COLORS.startup;
  if (t.includes("investor")) return TICKET_COLORS.investor;
  if (t.includes("sponsor")) return TICKET_COLORS.sponsor;
  if (t.includes("partner")) return TICKET_COLORS.partner;
  if (t.includes("exhibitor")) return TICKET_COLORS.exhibitor;
  if (t.includes("media")) return TICKET_COLORS.media;
  if (t.includes("speaker")) return TICKET_COLORS.speaker;

  return TICKET_COLORS[DEFAULT_PASS];
}

export function getTicketTypeDisplay(ticketTypeOrName?: string): {
  label: string;
  color: string;
} {
  const t = normalizeType(ticketTypeOrName);
  if (!t) {
    return {
      label: TICKET_LABELS[DEFAULT_PASS],
      color: TICKET_COLORS[DEFAULT_PASS],
    };
  }

  if (t.includes("explorer") || isLimitedPassAlias(t))
    return { label: TICKET_LABELS.explorer, color: TICKET_COLORS.explorer };
  if (t.includes("operator"))
    return { label: TICKET_LABELS.operator, color: TICKET_COLORS.operator };
  if (isStartupPassAlias(t))
    return { label: TICKET_LABELS.startup, color: TICKET_COLORS.startup };
  if (t.includes("investor"))
    return { label: TICKET_LABELS.investor, color: TICKET_COLORS.investor };
  if (t.includes("sponsor"))
    return { label: TICKET_LABELS.sponsor, color: TICKET_COLORS.sponsor };
  if (t.includes("partner"))
    return { label: TICKET_LABELS.partner, color: TICKET_COLORS.partner };
  if (t.includes("exhibitor"))
    return { label: TICKET_LABELS.exhibitor, color: TICKET_COLORS.exhibitor };
  if (t.includes("media"))
    return { label: TICKET_LABELS.media, color: TICKET_COLORS.media };
  if (t.includes("speaker"))
    return { label: TICKET_LABELS.speaker, color: TICKET_COLORS.speaker };

  return {
    label: TICKET_LABELS[DEFAULT_PASS],
    color: TICKET_COLORS[DEFAULT_PASS],
  };
}

export function getTicketGradientColors(
  ticketTypeOrName?: string,
): [string, string] {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return TICKET_GRADIENTS[DEFAULT_PASS];
  if (t.includes("explorer") || isLimitedPassAlias(t))
    return TICKET_GRADIENTS.explorer;
  if (t.includes("operator")) return TICKET_GRADIENTS.operator;
  if (isStartupPassAlias(t)) return TICKET_GRADIENTS.startup;
  if (t.includes("investor")) return TICKET_GRADIENTS.investor;
  if (t.includes("sponsor") || t.includes("partner"))
    return TICKET_GRADIENTS.sponsor;
  if (t.includes("exhibitor")) return TICKET_GRADIENTS.exhibitor;
  if (t.includes("media")) return TICKET_GRADIENTS.media;
  if (t.includes("speaker")) return TICKET_GRADIENTS.speaker;
  return TICKET_GRADIENTS[DEFAULT_PASS];
}

function hexToLuminance(hex: string): number {
  const normalized = hex.replace(/^#/, "");
  if (normalized.length !== 6) return 0;
  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;
  const transform = (channel: number) =>
    channel <= 0.03928
      ? channel / 12.92
      : Math.pow((channel + 0.055) / 1.055, 2.4);
  const [rs, gs, bs] = [r, g, b].map(transform);
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/** True when the pass gradient is light enough for dark foreground text. */
export function isLightTicketCard(ticketTypeOrName?: string): boolean {
  const [start, end] = getTicketGradientColors(ticketTypeOrName);
  const averageLuminance =
    (hexToLuminance(start) + hexToLuminance(end)) / 2;
  return averageLuminance > 0.45;
}

export function isExhibitionPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return false;
  return isLimitedPassAlias(t) || t.includes("explorer");
}

/** @deprecated ASF uses explorer pass — kept for call-site compatibility */
export function isExpoPass(ticketTypeOrName?: string): boolean {
  return isExplorerPass(ticketTypeOrName);
}

export function isExplorerPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  return t.includes("explorer") || isLimitedPassAlias(t);
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

export function getHigherTierOptions(
  ticketTypeOrName?: string,
): { value: string; label: string }[] {
  const t = normalizeType(ticketTypeOrName);
  if (!t || t.includes("chairperson") || t.includes("founder")) return [];
  if (t.includes("delegate"))
    return [{ value: "chairperson", label: "Chairperson" }];
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
