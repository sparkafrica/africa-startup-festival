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
  event: Event | number; // Full Event object or just ID
  metadata?: any; // Metadata may contain speakers, sponsoredBy, etc.
  speakers?: number[] | any[]; // Speaker IDs array or full speaker objects
}

/**
 * Speaker
 * Matches backend schema: Speaker
 */
export interface Speaker {
  id: number;
  full_name: string;
  profile_pic?: string | null;
  description?: string | null;
  company?: string | null;
  role?: string | null;
  website_url?: string | null;
  linkedin_url?: string | null;
  twitter_handle?: string | null;
  events?: number[];
  created_at?: string;
  updated_at?: string;
}

/**
 * Exhibitor
 * Matches backend schema: Exhibitor
 */
export interface Exhibitor {
  id: number;
  event: number;
  email: string;
  phone?: string | null;
  organisation?: string | null;
  country?: string | null;
  description?: string | null;
  sector?: string | null;
  website?: string | null;
  job_title?: string | null;
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  know_about_event?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Partner
 * Matches backend schema: Partner
 */
export interface Partner {
  id: number;
  event: number;
  email: string;
  phone?: string | null;
  organisation?: string | null;
  country?: string | null;
  linkedIn?: string | null;
  description?: string | null;
  sector?: string | null;
  goals?: string | null;
  requests?: string | null;
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  custom_budget?: string | null;
  budget?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Company Member (from directory)
 * Matches backend schema: Member
 */
export interface CompanyMember {
  id: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string | null;
}

/**
 * Company (from directory retrieve)
 * Matches backend schema: Company
 * GET /directory/{event_id}/{company_type}/{company_pk}/
 */
export interface Company {
  id: number;
  name: string;
  contact_person?: string | null;
  country?: string | null;
  email?: string | null;
  phone?: string | null;
  company_sector?: string | null;
  company_description?: string | null;
  logo?: string | null;
  group_photo?: string | null;
  metadata?: Record<string, any> | null;
  company_type?: string | null;
  founders?: any[];
  admin_user?: string | null;
  event_id?: number;
  members?: CompanyMember[];
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
   * Get all events
   *
   * @param filters - Optional filters (search, ordering, pagination)
   * @returns Promise that resolves with paginated events
   *
   * Backend Endpoint: GET /events/
   * Returns paginated list of Event objects
   */
  async getEvents(
    filters?: EventFilters
  ): Promise<{ events: Event[]; pagination: PaginationMeta }> {
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
      const url = `/events/${queryString ? `?${queryString}` : ""}`;
      const response = await api.get<any>(url);

      // Backend returns PaginatedEventList directly
      const data = response as any;

      // Check if response has paginated structure
      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return {
          events: data.results as Event[],
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
            events: responseData.results as Event[],
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
            events: responseData as Event[],
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
          events: data as Event[],
          pagination: {
            count: data.length,
            next: null,
            previous: null,
          },
        };
      }

      // Fallback: return empty array
      return {
        events: [],
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
        message: error?.message || "Failed to fetch events",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

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

  /**
   * Get all speakers for an event
   *
   * @param eventId - The ID of the event
   * @param filters - Optional filters (full_name, search, ordering, pagination)
   * @returns Promise that resolves with paginated speakers
   *
   * Backend Endpoint: GET /events/{event_id}/speakers/
   * Returns paginated list of Speaker objects
   */
  async getEventSpeakers(
    eventId: number,
    filters?: { full_name?: string; search?: string; ordering?: string; page?: number; page_size?: number }
  ): Promise<{ speakers: Speaker[]; pagination: PaginationMeta }> {
    try {
      const params: Record<string, string> = {};

      if (filters) {
        if (filters.full_name) {
          params.full_name = filters.full_name;
        }
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
      const url = `/events/${eventId}/speakers/${queryString ? `?${queryString}` : ""}`;
      const response = await api.get<any>(url);

      // Backend returns PaginatedSpeakerList directly
      const data = response as any;


      // Check if response has paginated structure (most common)
      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return {
          speakers: data.results as Speaker[],
          pagination: {
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
          },
        };
      }

      // If response is directly an array
      if (Array.isArray(data)) {
        return {
          speakers: data as Speaker[],
          pagination: {
            count: data.length,
            next: null,
            previous: null,
          },
        };
      }

      // Check if response is wrapped in ApiResponse format (most common)
      if (data?.status === "success" && data?.data !== undefined) {
        const speakersData = data.data;
        
        // Check if data.data is directly an array (our case)
        if (Array.isArray(speakersData)) {
          return {
            speakers: speakersData as Speaker[],
            pagination: {
              count: speakersData.length,
              next: null,
              previous: null,
            },
          };
        }
        
        // Check if data has paginated structure (nested in data.data)
        if (speakersData && typeof speakersData === "object" && "results" in speakersData && Array.isArray(speakersData.results)) {
          return {
            speakers: speakersData.results as Speaker[],
            pagination: {
              count: speakersData.count || 0,
              next: speakersData.next || null,
              previous: speakersData.previous || null,
            },
          };
        }
      }

      throw new ApiClientError({
        status: "error",
        message: "Invalid response format from speakers endpoint",
        response_code: 500,
        data: { actualResponse: data },
      });
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch event speakers",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Get details of a specific speaker
   *
   * @param eventId - The ID of the event
   * @param speakerId - The ID of the speaker
   * @returns Promise that resolves with speaker details
   *
   * Backend Endpoint: GET /events/{event_id}/speakers/{id}/
   * Returns Speaker object
   */
  async getSpeakerDetails(
    eventId: number,
    speakerId: number
  ): Promise<Speaker> {
    try {
      const response = await api.get<any>(`/events/${eventId}/speakers/${speakerId}/`);

      // Backend might return Speaker directly or wrapped in ApiResponse
      const data = response as any;

      // If wrapped in ApiResponse format
      if (data?.status === "success" && data?.data) {
        return data.data as Speaker;
      }

      // Check if response IS the Speaker object directly
      if (data?.id && data?.full_name) {
        return data as Speaker;
      }

      throw new ApiClientError({
        status: "error",
        message: data?.message || "Failed to fetch speaker details",
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
        message: error?.message || "Failed to fetch speaker details",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Get all exhibitors for an event
   *
   * @param eventId - The ID of the event
   * @param filters - Optional filters (search, ordering, pagination)
   * @returns Promise that resolves with paginated exhibitors
   *
   * Backend Endpoint: GET /events/{event_id}/exhibitors/
   * Returns paginated list of Exhibitor objects
   */
  async getEventExhibitors(
    eventId: number,
    filters?: { search?: string; ordering?: string; page?: number; page_size?: number }
  ): Promise<{ exhibitors: Exhibitor[]; pagination: PaginationMeta }> {
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
      const url = `/events/${eventId}/exhibitors/${queryString ? `?${queryString}` : ""}`;
      const response = await api.get<any>(url);

      const data = response as any;

      // Check if response has paginated structure
      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return {
          exhibitors: data.results as Exhibitor[],
          pagination: {
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
          },
        };
      }

      // If response is directly an array
      if (Array.isArray(data)) {
        return {
          exhibitors: data as Exhibitor[],
          pagination: {
            count: data.length,
            next: null,
            previous: null,
          },
        };
      }

      // Check if response is wrapped in ApiResponse format
      if (data?.status === "success" && data?.data !== undefined) {
        const exhibitorsData = data.data;
        
        if (Array.isArray(exhibitorsData)) {
          return {
            exhibitors: exhibitorsData as Exhibitor[],
            pagination: {
              count: exhibitorsData.length,
              next: null,
              previous: null,
            },
          };
        }
        
        if (exhibitorsData && typeof exhibitorsData === "object" && "results" in exhibitorsData && Array.isArray(exhibitorsData.results)) {
          return {
            exhibitors: exhibitorsData.results as Exhibitor[],
            pagination: {
              count: exhibitorsData.count || 0,
              next: exhibitorsData.next || null,
              previous: exhibitorsData.previous || null,
            },
          };
        }
      }

      throw new ApiClientError({
        status: "error",
        message: "Invalid response format from exhibitors endpoint",
        response_code: 500,
        data: { actualResponse: data },
      });
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch event exhibitors",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Get all partners for an event
   *
   * @param eventId - The ID of the event
   * @param filters - Optional filters (search, ordering, pagination)
   * @returns Promise that resolves with paginated partners
   *
   * Backend Endpoint: GET /events/{event_id}/partners/
   * Returns paginated list of Partner objects
   */
  async getEventPartners(
    eventId: number,
    filters?: { search?: string; ordering?: string; page?: number; page_size?: number }
  ): Promise<{ partners: Partner[]; pagination: PaginationMeta }> {
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
      const url = `/events/${eventId}/partners/${queryString ? `?${queryString}` : ""}`;
      const response = await api.get<any>(url);

      const data = response as any;

      // Check if response has paginated structure
      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return {
          partners: data.results as Partner[],
          pagination: {
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
          },
        };
      }

      // If response is directly an array
      if (Array.isArray(data)) {
        return {
          partners: data as Partner[],
          pagination: {
            count: data.length,
            next: null,
            previous: null,
          },
        };
      }

      // Check if response is wrapped in ApiResponse format
      if (data?.status === "success" && data?.data !== undefined) {
        const partnersData = data.data;
        
        if (Array.isArray(partnersData)) {
          return {
            partners: partnersData as Partner[],
            pagination: {
              count: partnersData.length,
              next: null,
              previous: null,
            },
          };
        }
        
        if (partnersData && typeof partnersData === "object" && "results" in partnersData && Array.isArray(partnersData.results)) {
          return {
            partners: partnersData.results as Partner[],
            pagination: {
              count: partnersData.count || 0,
              next: partnersData.next || null,
              previous: partnersData.previous || null,
            },
          };
        }
      }

      throw new ApiClientError({
        status: "error",
        message: "Invalid response format from partners endpoint",
        response_code: 500,
        data: { actualResponse: data },
      });
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch event partners",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * List companies by type (exhibitor or partner) from directory
   *
   * @param eventId - The ID of the event
   * @param companyType - "exhibitor" or "partner"
   * @param filters - Optional filters (search, ordering, pagination)
   * @returns Promise that resolves with paginated companies
   *
   * Backend Endpoint: GET /directory/{event_id}/{company_type}/
   * Schema: PaginatedCompanyList (Company[])
   */
  async getDirectoryCompanies(
    eventId: number,
    companyType: "exhibitor" | "partner",
    filters?: { search?: string; ordering?: string; page?: number; page_size?: number }
  ): Promise<{ companies: Company[]; pagination: PaginationMeta }> {
    try {
      const params: Record<string, string> = {};
      if (filters) {
        if (filters.search) params.search = filters.search;
        if (filters.ordering) params.ordering = filters.ordering;
        if (filters.page) params.page = filters.page.toString();
        if (filters.page_size) params.page_size = filters.page_size.toString();
      }
      const queryString = new URLSearchParams(params).toString();
      const url = `/directory/${eventId}/${companyType}/${queryString ? `?${queryString}` : ""}`;
      const response = await api.get<any>(url);
      const data = response as any;

      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return {
          companies: data.results as Company[],
          pagination: { count: data.count || 0, next: data.next || null, previous: data.previous || null },
        };
      }
      if (Array.isArray(data)) {
        return { companies: data as Company[], pagination: { count: data.length, next: null, previous: null } };
      }
      if (data?.status === "success" && data?.data) {
        const list = Array.isArray(data.data) ? data.data : data.data?.results;
        if (Array.isArray(list)) {
          return {
            companies: list as Company[],
            pagination: { count: list.length, next: null, previous: null },
          };
        }
      }
      throw new ApiClientError({
        status: "error",
        message: "Invalid response format from directory",
        response_code: 500,
        data: { actualResponse: data },
      });
    } catch (error: any) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch companies",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Get company details by type (exhibitor or partner) from directory
   *
   * @param eventId - The ID of the event
   * @param companyType - "exhibitor" or "partner"
   * @param companyPk - The company ID (from list)
   * @returns Promise that resolves with Company object
   *
   * Backend Endpoint: GET /directory/{event_id}/{company_type}/{company_pk}/
   * Schema: Company
   */
  async getCompanyDetail(
    eventId: number,
    companyType: "exhibitor" | "partner",
    companyPk: number
  ): Promise<Company> {
    try {
      const url = `/directory/${eventId}/${companyType}/${companyPk}/`;
      const response = await api.get<any>(url);
      const data = response as any;

      let company: any = null;
      if (data?.status === "success" && data?.data && typeof data.data === "object") {
        company = data.data;
      } else if (data?.id != null && data?.name) {
        company = data;
      }
      if (company) return company as Company;

      throw new ApiClientError({
        status: "error",
        message: data?.message || "Failed to fetch company details",
        response_code: data?.response_code || 404,
        data: {},
      });
    } catch (error: any) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch company details",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },
};
