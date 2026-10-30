/** Manual ASF Kenya post-event switch while the experience is under review. */
import { EVENT_ID } from "./env";

/** Review the post-event experience now; change only after the UI is vetted. */
export const ASF_POST_EVENT_MODE_ENABLED = true;

export function isPostEventMode(): boolean {
  return EVENT_ID === 11 && ASF_POST_EVENT_MODE_ENABLED;
}
