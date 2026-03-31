import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { listConversations } from "../services/chatService";
import { EVENT_ID } from "../config/env";

interface MessagesBadgeContextValue {
  count: number;
  /** Pass `{ force: true }` to skip throttle (e.g. after inbox refetch or tab focus). */
  refresh: (opts?: { force?: boolean }) => Promise<void>;
}

const MessagesBadgeContext = createContext<MessagesBadgeContextValue | null>(
  null
);

const REFRESH_THROTTLE_MS = 30_000;

function getUnreadCount(raw: string): number {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

export function MessagesBadgeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const lastFetchedAtRef = useRef<number>(0);

  const fetchCount = useCallback(
    async (force = false) => {
      if (!user?.user_id) {
        setCount(0);
        return;
      }
      const now = Date.now();
      if (!force && now - lastFetchedAtRef.current < REFRESH_THROTTLE_MS) {
        return;
      }
      try {
        const { conversations } = await listConversations(EVENT_ID, {
          ordering: "-updated_at",
          page: 1,
          page_size: 100,
        });
        const totalUnread = conversations.reduce(
          (sum, c) => sum + getUnreadCount(c.unread_count),
          0
        );
        setCount(totalUnread);
        lastFetchedAtRef.current = Date.now();
      } catch {
        /* Do not advance lastFetchedAt on failure so we are not throttled from retrying. */
        setCount(0);
      }
    },
    [user?.user_id]
  );

  useEffect(() => {
    fetchCount(true);
  }, [fetchCount]);

  const refresh = useCallback(
    async (opts?: { force?: boolean }) => {
      await fetchCount(opts?.force === true);
    },
    [fetchCount]
  );

  const value: MessagesBadgeContextValue = { count, refresh };

  return (
    <MessagesBadgeContext.Provider value={value}>
      {children}
    </MessagesBadgeContext.Provider>
  );
}

export function useMessagesBadgeContext(): MessagesBadgeContextValue {
  const ctx = useContext(MessagesBadgeContext);
  if (!ctx) {
    throw new Error(
      "useMessagesBadgeContext must be used within a MessagesBadgeProvider"
    );
  }
  return ctx;
}

