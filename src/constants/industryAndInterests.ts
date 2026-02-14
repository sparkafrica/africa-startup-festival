/**
 * Industry/Sector and Top Interest options used across:
 * - Complete Profile & Manage Profile (industry dropdown, top interests multi-select)
 * - Attendees filter modal (Industry/Sector, Top Interests)
 * - Attendee cards display backend metadata.industry and metadata.interests
 */

export interface IndustryOption {
  id: string;
  label: string;
}

/** Industry/Sector options for dropdown and filters. */
export const INDUSTRY_OPTIONS: IndustryOption[] = [
  { id: "legal-legal-tech", label: "Legal & Legal-tech" },
  { id: "payments-digital-banking", label: "Payments & Digital Banking" },
  { id: "blockchain-cryptocurrency", label: "Blockchain & Cryptocurrency" },
  { id: "cybersecurity", label: "Cybersecurity" },
  { id: "entertainment-media", label: "Entertainment & Media" },
  { id: "ai-ml", label: "Artificial Intelligence & Machine Learning" },
  { id: "cloud-enterprise-software", label: "Cloud Computing & Enterprise Software" },
  { id: "telecoms-connectivity", label: "Telecommunications & Connectivity (incl. 5G)" },
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
  { id: "manufacturing-industry-4", label: "Manufacturing Tech (Industry 4.0)" },
  { id: "energy-tech", label: "Energy Tech" },
  { id: "deep-tech-frontier", label: "Deep Tech & Frontier Technologies" },
  { id: "others", label: "Others" },
];

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
