/**
 * Attendee Service
 *
 * Service layer for attendee-related API calls.
 */

import { api, PaginationMeta } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Ticket object (from backend Ticket schema)
 * Matches backend schema: Ticket
 */
export interface AttendeeTicket {
  id: number;
  ticket_code: string;
  ticket_type?: string;
  // Add other ticket fields as needed
}

/**
 * User object (from backend User schema)
 * Matches backend schema: User
 */
export interface AttendeeUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string | null;
  phone_number?: string;
  address?: string;
  country?: string;
  job_title?: string;
  organisation?: string | null;
  organisation_website?: string | null;
  organisation_role?: string | null;
  metadata?: any; // User metadata (interests, bio, linkedIn, industry, etc.)
}

/**
 * Match info from backend (may be JSON string or object).
 * Backend AI match returns score 1–10 and optional reason.
 * e.g. { "match_score": 8, "reason": "Strong overlap in Fintech and SaaS" }
 * App shows attendees with match_score >= 8 in the Recommended tab.
 */
export interface MatchInfo {
  match_score?: number; // 1–10 from backend
  reason?: string;
}

/**
 * Attendee Response
 * Response from GET /attendees/{event_id}/{attendee_type}/
 * Matches backend schema: Attendee
 */
export interface Attendee {
  ticket: AttendeeTicket;
  user: AttendeeUser;
  /** JSON string or object: { match_score (1–10), reason }. Score >= 8 → Recommended tab. */
  match_info: string | MatchInfo | null;
}

/**
 * Attendee Type
 * Types supported by the API endpoint
 */
export type AttendeeType =
  | "general"
  | "developer"
  | "standard"
  | "delegate"
  | "exhibitor"
  | "all";

/**
 * Attendee Filters
 * Optional filters for fetching attendees
 */
export interface AttendeeFilters {
  /** Backend query param `name` — filter attendees by name on the server. */
  name?: string;
  /**
   * Legacy alias: if `name` is unset, this value is sent as `?name=` (API does not use `search`).
   */
  search?: string;
  ordering?: string;
  /** Page number, or `-1` when the API returns the full list in one response. */
  page?: number;
  page_size?: number;
  // Note: Additional filters (industry, interests, job_title) can be added
  // when backend supports filtering by metadata fields
}

// ============================================================================
// SERVICE
// ============================================================================

export const attendeeService = {
  /**
   * Get all attendees for an event by type
   *
   * @param eventId - The ID of the event
   * @param attendeeType - Type of attendees (general, developer, standard, delegate, exhibitor, all)
   * @param filters - Optional filters (`name`, ordering, pagination; legacy `search` maps to `name`)
   * @returns Promise that resolves with paginated attendees
   *
   * Backend Endpoint: GET /attendees/{event_id}/{attendee_type}/
   * Returns paginated list of Attendee objects
   */
  async getEventAttendees(
    eventId: number,
    attendeeType: AttendeeType = "all",
    filters?: AttendeeFilters,
  ): Promise<{ attendees: Attendee[]; pagination: PaginationMeta }> {
    try {
      const params: Record<string, string> = {};

      if (filters) {
        const nameFilter = (filters.name ?? filters.search)?.trim();
        if (nameFilter) {
          params.name = nameFilter;
        }
        if (filters.ordering) {
          params.ordering = filters.ordering;
        }
        if (filters.page != null) {
          params.page = String(filters.page);
        }
        if (filters.page_size) {
          params.page_size = filters.page_size.toString();
        }
      }

      const queryString = new URLSearchParams(params).toString();
      const url = `/attendees/${eventId}/${attendeeType}/${queryString ? `?${queryString}` : ""}`;
      const response = await api.get<any>(url);

      // Backend returns PaginatedAttendeeList directly
      const data = response as any;

      // Check if response has paginated structure (most common)
      if (
        data &&
        typeof data === "object" &&
        "results" in data &&
        Array.isArray(data.results)
      ) {
        return {
          attendees: data.results as Attendee[],
          pagination: {
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
          },
        };
      }

      // If wrapped in ApiResponse format
      if (data?.status === "success" && data?.data) {
        const responseData = data.data as any;
        if (responseData.results && Array.isArray(responseData.results)) {
          return {
            attendees: responseData.results as Attendee[],
            pagination: {
              count: responseData.count || 0,
              next: responseData.next || null,
              previous: responseData.previous || null,
            },
          };
        }
        // If data is array directly — total/next may live on sibling `pagination`, not on the array
        // (prod: { data: Attendee[], pagination: { count, next, previous } })
        if (Array.isArray(responseData)) {
          const meta = data.pagination as
            | { count?: number; next?: string | null; previous?: string | null }
            | undefined;
          return {
            attendees: responseData as Attendee[],
            pagination: {
              count: meta?.count ?? responseData.length,
              next: meta?.next ?? null,
              previous: meta?.previous ?? null,
            },
          };
        }
      }

      // If response IS an array directly
      if (Array.isArray(data)) {
        return {
          attendees: data as Attendee[],
          pagination: {
            count: data.length,
            next: null,
            previous: null,
          },
        };
      }

      throw new ApiClientError({
        status: "error",
        message: "Invalid response format from attendees endpoint",
        response_code: 500,
        data: {},
      });
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch attendees",
        response_code: error?.response_code || 500,
        data: {},
      });
    }
  },

  /**
   * Get attendee details by ticket code
   *
   * @param eventId - The ID of the event
   * @param attendeeType - Type of attendee
   * @param ticketPk - The ticket code of the attendee
   * @returns Promise that resolves with attendee details
   *
   * Backend Endpoint: GET /attendees/{event_id}/{attendee_type}/{ticket_pk}/
   */
  /**
   * Resolve an attendee by Spark user id (deeplinks, push).
   * Tries dedicated lookup endpoints, then scans paginated directory list.
   */
  async getAttendeeByUserId(
    eventId: number,
    userId: string,
  ): Promise<Attendee | null> {
    const normalizedUserId = userId.trim();
    if (!normalizedUserId) return null;

    const parseAttendeePayload = (res: unknown): Attendee | null => {
      const root = res as Record<string, unknown>;
      const data =
        root?.status === "success" && root.data && typeof root.data === "object"
          ? (root.data as Record<string, unknown>)
          : root;
      if (data?.ticket && data?.user) {
        return data as unknown as Attendee;
      }
      if (root?.ticket && root?.user) {
        return root as unknown as Attendee;
      }
      return null;
    };

    const primaryPath = `/events/${eventId}/attendees/user/${encodeURIComponent(normalizedUserId)}/`;

    try {
      const response = await api.get<unknown>(primaryPath);
      const attendee = parseAttendeePayload(response);
      if (attendee) return attendee;
    } catch {
      // try fallbacks / list scan
    }

    const fallbackPaths = [
      `/attendees/${eventId}/user/${encodeURIComponent(normalizedUserId)}/`,
      `/events/${eventId}/users/${encodeURIComponent(normalizedUserId)}/attendee/`,
    ];

    for (const path of fallbackPaths) {
      try {
        const response = await api.get<unknown>(path);
        const attendee = parseAttendeePayload(response);
        if (attendee) return attendee;
      } catch (error: unknown) {
        const err = error as { responseCode?: number; response_code?: number };
        if (err?.responseCode === 404 || err?.response_code === 404) {
          continue;
        }
      }
    }

    let page = 1;
    const pageSize = 100;
    for (let i = 0; i < 20; i++) {
      const { attendees, pagination } = await this.getEventAttendees(
        eventId,
        "all",
        { page, page_size: pageSize, ordering: "id" },
      );
      const match = attendees.find(
        (row) => String(row.user.id) === String(normalizedUserId),
      );
      if (match) return match;
      if (!pagination.next) break;
      page += 1;
    }

    return null;
  },

  async getAttendeeDetails(
    eventId: number,
    attendeeType: AttendeeType,
    ticketPk: string,
  ): Promise<Attendee> {
    try {
      const response = await api.get<any>(
        `/attendees/${eventId}/${attendeeType}/${ticketPk}/`,
      );

      const res = response as any;

      // Handle ApiResponse format (data wrapped)
      if (
        res.status === "success" &&
        res.data &&
        typeof res.data === "object"
      ) {
        const data = res.data;
        if (data.ticket && data.user) {
          return data as Attendee;
        }
      }

      // If response IS the Attendee object directly (unwrapped)
      if (res.ticket && res.user) {
        return res as unknown as Attendee;
      }

      throw new ApiClientError({
        status: "error",
        message: res.message || "Failed to fetch attendee details",
        response_code: res.response_code || 500,
        data: {},
      });
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch attendee details",
        response_code: error?.response_code || 500,
        data: {},
      });
    }
  },
};
