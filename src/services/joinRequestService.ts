/**
 * Startup company join-request API.
 * Backend: /join-requests/, /companies/pending-join-requests/
 */

import { api, ApiClientError, type PaginationMeta } from "./api";
import { authService } from "./authService";

export type JoinRequestStatus = "pending" | "accepted" | "denied";

export interface JoinRequestUser {
  id: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string | null;
  job_title?: string;
}

export interface JoinRequest {
  id: number;
  user: JoinRequestUser;
  company: string;
  status: JoinRequestStatus;
  created_at: string;
  updated_at: string;
}

function parsePaginatedJoinRequests(data: unknown): {
  requests: JoinRequest[];
  pagination: PaginationMeta;
} {
  const empty = {
    requests: [] as JoinRequest[],
    pagination: { count: 0, next: null, previous: null },
  };

  if (!data || typeof data !== "object") return empty;

  const obj = data as Record<string, unknown>;

  if ("results" in obj && Array.isArray(obj.results)) {
    return {
      requests: obj.results as JoinRequest[],
      pagination: {
        count: (obj.count as number) || obj.results.length,
        next: (obj.next as string | null) ?? null,
        previous: (obj.previous as string | null) ?? null,
      },
    };
  }

  if (obj.status === "success" && obj.data) {
    return parsePaginatedJoinRequests(obj.data);
  }

  if (Array.isArray(data)) {
    return {
      requests: data as JoinRequest[],
      pagination: { count: data.length, next: null, previous: null },
    };
  }

  return empty;
}

export const joinRequestService = {
  /** All join requests visible to the current user (own outbound and/or company inbound). */
  /** Submit a join request for an existing startup (pending until admin approves). */
  async createJoinRequest(companyId: number): Promise<void> {
    try {
      const response = await api.post<{ company_id: number }>("/join-requests/", {
        company_id: companyId,
      });
      if (
        response &&
        typeof response === "object" &&
        "status" in response &&
        (response as { status?: string }).status === "error"
      ) {
        throw new ApiClientError({
          status: "error",
          message:
            (response as { message?: string }).message ||
            "Failed to send join request",
          response_code: (response as { response_code?: number }).response_code || 400,
          data: {},
        });
      }
    } catch (e) {
      if (
        e instanceof ApiClientError &&
        e.responseCode !== 404 &&
        e.responseCode !== 405
      ) {
        throw e;
      }
      // Fallback when POST /join-requests/ is not exposed — associates company_id on user.
      await authService.updateProfile({ company_id: companyId } as any);
    }
  },

  async listJoinRequests(filters?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<{ requests: JoinRequest[]; pagination: PaginationMeta }> {
    const params: Record<string, string> = {};
    if (filters?.page) params.page = String(filters.page);
    if (filters?.page_size) params.page_size = String(filters.page_size);
    if (filters?.search) params.search = filters.search;

    const qs = new URLSearchParams(params).toString();
    const response = await api.get<unknown>(
      `/join-requests/${qs ? `?${qs}` : ""}`,
    );
    return parsePaginatedJoinRequests(response);
  },

  /** Pending requests for startups the current user administers. */
  async listPendingForAdmin(filters?: {
    page?: number;
    page_size?: number;
  }): Promise<{ requests: JoinRequest[]; pagination: PaginationMeta }> {
    const params: Record<string, string> = {};
    if (filters?.page) params.page = String(filters.page);
    if (filters?.page_size) params.page_size = String(filters.page_size);

    const qs = new URLSearchParams(params).toString();
    const response = await api.get<unknown>(
      `/companies/pending-join-requests/${qs ? `?${qs}` : ""}`,
    );
    return parsePaginatedJoinRequests(response);
  },

  async approve(requestId: number): Promise<void> {
    const response = await api.post<unknown>(
      `/join-requests/${requestId}/approve/`,
      {},
    );
    if (
      response &&
      typeof response === "object" &&
      "status" in response &&
      (response as { status?: string }).status === "error"
    ) {
      throw new ApiClientError({
        status: "error",
        message:
          (response as { message?: string }).message ||
          "Failed to approve join request",
        response_code: (response as { response_code?: number }).response_code || 400,
        data: {},
      });
    }
  },

  async deny(requestId: number): Promise<void> {
    const response = await api.post<unknown>(
      `/join-requests/${requestId}/deny/`,
      {},
    );
    if (
      response &&
      typeof response === "object" &&
      "status" in response &&
      (response as { status?: string }).status === "error"
    ) {
      throw new ApiClientError({
        status: "error",
        message:
          (response as { message?: string }).message ||
          "Failed to decline join request",
        response_code: (response as { response_code?: number }).response_code || 400,
        data: {},
      });
    }
  },
};
