import type { UserProfile } from "../services/authService";
import type { JoinRequest } from "../services/joinRequestService";
import {
  isStartupCompanyType,
  resolveCompanyType,
} from "./companyProfileFields";

export type StartupLinkBadge = {
  companyName: string;
  companyId?: number;
};

export type StartupJoinPhase =
  | "unlinked"
  | "pending"
  | "denied"
  | "linked"
  | "admin_review";

export type StartupJoinViewState = {
  phase: StartupJoinPhase;
  /** Outbound request from the current user (pending or denied). */
  myRequest?: JoinRequest;
  /** Startup name shown in status UI. */
  companyName?: string;
  /** Verified startup link badge after approval or for startup admins. */
  badge?: StartupLinkBadge;
  isStartupAdmin?: boolean;
  /** Inbound requests awaiting admin action. */
  adminPendingRequests?: JoinRequest[];
};

function joinRequestUserId(request: JoinRequest): string {
  return String(request.user?.id ?? "");
}

export function findLatestJoinRequestForUser(
  requests: JoinRequest[],
  userId: string,
): JoinRequest | undefined {
  const mine = requests.filter((r) => joinRequestUserId(r) === String(userId));
  if (mine.length === 0) return undefined;
  return [...mine].sort(
    (a, b) =>
      new Date(b.updated_at || b.created_at).getTime() -
      new Date(a.updated_at || a.created_at).getTime(),
  )[0];
}

export function resolveStartupLinkBadge(
  profile?: UserProfile | null,
  ticketType?: string,
  userId?: string,
  joinRequests?: JoinRequest[],
): StartupLinkBadge | null {
  const company = profile?.company;
  if (!company?.name) return null;

  const companyType = resolveCompanyType(company, ticketType);
  if (!isStartupCompanyType(companyType)) return null;

  const isAdmin =
    !!userId &&
    !!company.admin_user &&
    String(company.admin_user) === String(userId);
  if (isAdmin) {
    return {
      companyName: company.name,
      companyId: company.id ? Number(company.id) : undefined,
    };
  }

  if (userId && joinRequests?.length) {
    const mine = findLatestJoinRequestForUser(joinRequests, userId);
    if (mine?.status === "accepted") {
      return {
        companyName: company.name,
        companyId: company.id ? Number(company.id) : undefined,
      };
    }
    // Pending or denied — not verified yet; no public badge.
    return null;
  }

  return null;
}

export function resolveStartupJoinViewState(input: {
  profile?: UserProfile | null;
  ticketType?: string;
  userId?: string;
  joinRequests?: JoinRequest[];
  adminPendingRequests?: JoinRequest[];
}): StartupJoinViewState {
  const { profile, ticketType, userId, joinRequests = [], adminPendingRequests = [] } =
    input;

  const isStartupAdmin =
    !!profile?.company?.admin_user &&
    !!userId &&
    String(profile.company.admin_user) === String(userId);

  const badge = resolveStartupLinkBadge(
    profile,
    ticketType,
    userId,
    joinRequests,
  );
  const myRequest = userId
    ? findLatestJoinRequestForUser(joinRequests, userId)
    : undefined;

  if (myRequest?.status === "pending") {
    return {
      phase: "pending",
      myRequest,
      companyName: myRequest.company || badge?.companyName,
    };
  }

  if (myRequest?.status === "denied") {
    return {
      phase: "denied",
      myRequest,
      companyName: myRequest.company,
      adminPendingRequests:
        isStartupAdmin && adminPendingRequests.length > 0
          ? adminPendingRequests
          : undefined,
    };
  }

  if (badge) {
    return {
      phase: "linked",
      badge,
      companyName: badge.companyName,
      isStartupAdmin,
      adminPendingRequests:
        isStartupAdmin && adminPendingRequests.length > 0
          ? adminPendingRequests
          : undefined,
    };
  }

  if (isStartupAdmin && adminPendingRequests.length > 0) {
    return {
      phase: "admin_review",
      isStartupAdmin: true,
      adminPendingRequests,
      companyName: profile?.company?.name,
    };
  }

  if (myRequest?.status === "accepted") {
    return {
      phase: "linked",
      badge: {
        companyName: myRequest.company,
      },
      companyName: myRequest.company,
      isStartupAdmin,
    };
  }

  return { phase: "unlinked" };
}

export function shouldShowStartupJoinForm(state: StartupJoinViewState): boolean {
  return state.phase === "unlinked" || state.phase === "denied";
}

export type AttendeeStartupBadge =
  | { kind: "linked"; companyName: string }
  | { kind: "pending" };

/** Badge on attendee cards / profile sheets from directory user payload. */
export function resolveAttendeeStartupBadge(user: {
  company?: { name?: string; company_type?: string } | null;
  metadata?: unknown;
}): AttendeeStartupBadge | null {
  let metadata = user.metadata;
  if (typeof metadata === "string") {
    try {
      metadata = JSON.parse(metadata);
    } catch {
      metadata = {};
    }
  }
  const meta = (metadata ?? {}) as Record<string, unknown>;
  const joinStatus = String(
    meta.startup_join_status ?? meta.join_request_status ?? "",
  ).toLowerCase();
  if (joinStatus === "pending") {
    return { kind: "pending" };
  }

  const company = user.company;
  if (company?.name && isStartupCompanyType(company.company_type)) {
    return { kind: "linked", companyName: company.name };
  }

  const linkedName = meta.linked_startup_name ?? meta.startup_name;
  if (typeof linkedName === "string" && linkedName.trim()) {
    return { kind: "linked", companyName: linkedName.trim() };
  }

  return null;
}
