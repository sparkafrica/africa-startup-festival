/**
 * LinkedIn display and URL normalization.
 * - Backend/metadata stores the user's full profile URL (or username).
 * - Pills show a short display label (username) for clarity.
 * - Opening the pill always uses the full URL.
 * - Supports any LinkedIn URL shape (linkedin.com, linkedin.co.uk, etc.) for username extraction.
 */

export interface LinkedInDisplayInfo {
  /** Full URL to use when opening (Linking.openURL). */
  url: string;
  /** Short label for pill display (e.g. "ifeanyi-nneji"). */
  displayLabel: string;
}

/**
 * Normalize LinkedIn input (URL or username) to full URL and display label.
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
  let displayLabel: string;

  const lower = raw.toLowerCase();
  const hasProtocol = lower.startsWith("http://") || lower.startsWith("https://");

  if (hasProtocol || lower.includes("linkedin")) {
    // Full URL or partial URL (linkedin.com, linkedin.co.uk, uk.linkedin.com, etc.)
    url = raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    url = url.replace(/\?.*$/, "").replace(/\/+$/, "");
    const match = url.match(/linkedin[^/]*\/in\/([^/?]+)/i);
    displayLabel = match ? match[1].trim() : "Profile";
  } else {
    // Username only
    const username = raw.replace(/^\/+|\/+$/g, "");
    displayLabel = username || "Profile";
    url = `https://www.linkedin.com/in/${username}`;
  }

  if (!displayLabel) displayLabel = "Profile";
  return { url, displayLabel };
}
