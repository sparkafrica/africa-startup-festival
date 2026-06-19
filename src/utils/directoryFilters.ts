/**
 * Client-side directory filtering (exhibitors, partners, speakers)
 * aligned with AttendeesScreen: AND across categories, OR within a category.
 */

export type FilterCategoryLike = {
  id: string;
  options: { id: string; label: string }[];
};

import { coerceMetadataStringArray } from "./metadataCoerce";

function coerceStringArray(value: unknown): string[] {
  return coerceMetadataStringArray(value);
}

function normalize(s: string): string {
  return s.toLowerCase().trim();
}

/** Map selected option ids → category id → option labels (for substring matching). */
function labelsByCategoryFromFilterIds(
  filterIds: string[],
  categories: FilterCategoryLike[]
): Record<string, string[]> {
  const byCategory: Record<string, string[]> = {};
  for (const id of filterIds) {
    const cat = categories.find((c) => c.options.some((o) => o.id === id));
    if (!cat) continue;
    const opt = cat.options.find((o) => o.id === id);
    if (!opt) continue;
    if (!byCategory[cat.id]) byCategory[cat.id] = [];
    byCategory[cat.id].push(opt.label);
  }
  return byCategory;
}

export type DirectoryCompanyFilterFields = {
  company_sector?: string | null;
  company_description?: string | null;
  metadata?: Record<string, unknown> | null;
};

export function directoryCompanyMatchesFilters(
  filterIds: string[],
  categories: FilterCategoryLike[],
  company: DirectoryCompanyFilterFields
): boolean {
  if (filterIds.length === 0) return true;
  const byCategory = labelsByCategoryFromFilterIds(filterIds, categories);
  const meta = company.metadata && typeof company.metadata === "object" ? company.metadata : {};

  for (const catId of Object.keys(byCategory)) {
    const labels = byCategory[catId];
    if (catId === "industry") {
      const sector = normalize(company.company_sector || "");
      const metaInd =
        typeof meta.industry === "string" ? normalize(meta.industry) : "";
      const desc = normalize(company.company_description || "");
      const blob = [sector, metaInd, desc].filter(Boolean).join(" ");
      const ok = labels.some((l) => {
        const nl = normalize(l);
        return (
          blob.includes(nl) ||
          (sector && nl.includes(sector)) ||
          (metaInd && nl.includes(metaInd))
        );
      });
      if (!ok) return false;
      continue;
    }
    if (catId === "interests") {
      const list = coerceStringArray(meta.interests).map(normalize);
      const desc = normalize(company.company_description || "");
      const ok = labels.some((l) => {
        const nl = normalize(l);
        if (desc.includes(nl)) return true;
        return list.some(
          (i) => i.includes(nl) || nl.includes(i)
        );
      });
      if (!ok) return false;
      continue;
    }
    return false;
  }
  return true;
}

function roleMatchesJobLabel(roleNorm: string, labelNorm: string): boolean {
  if (!labelNorm) return false;
  if (roleNorm.includes(labelNorm) || labelNorm.includes(roleNorm)) return true;
  const parts = labelNorm.split(/[/,&]+/).map((p) => p.trim()).filter((p) => p.length >= 2);
  return parts.some((p) => roleNorm.includes(p));
}

export type SpeakerFilterFields = {
  role?: string | null;
  company?: string | null;
  description?: string | null;
  fullName?: string | null;
};

/** Industry/interests: loose match on visible text (no dedicated API fields). */
export function speakerRowMatchesFilters(
  filterIds: string[],
  categories: FilterCategoryLike[],
  speaker: SpeakerFilterFields
): boolean {
  if (filterIds.length === 0) return true;
  const byCategory = labelsByCategoryFromFilterIds(filterIds, categories);
  const roleNorm = normalize(speaker.role || "");
  const textBlob = normalize(
    [speaker.company, speaker.description, speaker.role, speaker.fullName]
      .filter(Boolean)
      .join(" ")
  );

  for (const catId of Object.keys(byCategory)) {
    const labels = byCategory[catId];
    if (catId === "job-title") {
      const descNorm = normalize(speaker.description || "");
      const haystack = `${roleNorm} ${descNorm}`.trim();
      const ok = labels.some((l) =>
        roleMatchesJobLabel(haystack, normalize(l))
      );
      if (!ok) return false;
      continue;
    }
    if (catId === "industry" || catId === "interests") {
      const ok = labels.some((l) => {
        const nl = normalize(l);
        return (
          textBlob.includes(nl) ||
          nl
            .split(/[/\s-]+/)
            .some((tok) => tok.length > 2 && textBlob.includes(tok))
        );
      });
      if (!ok) return false;
      continue;
    }
    return false;
  }
  return true;
}
