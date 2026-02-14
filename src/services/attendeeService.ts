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
 * Match info from backend (may be JSON string or object)
 * e.g. { "match_score": 5.0, "reason": "nice dynamics" }
 * Attendees with match_score >= 5 are shown in the Recommended tab.
 */
export interface MatchInfo {
  match_score?: number;
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
  /** JSON string or object: { match_score, reason }. Score >= 5 → Recommended tab. */
  match_info: string | MatchInfo | null;
}

/**
 * Attendee Type
 * Types supported by the API endpoint
 */
export type AttendeeType = "general" | "developer" | "standard" | "delegate" | "exhibitor" | "all";

/**
 * Attendee Filters
 * Optional filters for fetching attendees
 */
export interface AttendeeFilters {
  search?: string;
  ordering?: string;
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
   * @param filters - Optional filters (search, ordering, pagination)
   * @returns Promise that resolves with paginated attendees
   *
   * Backend Endpoint: GET /attendees/{event_id}/{attendee_type}/
   * Returns paginated list of Attendee objects
   */
  async getEventAttendees(
    eventId: number,
    attendeeType: AttendeeType = "all",
    filters?: AttendeeFilters
  ): Promise<{ attendees: Attendee[]; pagination: PaginationMeta }> {
    try {
      const params: Record<string, string> = {};

      if (filters) {
        if (filters.search) {
          params.search = filters.search;
        }
        if (filters.ordering) {
          params.ordering = filters.ordering;
        }
        if (filters.page) {
          params.page = filters.page.toString();
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

      // Verbose log: response shape and attendee properties (for debugging match_info etc.)
      const list = data?.results ?? data?.data?.results ?? (Array.isArray(data?.data) ? data.data : null) ?? (Array.isArray(data) ? data : null);
      const paginationInfo = { count: data?.count ?? data?.data?.count, next: data?.next ?? data?.data?.next, previous: data?.previous ?? data?.data?.previous };
      console.log("[Attendees API] response top-level keys:", Object.keys(data || {}));
      console.log("[Attendees API] pagination:", paginationInfo, "list length:", Array.isArray(list) ? list.length : 0);
      if (Array.isArray(list) && list.length > 0) {
        const first = list[0] as any;
        console.log("[Attendees API] first attendee keys:", Object.keys(first));
        console.log("[Attendees API] first attendee match_info:", first?.match_info);
        list.slice(0, 5).forEach((a: any, i: number) => {
          console.log(`[Attendees API] attendee[${i}] match_info:`, a?.match_info, "| user_id:", a?.user?.id ?? a?.user_id);
        });
      }

      // Check if response has paginated structure (most common)
      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
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
        // If data is array directly
        if (Array.isArray(responseData)) {
          return {
            attendees: responseData as Attendee[],
            pagination: {
              count: responseData.length,
              next: null,
              previous: null,
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
  async getAttendeeDetails(
    eventId: number,
    attendeeType: AttendeeType,
    ticketPk: string
  ): Promise<Attendee> {
    try {
      const response = await api.get<any>(
        `/attendees/${eventId}/${attendeeType}/${ticketPk}/`
      );

      const res = response as any;

      // Handle ApiResponse format (data wrapped)
      if (res.status === "success" && res.data && typeof res.data === "object") {
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