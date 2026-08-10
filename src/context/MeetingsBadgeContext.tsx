import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  countMeetingsForBadge,
  countMeetingsForBadgeFromCache,
  ensureMeetingsList,
  isMeetingsListCacheFresh,
} from "../utils/meetingsListCache";

interface MeetingsBadgeContextValue {
  count: number;
  refresh: () => Promise<void>;
}

const MeetingsBadgeContext = createContext<MeetingsBadgeContextValue | null>(
  null,
);

const REFRESH_THROTTLE_MS = 30_000;

/**
 * Meetings tab badge — reads from shared meetingsListCache (deduped with Meetings screen).
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
    if (!force && isMeetingsListCacheFresh()) {
      setCount(countMeetingsForBadgeFromCache());
      return;
    }

    if (!force && now - lastFetchedAtRef.current < REFRESH_THROTTLE_MS) {
      setCount(countMeetingsForBadgeFromCache());
      return;
    }

    lastFetchedAtRef.current = now;
    try {
      const snap = await ensureMeetingsList({ force });
      setCount(countMeetingsForBadge(snap.physical, snap.virtual));
    } catch {
      setCount(countMeetingsForBadgeFromCache());
    }
  }, [user?.user_id]);

  useEffect(() => {
    void fetchCount(true);
  }, [fetchCount]);

  const refresh = useCallback(async () => {
    await fetchCount(false);
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
      "useMeetingsBadgeContext must be used within MeetingsBadgeProvider",
    );
  }
  return ctx;
}
