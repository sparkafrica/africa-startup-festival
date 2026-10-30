import { getEventFeatures } from "../config/eventFeatures";

/** Read the manually selected ASF event mode. */
export function useEventFeatures() {
  return getEventFeatures();
}
