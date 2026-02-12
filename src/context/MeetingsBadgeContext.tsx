import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { meetingService } from "../services/meetingService";

interface MeetingsBadgeContextValue {
  count: number;
  refresh: () => Promise<void>;
}

const MeetingsBadgeContext = createContext<MeetingsBadgeContextValue | null>(
  null
);

const REFRESH_THROTTLE_MS = 30_000; // Refetch at most every 30s when refresh() is called

/**
 * Single source of truth for the Meetings tab badge count (scheduled + meeting requests).
 * Fetches when user is set; refresh() refetches (throttled) so any tab can trigger an update.
 * This makes the badge consistent and visible on all screens (including Home for assignees).
 */
export function MeetingsBadgeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const lastFetchedAtRef = React.useRef<number>(0);

  const fetchCount = useCallback(async (force = false) => {
    if (!user?.user_id) {
      setCount(0);
      return;
    }
    const now = Date.now();
    if (!force && now - lastFetchedAtRef.current < REFRESH_THROTTLE_MS) {
      return;
    }
    lastFetchedAtRef.current = now;
    try {
      const [physicalMeetings, virtualMeetings] = await Promise.all([
        meetingService.getMeetings(),
        meetingService.getVirtualMeetings(),
      ]);
      const include = (status: string) =>
        status === "pending" || status === "accepted";
      const physicalCount = physicalMeetings.filter((m) => include(m.status)).length;
      const virtualCount = virtualMeetings.filter((m) => include(m.status)).length;
      setCount(physicalCount + virtualCount);
    } catch {
      setCount(0);
    }
  }, [user?.user_id]);

  useEffect(() => {
    fetchCount(true); // initial fetch always runs
  }, [fetchCount]);

  const refresh = useCallback(async () => {
    await fetchCount(false); // throttled when called from focus
  }, [fetchCount]);

  const value: MeetingsBadgeContextValue = { count, refresh };

  return (
    <MeetingsBadgeContext.Provider value={value}>
      {children}
    </MeetingsBadgeContext.Provider>
  );
}

export function useMeetingsBadgeContext(): MeetingsBadgeContextValue {
  const ctx = useContext(MeetingsBadgeContext);
  if (!ctx) {
    throw new Error(
      "useMeetingsBadgeContext must be used within MeetingsBadgeProvider"
    );
  }
  return ctx;
}
