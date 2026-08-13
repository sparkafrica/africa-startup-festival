/**
 * LinkedIn display and URL normalization.
 * - Backend/metadata stores the user's full profile URL (or username).
 * - Pills always show "LinkedIn" (never the username/slug).
 * - Opening the pill always uses the full URL.
 * - Supports any LinkedIn URL shape (linkedin.com, linkedin.co.uk, etc.).
 */

export const LINKEDIN_DISPLAY_LABEL = "LinkedIn";

export interface LinkedInDisplayInfo {
  /** Full URL to use when opening (Linking.openURL). */
  url: string;
  /** Short label for pill display — always "LinkedIn". */
  displayLabel: string;
}

/**
 * Normalize LinkedIn input (URL or username) to a full URL.
 * Use .url when opening the link and .displayLabel for the pill text.
 *
 * @param linkedInUrlOrUsername - From metadata.linkedIn / metadata.linkedin_url (full URL or username)
 * @returns { url, displayLabel } or null if empty
 */
export function getLinkedInDisplayInfo(
  linkedInUrlOrUsername: string | null | undefined
): LinkedInDisplayInfo | null {
  const raw = typeof linkedInUrlOrUsername === "string" ? linkedInUrlOrUsername.trim() : "";
  if (!raw) return null;

  let url: string;

  const lower = raw.toLowerCase();
  const hasProtocol = lower.startsWith("http://") || lower.startsWith("https://");

  if (hasProtocol || lower.includes("linkedin")) {
    url = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    url = url.replace(/\?.*$/, "").replace(/\/+$/, "");
  } else {
    const username = raw.replace(/^\/+|\/+$/g, "");
    if (!username) return null;
    url = `https://www.linkedin.com/in/${username}`;
  }

  return { url, displayLabel: LINKEDIN_DISPLAY_LABEL };
}
