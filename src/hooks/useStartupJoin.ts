import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
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

export function useStartupJoin(options?: { enabled?: boolean }) {
  const enabled = options?.enabled !== false;
  const { user } = useAuth();
  const [ticketType, setTicketType] = useState("");
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [adminPendingRequests, setAdminPendingRequests] = useState<JoinRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActing, setIsActing] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled || !user?.user_id) {
      setJoinRequests([]);
      setAdminPendingRequests([]);
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
  }, [enabled, ticketType, user?.user_id]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const viewState: StartupJoinViewState = useMemo(
    () =>
      resolveStartupJoinViewState({
        profile: user,
        ticketType,
        userId: user?.user_id,
        joinRequests,
        adminPendingRequests,
      }),
    [adminPendingRequests, joinRequests, ticketType, user],
  );

  const approveRequest = useCallback(
    async (requestId: number) => {
      setIsActing(true);
      try {
        await joinRequestService.approve(requestId);
        await refresh();
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
      } finally {
        setIsActing(false);
      }
    },
    [refresh],
  );

  return {
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
  };
}
