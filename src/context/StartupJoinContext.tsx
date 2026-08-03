import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import {
  joinRequestService,
  type JoinRequest,
} from "../services/joinRequestService";
import { getCurrentUserTicketType } from "../utils/asfTicketClass";
import {
  resolveStartupJoinViewState,
  type StartupJoinViewState,
} from "../utils/startupJoinStatus";
import { syncStartupJoinAdminReminders } from "../utils/startupJoinReminders";
import {
  emitStartupJoinRefresh,
  subscribeStartupJoinRefresh,
} from "../utils/startupJoinSync";

type StartupJoinContextValue = {
  viewState: StartupJoinViewState;
  joinRequests: JoinRequest[];
  adminPendingRequests: JoinRequest[];
  isLoading: boolean;
  error: string | null;
  isActing: boolean;
  refresh: () => Promise<void>;
  approveRequest: (requestId: number) => Promise<void>;
  denyRequest: (requestId: number) => Promise<void>;
  startupBadge: StartupJoinViewState["badge"] | null;
};

const StartupJoinContext = createContext<StartupJoinContextValue | null>(null);

export function StartupJoinProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const userId = user?.user_id;
  const [ticketType, setTicketType] = useState("");
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [adminPendingRequests, setAdminPendingRequests] = useState<JoinRequest[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);
  const loadedForUserRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) {
      setJoinRequests([]);
      setAdminPendingRequests([]);
      loadedForUserRef.current = null;
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [requestsResult, adminResult, tier] = await Promise.all([
        joinRequestService.listJoinRequests({ page_size: 50 }),
        joinRequestService.listPendingForAdmin({ page_size: 50 }).catch(() => ({
          requests: [] as JoinRequest[],
          pagination: { count: 0, next: null, previous: null },
        })),
        ticketType ? Promise.resolve(ticketType) : getCurrentUserTicketType(),
      ]);

      if (!ticketType && tier) setTicketType(tier);

      setJoinRequests(requestsResult.requests);
      setAdminPendingRequests(adminResult.requests);
      loadedForUserRef.current = userId;

      await syncStartupJoinAdminReminders(adminResult.requests.length);
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "message" in e
          ? String((e as { message?: string }).message)
          : "Failed to load startup join status";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [ticketType, userId]);

  useEffect(() => {
    if (!userId) {
      setJoinRequests([]);
      setAdminPendingRequests([]);
      loadedForUserRef.current = null;
      return;
    }
    if (loadedForUserRef.current === userId) return;
    void refresh();
  }, [refresh, userId]);

  useEffect(() => {
    return subscribeStartupJoinRefresh(() => {
      void refresh();
    });
  }, [refresh]);

  const viewState: StartupJoinViewState = useMemo(
    () =>
      resolveStartupJoinViewState({
        profile: user,
        ticketType,
        userId,
        joinRequests,
        adminPendingRequests,
      }),
    [adminPendingRequests, joinRequests, ticketType, user, userId],
  );

  const approveRequest = useCallback(
    async (requestId: number) => {
      setIsActing(true);
      try {
        await joinRequestService.approve(requestId);
        await refresh();
        emitStartupJoinRefresh();
      } finally {
        setIsActing(false);
      }
    },
    [refresh],
  );

  const denyRequest = useCallback(
    async (requestId: number) => {
      setIsActing(true);
      try {
        await joinRequestService.deny(requestId);
        await refresh();
        emitStartupJoinRefresh();
      } finally {
        setIsActing(false);
      }
    },
    [refresh],
  );

  const value = useMemo<StartupJoinContextValue>(
    () => ({
      viewState,
      joinRequests,
      adminPendingRequests,
      isLoading,
      error,
      isActing,
      refresh,
      approveRequest,
      denyRequest,
      startupBadge: viewState.badge ?? null,
    }),
    [
      adminPendingRequests,
      approveRequest,
      denyRequest,
      error,
      isActing,
      isLoading,
      joinRequests,
      refresh,
      viewState,
    ],
  );

  return (
    <StartupJoinContext.Provider value={value}>
      {children}
    </StartupJoinContext.Provider>
  );
}

export function useStartupJoin(options?: { enabled?: boolean }) {
  const ctx = useContext(StartupJoinContext);
  if (!ctx) {
    throw new Error("useStartupJoin must be used within StartupJoinProvider");
  }
  if (options?.enabled === false) {
    const emptyState: StartupJoinViewState = { phase: "unlinked" };
    return {
      viewState: emptyState,
      joinRequests: [],
      adminPendingRequests: [],
      isLoading: false,
      error: null,
      isActing: false,
      refresh: async () => {},
      approveRequest: async () => {},
      denyRequest: async () => {},
      startupBadge: null,
    };
  }
  return ctx;
}
