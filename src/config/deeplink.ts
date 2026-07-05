/**
 * Universal / app-link host and custom scheme for email digest & marketing deeplinks.
 * Backend must host AASA + assetlinks.json on DEEP_LINK_HOST (see docs in repo / PM handoff).
 */
export const DEEP_LINK_HOST = "app.africastartupfestival.com";
export const DEEP_LINK_SCHEME = "spark-asf";
export const DEEP_LINK_HTTPS_PREFIX = `https://${DEEP_LINK_HOST}`;

/** Prefixes passed to React Navigation `linking.prefixes`. */
export const DEEP_LINK_PREFIXES = [
  DEEP_LINK_HTTPS_PREFIX,
  `${DEEP_LINK_SCHEME}://`,
] as const;

/** Numbered digest URLs (1–9) and entity id links — see `digestDeepLinks.ts` */
export {
  DIGEST_DEEP_LINKS,
  ENTITY_DEEP_LINKS,
  BACKEND_EMAIL_DEEP_LINK_LINES,
  entityDeepLinkUrl,
} from "./digestDeepLinks";
