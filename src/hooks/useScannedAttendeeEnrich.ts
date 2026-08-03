import { useEffect, useState } from "react";
import type { Attendee } from "../services/ticketService";
import { attendeeService } from "../services/attendeeService";
import { EVENT_ID } from "../config/env";
import {
  mergeAttendeeProfiles,
  normalizeAttendee,
  type AttendeeLike,
} from "../utils/normalizeAttendee";

/**
 * Stale-while-revalidate: show scan payload immediately, merge directory enrich in background.
 */
export function useScannedAttendeeEnrich(
  source: Attendee | null | undefined,
  options?: { enabled?: boolean },
) {
  const enabled = options?.enabled !== false;
  const [attendee, setAttendee] = useState<Attendee | null>(
    source ? normalizeAttendee(source) : null,
  );
  const [isEnriching, setIsEnriching] = useState(false);

  useEffect(() => {
    if (!enabled || !source?.user?.id) {
      setAttendee(source ? normalizeAttendee(source) : null);
      setIsEnriching(false);
      return;
    }

    const initial = normalizeAttendee(source);
    setAttendee(initial);

    let cancelled = false;
    setIsEnriching(true);

    void attendeeService
      .getAttendeeByUserId(EVENT_ID, String(initial.user.id))
      .then((enriched) => {
        if (cancelled) return;
        setAttendee(mergeAttendeeProfiles(initial, enriched as AttendeeLike));
      })
      .catch(() => {
        if (!cancelled) setAttendee(initial);
      })
      .finally(() => {
        if (!cancelled) setIsEnriching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, source?.user?.id]);

  return { attendee, isEnriching, setAttendee };
}
