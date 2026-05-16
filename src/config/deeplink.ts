/**
 * Universal / app-link host and custom scheme for email digest & marketing deeplinks.
 * Backend must host AASA + assetlinks.json on DEEP_LINK_HOST (see docs in repo / PM handoff).
 */
export const DEEP_LINK_HOST = "app.africatechnologyexpo.com";
export const DEEP_LINK_SCHEME = "spark";
export const DEEP_LINK_HTTPS_PREFIX = `https://${DEEP_LINK_HOST}`;

/** Prefixes passed to React Navigation `linking.prefixes`. */
export const DEEP_LINK_PREFIXES = [
  DEEP_LINK_HTTPS_PREFIX,
  `${DEEP_LINK_SCHEME}://`,
] as const;



// Base host (from the app): https://app.africatechnologyexpo.com

// Digest CTA	URL to give backend
// Download app
// https://app.africatechnologyexpo.com/download
// Meetings (general)
// https://app.africatechnologyexpo.com/meetings
// Inbound meeting invites
// https://app.africatechnologyexpo.com/meetings/inbound
// Pending connection requests
// https://app.africatechnologyexpo.com/connections
// Attendees (if needed later)
// https://app.africatechnologyexpo.com/attendees

