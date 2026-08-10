/**
 * Industry/Sector and Top Interest options used across:
 * - Complete Profile & Manage Profile (industry dropdown, top interests multi-select)
 * - Attendees filter modal (Industry/Sector, Top Interests)
 * - Attendee cards display backend metadata.industry (canonical id or label) and metadata.interests
 */

export interface IndustryOption {
  id: string;
  label: string;
}

/** Industry/Sector options for dropdown and filters. */
export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { id: "technology", label: "Technology" },
  { id: "legal-legal-tech", label: "Legal & Legal-tech" },
  { id: "payments-digital-banking", label: "Payments & Digital Banking" },
  { id: "blockchain-cryptocurrency", label: "Blockchain & Cryptocurrency" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "entertainment-media", label: "Entertainment & Media" },
  { id: "ai-ml", label: "Artificial Intelligence & Machine Learning" },
  {
    id: "cloud-enterprise-software",
    label: "Cloud Computing & Enterprise Software",
  },
  {
    id: "telecoms-connectivity",
    label: "Telecommunications & Connectivity (incl. 5G)",
  },
  { id: "hardware-devices", label: "Hardware & Devices" },
  { id: "iot", label: "Internet of Things (IoT)" },
  { id: "data-analytics-big-data", label: "Data Analytics & Big Data" },
  { id: "ecommerce-retail-tech", label: "E-Commerce & Retail Tech" },
  { id: "digital-infrastructure", label: "Digital Infrastructure" },
  { id: "agritech", label: "AgriTech" },
  { id: "healthtech", label: "HealthTech" },
  { id: "edtech", label: "EdTech" },
  { id: "logistics-supply-chain", label: "Logistics & Supply Chain Tech" },
  { id: "mobility-transport", label: "Mobility & Transport Tech" },
  { id: "cleantech-renewable", label: "CleanTech & Renewable Energy" },
  { id: "robotics-automation", label: "Robotics & Automation" },
  { id: "drone-technology", label: "Drone Technology" },
  { id: "regtech-compliance", label: "RegTech & Compliance" },
  { id: "govtech-public-sector", label: "GovTech & Public Sector Innovation" },
  { id: "startup-ecosystem-vc", label: "Startup Ecosystem & Venture Capital" },
  { id: "policy-regulation", label: "Policy & Regulation (Tech Governance)" },
  { id: "web3-decentralized", label: "Web3 & Decentralized Tech" },
  { id: "insurtech", label: "InsurTech" },
  { id: "proptech", label: "PropTech" },
  {
    id: "manufacturing-industry-4",
    label: "Manufacturing Tech (Industry 4.0)",
  },
  { id: "energy-tech", label: "Energy Tech" },
  { id: "deep-tech-frontier", label: "Deep Tech & Frontier Technologies" },
  { id: "hr-human-resources", label: "HR (Human Resources)" },
  { id: "professional Services", label: "Professional Services" },
  { id: "consultancy", label: "Consultancy" },
  { id: "others", label: "Others" },
];

function normalizeIndustryKey(value: string): string {
  return value.toLowerCase().trim();
}

/** Web/ticket registration values that predate canonical ids. */
const LEGACY_INDUSTRY_ALIASES: Record<string, string> = {
  healthcareandpharmaceuticals: "healthtech",
  renewableenergytechnology: "cleantech-renewable",
};

function legacyIndustryId(value: string): string | undefined {
  const key = normalizeIndustryKey(value).replace(/[^a-z0-9]/g, "");
  return LEGACY_INDUSTRY_ALIASES[key];
}

/** Match stored metadata (id or label) to a canonical industry option. */
export function findIndustryOption(
  value: string | undefined | null,
): IndustryOption | undefined {
  if (!value?.trim()) return undefined;
  const raw = value.trim();
  const key = normalizeIndustryKey(raw);

  const legacyId = legacyIndustryId(raw);
  if (legacyId) {
    const legacy = INDUSTRY_OPTIONS.find((o) => o.id === legacyId);
    if (legacy) return legacy;
  }

  const byId = INDUSTRY_OPTIONS.find((o) => normalizeIndustryKey(o.id) === key);
  if (byId) return byId;

  const byLabel = INDUSTRY_OPTIONS.find(
    (o) => normalizeIndustryKey(o.label) === key,
  );
  if (byLabel) return byLabel;

  const slug = raw
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
  return INDUSTRY_OPTIONS.find(
    (o) => o.id === slug || normalizeIndustryKey(o.id) === slug,
  );
}

/** Display label for cards and profile UI (accepts canonical id or legacy label). */
export function resolveIndustryLabel(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return findIndustryOption(trimmed)?.label ?? trimmed;
}

/** Canonical id for prefill and API writes (accepts id or legacy label). */
export function resolveIndustryId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return findIndustryOption(trimmed)?.id;
}

/** Top Interest labels (stored in metadata.interests). Validation: select 3–7. */
export const TOP_INTERESTS: string[] = [
  "Investment",
  "Innovation",
  "AI",
  "Fintech",
  "Blockchain & Crypto",
  "Enterprise",
  "Ecommerce",
  "Cybersecurity",
  "Cloud",
  "Developers",
  "Product Management",
  "Healthtech",
  "Edtech",
  "Agritech",
  "Mobility",
  "Telecoms",
  "Media",
  "Marketing",
  "Policy",
  "Talent",
  "Legal",
  "Robotics",
  "HR (Human Resources)",
  "Professional Services",
  "Consultancy",
];

/** For filter modal: interests as { id, label }. id is slug for matching. */
/** Slug for filter option id. */
function slug(label: string): string {
  return label
    .toLowerCase()
    .replace(/\s*&\s*/g, "-")
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

/** For filter modal: interests as { id, label }. */
export function getInterestFilterOptions(): { id: string; label: string }[] {
  return TOP_INTERESTS.map((label) => ({ id: slug(label), label }));
}

/** Shape matches `FilterCategory` from `FilterModal` (no UI import here). */
export interface IndustryInterestFilterCategory {
  id: string;
  title: string;
  options: { id: string; label: string }[];
}

/**
 * Industry/Sector + Interests filter groups for directory screens and attendees.
 * Single source of truth with profile dropdowns and attendee filtering.
 */
export function getIndustryAndInterestFilterCategories(): IndustryInterestFilterCategory[] {
  return [
    {
      id: "industry",
      title: "Industry / Sector",
      options: INDUSTRY_OPTIONS,
    },
    {
      id: "interests",
      title: "Interests",
      options: getInterestFilterOptions(),
    },
  ];
}

/** Industry / Sector only — partners & exhibitors directory filters. */
export function getIndustryFilterCategories(): IndustryInterestFilterCategory[] {
  return [
    {
      id: "industry",
      title: "Industry / Sector",
      options: INDUSTRY_OPTIONS,
    },
  ];
}

/**
 * Startups directory filters: growth stage + industry/sector (no interests).
 * Growth options come from startupGrowthStages — import lazily via ids/labels there.
 */
export function getStartupDirectoryFilterCategories(
  growthStageOptions: { id: string; label: string }[],
): IndustryInterestFilterCategory[] {
  return [
    {
      id: "growth-stage",
      title: "Growth stage",
      options: growthStageOptions,
    },
    {
      id: "industry",
      title: "Industry / Sector",
      options: INDUSTRY_OPTIONS,
    },
  ];
}
