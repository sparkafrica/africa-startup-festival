/**
 * Post-event wind-down — disabled for ASF v1.
 * Re-enable with ASF event dates when post-event virtual networking ships.
 */

/** First calendar day after ASF event (post-event mode starts at midnight WAT). */
export const EVENT_POST_EVENT_START_ISO = "2099-01-01";

/**
 * Set to true locally to preview post-event UI.
 * Ship OTA with false — production uses the date gate only.
 */
export const POST_EVENT_MODE_PREVIEW = false;

/** Overall event feedback form — configure when ASF feedback URL is ready. */
export const EVENT_FEEDBACK_FORM_URL = "";

export function isPostEventMode(_now = Date.now()): boolean {
  return false;
}
