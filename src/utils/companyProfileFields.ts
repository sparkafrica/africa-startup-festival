import type { Company } from "../services/authService";
import { boothService } from "../services/boothService";
import { EVENT_ID } from "../config/env";

export function normalizeCompanyType(input?: string): string {
  return (input ?? "").toLowerCase().trim();
}

export function isStartupCompanyType(companyType?: string): boolean {
  return normalizeCompanyType(companyType).includes("startup");
}

export function isExhibitorCompanyType(companyType?: string): boolean {
  return normalizeCompanyType(companyType).includes("exhibitor");
}

export function isPartnerCompanyType(companyType?: string): boolean {
  const t = normalizeCompanyType(companyType);
  return t.includes("partner") || t.includes("sponsor");
}

/** Exhibitor & partner profiles show an assigned booth; startup profiles do not. */
export function showsBoothInCompanyProfile(companyType?: string): boolean {
  if (isStartupCompanyType(companyType)) return false;
  return isExhibitorCompanyType(companyType) || isPartnerCompanyType(companyType);
}

/** Startup profiles collect problem, solution, and pitch deck link. */
export function showsStartupDetailFieldsInCompanyProfile(
  companyType?: string,
): boolean {
  return isStartupCompanyType(companyType);
}

export function resolveCompanyType(
  company?: Pick<Company, "company_type"> | null,
  ticketType?: string,
): string {
  const fromCompany = normalizeCompanyType(company?.company_type);
  if (fromCompany) return fromCompany;

  const t = normalizeCompanyType(ticketType);
  if (t.includes("startup") || t.includes("founder")) return "startup";
  if (t.includes("exhibitor")) return "exhibitor";
  if (t.includes("partner") || t.includes("sponsor")) return "partner";
  return "";
}

export function boothFromCompanyMetadata(company?: Company | null): string | null {
  if (!company) return null;

  let metadata = company.metadata;
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata) as Record<string, unknown>;
    } catch {
      metadata = {};
    }
  }
  const meta = (metadata ?? {}) as Record<string, unknown>;

  const boothInfo = (company as Company & { booth_info?: { booth_number?: string } })
    .booth_info?.booth_number;
  if (typeof boothInfo === "string" && boothInfo.trim()) {
    return boothInfo.trim();
  }
  if (typeof meta.booth === "string" && meta.booth.trim()) {
    return meta.booth.trim();
  }
  if (typeof meta.boothNumber === "string" && meta.boothNumber.trim()) {
    return meta.boothNumber.trim();
  }
  return null;
}

export async function fetchAssignedBoothNumber(
  company?: Company | null,
): Promise<string | null> {
  try {
    const { booth_number } = await boothService.getMyBooth(EVENT_ID);
    if (booth_number?.trim()) return booth_number.trim();
  } catch {
    // Fall back to company payload when booth endpoint is unavailable.
  }
  return boothFromCompanyMetadata(company);
}
