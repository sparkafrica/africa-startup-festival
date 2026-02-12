/**
 * Ticket color and label mapping.
 * Pass types: Expo, Oasis, Delegate, Chairperson, Partner, Exhibitor, Media, Speaker.
 * All types use a left-to-right gradient for cards/badges.
 */

// Solid (left) color per pass type – used for fallbacks and badge text
const TICKET_COLORS: Record<string, string> = {
  chairperson: "#171717",
  founder: "#171717",
  delegate: "#14B8A6",
  oasis: "#2563EB",
  expo: "#059669",
  attendee: "#059669",
  general: "#059669",
  partner: "#4F46E5",
  exhibitor: "#7C3AED",
  media: "#EAB308",
  speaker: "#EA580C",
};

/** Left-to-right gradient [start, end] for each pass type */
const TICKET_GRADIENTS: Record<string, [string, string]> = {
  chairperson: ["#171717", "#404040"],
  delegate: ["#14B8A6", "#2DD4BF"],
  oasis: ["#2563EB", "#3B82F6"],
  expo: ["#059669", "#10B981"],
  partner: ["#4F46E5", "#6366F1"],
  exhibitor: ["#7C3AED", "#8B5CF6"],
  media: ["#EAB308", "#FACC15"],
  speaker: ["#EA580C", "#F97316"],
};

const TICKET_LABELS: Record<string, string> = {
  chairperson: "Chairperson",
  founder: "Founder",
  delegate: "Delegate",
  oasis: "Oasis",
  expo: "Expo",
  attendee: "Expo",
  general: "Expo",
  partner: "Partner",
  exhibitor: "Exhibitor",
  media: "Media",
  speaker: "Speaker",
};

function normalizeType(input?: string): string {
  if (!input || typeof input !== "string") return "";
  return input.toLowerCase().replace(/\s+/g, " ");
}

/**
 * Get background color for a ticket from its type/class name.
 */
export function getTicketBackgroundColor(ticketTypeOrName?: string): string {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return TICKET_COLORS.expo;

  if (t.includes("chairperson") || t.includes("founder")) return TICKET_COLORS.chairperson;
  if (t.includes("delegate")) return TICKET_COLORS.delegate;
  if (t.includes("oasis")) return TICKET_COLORS.oasis;
  if (t.includes("expo") || t.includes("attendee") || t.includes("general")) return TICKET_COLORS.expo;
  if (t.includes("partner")) return TICKET_COLORS.partner;
  if (t.includes("exhibitor")) return TICKET_COLORS.exhibitor;
  if (t.includes("media")) return TICKET_COLORS.media;
  if (t.includes("speaker")) return TICKET_COLORS.speaker;

  return TICKET_COLORS.expo;
}

/**
 * Get display label and color for ticket type (e.g. for Menu badge).
 */
export function getTicketTypeDisplay(ticketTypeOrName?: string): {
  label: string;
  color: string;
} {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return { label: TICKET_LABELS.expo, color: TICKET_COLORS.expo };

  if (t.includes("chairperson") || t.includes("founder"))
    return { label: TICKET_LABELS.chairperson, color: TICKET_COLORS.chairperson };
  if (t.includes("delegate"))
    return { label: TICKET_LABELS.delegate, color: TICKET_COLORS.delegate };
  if (t.includes("oasis"))
    return { label: TICKET_LABELS.oasis, color: TICKET_COLORS.oasis };
  if (t.includes("expo") || t.includes("attendee") || t.includes("general"))
    return { label: TICKET_LABELS.expo, color: TICKET_COLORS.expo };
  if (t.includes("partner"))
    return { label: TICKET_LABELS.partner, color: TICKET_COLORS.partner };
  if (t.includes("exhibitor"))
    return { label: TICKET_LABELS.exhibitor, color: TICKET_COLORS.exhibitor };
  if (t.includes("media"))
    return { label: TICKET_LABELS.media, color: TICKET_COLORS.media };
  if (t.includes("speaker"))
    return { label: TICKET_LABELS.speaker, color: TICKET_COLORS.speaker };

  return { label: TICKET_LABELS.expo, color: TICKET_COLORS.expo };
}

/**
 * Get left-to-right gradient colors for a ticket type. All types have a gradient.
 */
export function getTicketGradientColors(ticketTypeOrName?: string): [string, string] {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return TICKET_GRADIENTS.expo;
  if (t.includes("chairperson") || t.includes("founder")) return TICKET_GRADIENTS.chairperson;
  if (t.includes("delegate")) return TICKET_GRADIENTS.delegate;
  if (t.includes("oasis")) return TICKET_GRADIENTS.oasis;
  if (t.includes("expo") || t.includes("attendee") || t.includes("general")) return TICKET_GRADIENTS.expo;
  if (t.includes("partner")) return TICKET_GRADIENTS.partner;
  if (t.includes("exhibitor")) return TICKET_GRADIENTS.exhibitor;
  if (t.includes("media")) return TICKET_GRADIENTS.media;
  if (t.includes("speaker")) return TICKET_GRADIENTS.speaker;
  return TICKET_GRADIENTS.expo;
}

/** True if this pass type is Expo (or attendee/general). Used to block meeting booking. */
export function isExpoPass(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return true; // treat unknown as Expo for safety
  return (
    t.includes("expo") ||
    t.includes("attendee") ||
    t.includes("general")
  );
}

/** Tier order (lowest to highest): Expo → Oasis → Delegate → Chairperson */
const TIER_LABELS: Record<string, string> = {
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
  if (t.includes("delegate")) return TIER_LABELS.chairperson;
  if (t.includes("oasis")) return TIER_LABELS.delegate;
  if (t.includes("expo") || t.includes("attendee") || t.includes("general"))
    return TIER_LABELS.oasis;
  return TIER_LABELS.oasis;
}

const TIER_VALUES: Record<string, string> = {
  expo: "expo",
  attendee: "expo",
  general: "expo",
  oasis: "oasis",
  delegate: "delegate",
  chairperson: "chairperson",
  founder: "chairperson",
};

const TIER_ORDER: { value: string; label: string }[] = [
  { value: "oasis", label: "Oasis" },
  { value: "delegate", label: "Delegate" },
  { value: "chairperson", label: "Chairperson" },
];

/**
 * Only Expo, Oasis, Delegate can upgrade. Chairperson, Partner, Exhibitor, Media, Speaker cannot.
 */
export function isUpgradeableAttendeeTier(ticketTypeOrName?: string): boolean {
  const t = normalizeType(ticketTypeOrName);
  if (!t) return false;
  if (t.includes("chairperson") || t.includes("founder")) return false;
  if (t.includes("exhibitor") || t.includes("partner")) return false;
  if (t.includes("media") || t.includes("speaker")) return false;
  if (t.includes("delegate") || t.includes("oasis")) return true;
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
  return TIER_ORDER;
}
