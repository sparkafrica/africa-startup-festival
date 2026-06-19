/**
 * Schedule programme CTAs (add/remove, feedback, My Schedule tab).
 * Set to false to hide CTAs and My Schedule (read-only programme preview).
 */
export const SCHEDULE_SESSION_CTAS_ENABLED = true;

/** Prepend MOCK_SCHEDULE_EVENT on Main Stage for UI preview — set false before release. */
export const SCHEDULE_MOCK_PREVIEW_ENABLED = false;

/** Session feedback form (Typeform) — opened from Leave a Feedback on programme rows. */
export const SESSION_FEEDBACK_FORM_URL =
  "https://form.typeform.com/to/aVlRM1Hp";

/**
 * EventSchedule.metadata (JSON) — backend reference:
 *
 * Sponsor only (Layer 3, Breet, etc.):
 *   { "sponsoredBy": { "name": "Layer 3", "color": "blue" } }
 *
 * Session format only (Live Podcast — no "Sponsored by" in UI):
 *   { "sessionBadge": { "label": "Live Podcast Session", "color": "purple" } }
 *
 * Both on one row:
 *   { "sessionBadge": { "label": "Live Podcast Session", "color": "purple" },
 *     "sponsoredBy": { "name": "Layer 3", "color": "blue" } }
 *
 * Do not put session titles in sponsoredBy.name — the app prefixes that field with "Sponsored by".
 *
 * AMA session (badge on card + Slido Q&A in session detail only):
 *   {
 *     "sessionBadge": { "label": "AMA Session", "color": "green" },
 *     "slidoUrl": "https://app.sli.do/event/your-room-code",
 *     "slidoPollUrl": "https://app.sli.do/event/your-room-code/live/polls"
 *   }
 *
 * slidoUrl — required for the green "Q&A" link in the full session sheet (opens in browser).
 * slidoPollUrl — optional; reserved for a future polls link (not shown in UI yet).
 * Non-AMA rows omit slidoUrl / slidoPollUrl.
 */
