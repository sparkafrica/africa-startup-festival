/**
 * Startup growth stages for create/edit forms and public directory display.
 * Stored on company metadata as metadata.growth_stage (label string).
 */

export const GROWTH_STAGE_OPTIONS = [
  { id: "pre-seed", label: "Pre-Seed" },
  { id: "seed", label: "Seed" },
  { id: "series-a", label: "Series A" },
  { id: "series-a-plus", label: "Series A+" },
  { id: "ipo", label: "IPO" },
] as const;

export type GrowthStageId = (typeof GROWTH_STAGE_OPTIONS)[number]["id"];

export function growthStageLabelFromId(id: string): string {
  return GROWTH_STAGE_OPTIONS.find((o) => o.id === id)?.label ?? id;
}

export function growthStageIdFromLabel(label: string): GrowthStageId | null {
  const lower = label.trim().toLowerCase();
  const match = GROWTH_STAGE_OPTIONS.find(
    (o) => o.label.toLowerCase() === lower || o.id === lower,
  );
  return match?.id ?? null;
}

/** Valid founding year range for create form. */
export function validateYearFounded(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "Year founded is required";
  if (!/^\d{4}$/.test(trimmed)) return "Year founded must be a 4-digit year";
  const year = Number(trimmed);
  const current = new Date().getFullYear();
  if (year < 1900 || year > current) {
    return `Year founded must be between 1900 and ${current}`;
  }
  return null;
}
