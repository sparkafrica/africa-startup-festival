/** Shared LinkedIn extraction, validation, display and canonicalization. */

export const LINKEDIN_DISPLAY_LABEL = "LinkedIn";

export type LinkedInProfileKind = "person" | "company" | "any";

export interface LinkedInDisplayInfo {
  /** Canonical HTTPS URL safe to pass to Linking.openURL. */
  url: string;
  displayLabel: string;
}

const PERSON_PATHS = new Set(["in", "pub"]);
const COMPANY_PATHS = new Set(["company", "school", "showcase"]);
const LINKEDIN_KEYS = [
  "linkedIn",
  "linkedin_url",
  "linkedin",
  "linkedinUrl",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Read current and legacy LinkedIn fields. First non-empty value wins. */
export function extractLinkedInValue(...sources: unknown[]): string | null {
  for (const source of sources) {
    if (typeof source === "string" && source.trim()) return source.trim();
    if (!isRecord(source)) continue;

    for (const key of LINKEDIN_KEYS) {
      const value = source[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }

    for (const containerKey of ["socialLinks", "social_links"] as const) {
      const nested = source[containerKey];
      if (!isRecord(nested)) continue;
      for (const [key, value] of Object.entries(nested)) {
        if (
          key.toLowerCase() === "linkedin" &&
          typeof value === "string" &&
          value.trim()
        ) {
          return value.trim();
        }
      }
    }
  }
  return null;
}

function cleanLinkedInInput(value: unknown): string {
  if (typeof value !== "string") return "";
  let raw = value.trim();
  if (!raw) return "";

  // Historical imports can contain Markdown links or escaped protocol colons.
  const markdownTarget = raw.match(/\]\(\s*([^\s)]+)\s*\)/)?.[1];
  if (markdownTarget) raw = markdownTarget;
  return raw
    .replace(/\\([:/])/g, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/^[<'"\s]+|[>'"\s]+$/g, "")
    .trim();
}

function isAllowedLinkedInHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  return host === "linkedin.com" || host.endsWith(".linkedin.com");
}

function pathMatchesKind(pathname: string, kind: LinkedInProfileKind): boolean {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length < 2 || !segments[1]) return false;
  const root = segments[0].toLowerCase();
  const identifier = segments[1];
  if (!/^[a-z0-9._~-]+$/i.test(identifier)) return false;
  if (root !== "pub" && segments.length !== 2) return false;
  if (kind === "person") return PERSON_PATHS.has(root);
  if (kind === "company") return COMPANY_PATHS.has(root);
  return PERSON_PATHS.has(root) || COMPANY_PATHS.has(root);
}

/**
 * Convert a LinkedIn profile/company URL or username to one canonical URL.
 * Invalid, incomplete, and non-LinkedIn URLs return null.
 */
export function normalizeLinkedInUrl(
  value: unknown,
  kind: LinkedInProfileKind = "any",
): string | null {
  const raw = cleanLinkedInInput(value);
  if (!raw) return null;

  const withoutAt = raw.replace(/^@/, "");
  const looksLikeUrl =
    /^https?:\/\//i.test(withoutAt) ||
    /^(?:[a-z0-9-]+\.)*linkedin\.com(?:\/|$)/i.test(withoutAt);

  if (!looksLikeUrl) {
    // Username-only input represents a personal profile, never a company page.
    if (kind === "company" || !/^[a-z0-9._%-]+$/i.test(withoutAt)) return null;
    return `https://www.linkedin.com/in/${withoutAt}`;
  }

  const candidate = /^https?:\/\//i.test(withoutAt)
    ? withoutAt
    : `https://${withoutAt}`;

  try {
    const parsed = new URL(candidate);
    if (!isAllowedLinkedInHost(parsed.hostname)) return null;
    if (!pathMatchesKind(parsed.pathname, kind)) return null;
    const cleanPath = parsed.pathname
      .replace(/\/{2,}/g, "/")
      .replace(/\/+$/, "");
    return `https://www.linkedin.com${cleanPath}`;
  } catch {
    return null;
  }
}

export function getLinkedInDisplayInfo(
  value: unknown,
  kind: LinkedInProfileKind = "any",
): LinkedInDisplayInfo | null {
  const url = normalizeLinkedInUrl(value, kind);
  return url ? { url, displayLabel: LINKEDIN_DISPLAY_LABEL } : null;
}

export function validateLinkedInInput(
  value: unknown,
  kind: LinkedInProfileKind = "person",
): { valid: boolean; url?: string; error?: string } {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) {
    return { valid: false, error: "Please enter your LinkedIn profile URL." };
  }
  if (raw.length > 500) {
    return { valid: false, error: "LinkedIn must be under 500 characters." };
  }
  const url = normalizeLinkedInUrl(raw, kind);
  if (!url) {
    const example =
      kind === "company"
        ? "https://www.linkedin.com/company/your-company"
        : "https://www.linkedin.com/in/yourname";
    return {
      valid: false,
      error: `Please enter a complete LinkedIn URL (e.g. ${example}).`,
    };
  }
  return { valid: true, url };
}
