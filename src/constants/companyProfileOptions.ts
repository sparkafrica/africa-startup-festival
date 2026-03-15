/**
 * Company profile options for attendee onboarding (Complete Profile).
 * Collected for the company only, not public. Stored in user metadata.
 */

export interface SelectOption {
  id: string;
  label: string;
}

/** What is the size of your company? */
export const COMPANY_SIZE_OPTIONS: SelectOption[] = [
  { id: "1-50", label: "1-50" },
  { id: "51-100", label: "51-100" },
  { id: "101-250", label: "101-250" },
  { id: "251-500", label: "251-500" },
  { id: "501-1000", label: "501-1,000" },
  { id: "1001-5000", label: "1,001-5,000" },
  { id: "5001-10000", label: "5,001-10,000" },
  { id: "10001-20000", label: "10,001-20,000" },
  { id: "20001-50000", label: "20,001-50,000" },
  { id: "50001-plus", label: "50,001+" },
];

/** Which option best describes you or your company? */
export const COMPANY_TYPE_OPTIONS: SelectOption[] = [
  { id: "angel-investor", label: "Angel Investor" },
  { id: "aspiring-entrepreneur", label: "Aspiring Entrepreneur" },
  { id: "community-group", label: "Community Group/Institution" },
  { id: "enterprise-corporate", label: "Enterprise/Corporate" },
  { id: "private-equity", label: "Private Equity" },
  { id: "technology-solution-provider", label: "Technology Solution Provider/Vendor" },
  { id: "startup", label: "Startup" },
  { id: "vc-corporate-vc", label: "VC or Corporate VC" },
];

/** How involved are you in purchasing decisions at your company? */
export const PURCHASING_INFLUENCE_OPTIONS: SelectOption[] = [
  { id: "no-influence", label: "No influence on purchasing decisions" },
  { id: "some-influence", label: "Some influence on purchasing decisions" },
  { id: "key-influencer", label: "Key influencer on purchasing decisions" },
  { id: "final-decision-maker", label: "Final decision maker on purchasing decisions" },
];
