/**
 * Event Service
 *
 * Service layer for event and schedule-related API calls.
 */

import { api, ApiResponse, PaginationMeta } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Event
 * Matches backend schema: Event
 */
export interface Event {
  id: number;
  name: string;
  description?: string;
  date: string; // Format: date (YYYY-MM-DD)
  dates?: string[] | null; // List of event dates for multi-day events
  venue?: string | null;
  time: string; // Format: date-time (ISO 8601)
  metadata?: any;
  success_url?: string | null;
  booth_success_url?: string | null;
  cancel_url?: string | null;
  base_url?: string | null;
  portal_url?: string | null;
  venue_map_url?: string | null;
  calendar_url?: string | null;
}

/**
 * EventSchedule
 * Matches backend schema: EventSchedule
 */
export interface EventSchedule {
  id: number;
  name: string;
  description?: string | null;
  start_time: string; // Format: date-time (ISO 8601)
  end_time: string; // Format: date-time (ISO 8601)
  venue?: string | null;
  event: Event; // Full Event object
}

/**
 * PersonalSchedule
 * Matches backend schema: PersonalScheduleList
 */
export interface PersonalSchedule {
  id: number;
  event_schedule: EventSchedule; // Full EventSchedule object
  created_at: string; // Format: date-time (ISO 8601)
}

/**
 * PersonalScheduleCreateRequest
 * Matches backend schema: PersonalScheduleCreateRequest
 */
export interface PersonalScheduleCreateRequest {
  event_schedule: number; // EventSchedule ID
}

/**
 * PersonalScheduleCreate
 * Matches backend schema: PersonalScheduleCreate
 */
export interface PersonalScheduleCreate {
  id: number;
  event_schedule: number;
  created_at: string; // Format: date-time (ISO 8601)
}

/**
 * Event Filters
 * Optional filters for fetching events/schedules
 */
export interface EventFilters {
  search?: string;
  ordering?: string;
  page?: number;
  page_size?: number;
  // Additional filters can be added here (stage, day, time, etc.)
  // based on backend support
}

/**
 * Event Feedback Request
 * Note: Feedback endpoint not found in API schema - placeholder for future implementation
 */
export interface EventFeedbackRequest {
  feedback: string;
  rating?: number; // Optional rating 1-5
}

// ============================================================================
// SERVICE
// ============================================================================

export const eventService = {
  /**
   * Get event schedules (sessions) for a specific event
   *
   * @param eventId - The ID of the event
   * @param filters - Optional filters (search, ordering, pagination)
   * @returns Promise that resolves with paginated event schedules
   *
   * Backend Endpoint: GET /events/{event_id}/schedules/
   * Returns paginated list of EventSchedule objects
   */
  async getEventSchedules(
    eventId: number,
    filters?: EventFilters
  ): Promise<{ schedules: EventSchedule[]; pagination: PaginationMeta }> {
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
      const url = `/events/${eventId}/schedules/${queryString ? `?${queryString}` : ""}`;
      const response = await api.get<any>(url);

      // Backend returns PaginatedEventScheduleList directly (not wrapped in ApiResponse)
      const data = response as any;

      // Check if response has paginated structure
      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return {
          schedules: data.results as EventSchedule[],
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
            schedules: responseData.results as EventSchedule[],
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
            schedules: responseData as EventSchedule[],
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
          schedules: data as EventSchedule[],
          pagination: {
            count: data.length,
            next: null,
            previous: null,
          },
        };
      }

      // Fallback: return empty array
      return {
        schedules: [],
        pagination: {
          count: 0,
          next: null,
          previous: null,
        },
      };
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch event schedules",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Get details of a specific event
   *
   * @param eventId - The ID of the event
   * @returns Promise that resolves with event details
   *
   * Backend Endpoint: GET /events/{event_id}/
   * Returns Event object
   */
  async getEventDetails(eventId: number): Promise<Event> {
    try {
      const response = await api.get<any>(`/events/${eventId}/`);

      // Backend might return Event directly or wrapped in ApiResponse
      const data = response as any;

      // If wrapped in ApiResponse format
      if (data?.status === "success" && data?.data) {
        return data.data as Event;
      }

      // Check if response IS the Event object directly
      if (data?.id && data?.name) {
        return data as Event;
      }

      // Log error response structure for debugging
      if (__DEV__) {
        console.log("🔍 Event details error response:", {
          response_message: data.message,
          response_code: data.response_code,
          hasData: !!data.data,
        });
      }

      throw new ApiClientError({
        status: "error",
        message: data?.message || "Failed to fetch event details",
        response_code: data?.response_code || 404,
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
        message: error?.message || "Failed to fetch event details",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Get details of a specific event schedule (session)
   *
   * @param eventId - The ID of the event
   * @param scheduleId - The ID of the event schedule
   * @returns Promise that resolves with event schedule details
   *
   * Backend Endpoint: GET /events/{event_id}/schedules/{id}/
   * Returns EventSchedule object
   */
  async getEventScheduleDetails(
    eventId: number,
    scheduleId: number
  ): Promise<EventSchedule> {
    try {
      const response = await api.get<any>(`/events/${eventId}/schedules/${scheduleId}/`);

      // Backend might return EventSchedule directly or wrapped in ApiResponse
      const data = response as any;

      // If wrapped in ApiResponse format
      if (data?.status === "success" && data?.data) {
        return data.data as EventSchedule;
      }

      // Check if response IS the EventSchedule object directly
      if (data?.id && data?.name && data?.event) {
        return data as EventSchedule;
      }

      throw new ApiClientError({
        status: "error",
        message: data?.message || "Failed to fetch event schedule details",
        response_code: data?.response_code || 404,
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
        message: error?.message || "Failed to fetch event schedule details",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Get user's personal schedule (all events they've added)
   *
   * @param eventId - Optional event ID to filter personal schedules for a specific event
   * @param filters - Optional filters (search, ordering, pagination)
   * @returns Promise that resolves with paginated personal schedules
   *
   * Backend Endpoint: GET /events/{event_id}/personal-schedules/ or GET /personal-schedules/
   * Returns paginated list of PersonalSchedule objects
   */
  async getPersonalSchedules(
    eventId?: number,
    filters?: EventFilters
  ): Promise<{ schedules: PersonalSchedule[]; pagination: PaginationMeta }> {
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
      
      // Use event-specific endpoint if eventId provided, otherwise use general endpoint
      // Note: Based on YAML, /events/{event_id}/personal-schedules/ has event_pk parameter which seems redundant
      // Using /personal-schedules/ endpoint with query params if eventId is needed
      const url = eventId 
        ? `/events/${eventId}/personal-schedules/${queryString ? `?${queryString}` : ""}`
        : `/personal-schedules/${queryString ? `?${queryString}` : ""}`;
      
      const response = await api.get<any>(url);

      // Backend returns PaginatedPersonalScheduleListList directly
      const data = response as any;

      // Check if response has paginated structure
      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return {
          schedules: data.results as PersonalSchedule[],
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
            schedules: responseData.results as PersonalSchedule[],
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
            schedules: responseData as PersonalSchedule[],
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
          schedules: data as PersonalSchedule[],
          pagination: {
            count: data.length,
            next: null,
            previous: null,
          },
        };
      }

      // Fallback: return empty array
      return {
        schedules: [],
        pagination: {
          count: 0,
          next: null,
          previous: null,
        },
      };
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch personal schedules",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Add an event schedule to user's personal schedule
   *
   * @param eventScheduleId - The ID of the event schedule to add
   * @returns Promise that resolves with created personal schedule entry
   *
   * Backend Endpoint: POST /personal-schedules/
   * Request Body: { event_schedule: number }
   * Returns 201 Created with PersonalScheduleCreate object
   */
  async addEventToSchedule(eventScheduleId: number): Promise<PersonalScheduleCreate> {
    try {
      const request: PersonalScheduleCreateRequest = {
        event_schedule: eventScheduleId,
      };

      const response = await api.post<any>("/personal-schedules/", request);

      // Handle successful response (201 Created)
      const data = response as any;

      // If wrapped in ApiResponse format
      if (data?.status === "success" && data?.data) {
        return data.data as PersonalScheduleCreate;
      }

      // Check if response_code is 201, treat as success even if status is different
      if (data?.response_code === 201 && data?.data) {
        return data.data as PersonalScheduleCreate;
      }

      // Check if response IS the PersonalScheduleCreate object directly
      if (data?.id && data?.event_schedule) {
        return data as PersonalScheduleCreate;
      }

      // Log error response structure for debugging
      if (__DEV__) {
        console.log("🔍 Add to schedule error response:", {
          response_message: data.message,
          response_code: data.response_code,
          hasData: !!data.data,
          nonFieldErrors: data.data?.non_field_errors || data.data?.data?.non_field_errors,
        });
      }

      // Parse validation errors from response
      let errorMessage = data?.message || "Failed to add event to schedule";
      
      // Check for non_field_errors at different nesting levels FIRST
      const nonFieldErrors = 
        data?.data?.non_field_errors || 
        data?.data?.data?.non_field_errors;
      
      if (nonFieldErrors) {
        if (Array.isArray(nonFieldErrors)) {
          errorMessage = nonFieldErrors[0];
        } else if (typeof nonFieldErrors === "string") {
          errorMessage = nonFieldErrors;
        }
      }

      throw new ApiClientError({
        status: "error",
        message: errorMessage,
        response_code: data?.response_code || 400,
        data: data?.data || {},
      });
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to add event to schedule",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Remove an event schedule from user's personal schedule
   *
   * @param personalScheduleId - The ID of the personal schedule entry to remove
   * @returns Promise that resolves when removal is successful
   *
   * Backend Endpoint: DELETE /personal-schedules/{id}/
   * Returns 204 No Content on success
   */
  async removeEventFromSchedule(personalScheduleId: number): Promise<void> {
    try {
      await api.delete(`/personal-schedules/${personalScheduleId}/`);

      // DELETE returns 204 No Content, so no response body to parse
      // If we get here without error, the deletion was successful
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to remove event from schedule",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Leave feedback on an event schedule
   *
   * @param eventScheduleId - The ID of the event schedule
   * @param feedback - The feedback text
   * @returns Promise that resolves when feedback is submitted
   *
   * Backend Endpoint: NOT FOUND IN API SCHEMA
   * Note: This endpoint is not yet defined in the API schema.
   * Placeholder implementation for future backend integration.
   * Expected: POST /events/{event_id}/schedules/{id}/feedback/ or similar
   */
  async leaveEventFeedback(
    eventScheduleId: number,
    feedback: string,
    rating?: number
  ): Promise<void> {
    // TODO: Implement when backend endpoint is available
    // Expected endpoint: POST /events/{event_id}/schedules/{id}/feedback/
    // Request body: { feedback: string, rating?: number }
    
    throw new ApiClientError({
      status: "error",
      message: "Feedback endpoint not yet available in backend API",
      response_code: 501, // Not Implemented
      data: {},
    });
    
    /* 
    // Uncomment when backend endpoint is ready:
    try {
      const request: EventFeedbackRequest = {
        feedback,
        rating,
      };

      // Note: We need event_id to construct the URL, but only have schedule_id
      // May need to adjust this when endpoint is available
      // Possible endpoints:
      // - POST /events/{event_id}/schedules/{id}/feedback/
      // - POST /event-schedules/{id}/feedback/
      // - POST /feedback/ with event_schedule in body
      
      await api.post(`/event-schedules/${eventScheduleId}/feedback/`, request);
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to submit feedback",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
    */
  },
};
