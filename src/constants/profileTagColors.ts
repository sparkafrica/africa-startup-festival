/**
 * Semantic colors for startup directory tags + company detail fact values.
 * country → green, growth → grey, industry → blue, year → amber
 */

export type ProfileTagKind = "country" | "growth" | "industry" | "year";

export const PROFILE_TAG_COLORS: Record<
  ProfileTagKind,
  { bg: string; border: string; text: string }
> = {
  country: { bg: "#F0FDF4", border: "#86EFAC", text: "#15803D" },
  growth: { bg: "#F5F5F5", border: "#D4D4D4", text: "#525252" },
  industry: { bg: "#EFF6FF", border: "#93C5FD", text: "#1D4ED8" },
  year: { bg: "#FEF3C7", border: "#FCD34D", text: "#B45309" },
};

/** Standard link blue for View Pitch Deck / LinkedIn. */
export const PROFILE_LINK_BLUE = "#1D4ED8";
