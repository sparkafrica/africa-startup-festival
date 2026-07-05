/**
 * Meeting Service
 *
 * Service layer for meeting-related API calls.
 */

import { api, ApiResponse, PaginationMeta } from "./api";
import { ApiClientError } from "./api";
import { EVENT_ID } from "../config/env";
import { parseDisplayTimeToApi } from "../utils/meetingDateTime";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Meeting Slot
 * Matches backend schema: MeetingSlot
 * Backend should include date (YYYY-MM-DD) per slot so we can filter by selected date.
 */
export interface MeetingSlot {
  id: number;
  event: number;
  start_time: string; // Format: time (HH:MM:SS)
  end_time: string; // Format: time (HH:MM:SS)
  table_number: number;
  is_available: boolean;
  /** Slot date (YYYY-MM-DD). Required for correct date filtering (each day has its own slots). */
  date?: string;
}

/**
 * Simple Company (nested in Meeting)
 * Matches backend schema: SimpleCompany
 */
export interface SimpleCompany {
  id: number;
  name: string;
  company_type?: string;
  country?: string;
  logo?: string | null;
}

/**
 * User (nested in Meeting)
 * Matches backend schema: User (simplified for meetings)
 */
export interface MeetingUser {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  profile_pic?: string | null;
  phone_number?: string;
  country?: string;
  job_title?: string;
  organisation?: string | null;
  metadata?: any;
}

/**
 * Meeting Response
 * Matches backend schema: Meeting
 */
export interface Meeting {
  id: number;
  slot: MeetingSlot;
  requester: string; // User ID
  requestee: string; // User ID
  reason: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  requestee_company: SimpleCompany | null;
  requester_company: SimpleCompany | null;
  calendar_link: string;
  location: string;
  requester_name: string;
  requester_info: MeetingUser;
  requestee_info: MeetingUser;
  metadata: any;
  created_at?: string; // Optional: ISO date-time string (readOnly in backend)
}

/**
 * Meeting Request
 * Matches backend schema: MeetingRequestRequest
 */
export interface MeetingRequest {
  meeting_slot_id: number;
  requestee_id: string;
  reason: string;
  metadata?: any;
}

/**
 * Meeting Response Request
 * Matches backend schema: MeetingResponseRequest
 */
export interface MeetingResponseRequest {
  action: "accept" | "reject";
  rejection_reason?: string; // Optional reason for rejection (may be stored in metadata)
}

/**
 * Meeting Cancel Request
 * Matches backend schema: MeetingCancelRequest
 */
export interface MeetingCancelRequest {
  cancellation_reason: string;
}

/**
 * Meeting Update Request
 * Matches backend schema: PatchedMeetingUpdateRequest
 * Note: metadata is not in the official schema but backend supports it for title updates
 */
export interface MeetingUpdateRequest {
  slot_id?: number;
  reason?: string;
  metadata?: any; // Used to update title and other custom fields
}

// ============================================================================
// VIRTUAL MEETING TYPES
// ============================================================================

/**
 * Virtual Meeting Response
 * Matches backend schema: VirtualMeeting
 */
export interface VirtualMeeting {
  id: number;
  requester: string; // User ID
  requestee: string; // User ID
  reason: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  meeting_link: string;
  scheduled_date: string; // Format: date (YYYY-MM-DD)
  scheduled_time: string; // Format: time (HH:MM:SS)
  duration_minutes?: number;
  timezone?: string;
  requester_name: string;
  requestee_name: string;
  requester_info: MeetingUser;
  requestee_info: MeetingUser;
  requestee_company: SimpleCompany | null;
  requester_company: SimpleCompany | null;
  metadata?: any;
  created_at?: string;
}

/**
 * Virtual Meeting Request
 * Matches backend schema: VirtualMeetingRequestRequest
 */
export interface VirtualMeetingRequest {
  requestee_id: string;
  reason: string;
  meeting_link: string;
  scheduled_date: string; // Format: date (YYYY-MM-DD)
  scheduled_time: string; // Format: time (HH:MM:SS)
  duration_minutes?: number;
  metadata?: any;
}

/**
 * Virtual Meeting Response Request
 * Matches backend schema: VirtualMeetingResponseRequest
 */
export interface VirtualMeetingResponseRequest {
  action: "accept" | "reject";
  rejection_reason?: string; // Optional reason for rejection (may be stored in metadata)
}

/**
 * Virtual Meeting Cancel Request
 * Matches backend schema: VirtualMeetingCancelRequest
 */
export interface VirtualMeetingCancelRequest {
  cancellation_reason?: string;
}

/**
 * Virtual Meeting Update Request
 * Matches backend schema: PatchedVirtualMeetingUpdateRequest
 * Note: metadata is not in the official schema but backend supports it for title updates
 */
export interface VirtualMeetingUpdateRequest {
  reason?: string;
  meeting_link?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
  metadata?: any; // Used to update title and other custom fields
}

/**
 * Paginated Meeting Slot List Response
 * Matches backend schema: PaginatedMeetingSlotList
 */
export interface PaginatedMeetingSlotList {
  count: number;
  next: string | null;
  previous: string | null;
  results: MeetingSlot[];
}

/** POST may return ApiResponse<Meeting> or a raw Meeting body depending on backend. */
function isMeetingEntityPayload(value: unknown): value is Meeting {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    o.id != null &&
    typeof o.slot === "object" &&
    o.slot !== null &&
    typeof o.requester === "string"
  );
}

/** POST may return ApiResponse<VirtualMeeting> or a raw VirtualMeeting body depending on backend. */
function isVirtualMeetingEntityPayload(value: unknown): value is VirtualMeeting {
  if (typeof value !== "object" || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    o.id != null &&
    typeof o.requester === "string" &&
    typeof o.requestee === "string"
  );
}

// ============================================================================
// SERVICE
// ============================================================================

export const meetingService = {
  /**
   * Get all meetings for the current user
   *
   * @returns Promise that resolves with array of meetings
   *
   * Backend Endpoint: GET /meetings/
   * Returns array of Meeting objects
   */
  /**
   * Fetch a single meeting by id (deeplinks when list is not loaded).
   *
   * Backend Endpoint: GET /meetings/{id}/
   */
  async getMeetingById(meetingId: number): Promise<Meeting | null> {
    try {
      const response = await api.get<any>(`/meetings/${meetingId}/`);
      const data = response as any;
      const raw = data?.data ?? data;
      if (raw && typeof raw === "object" && raw.id != null) {
        return raw as Meeting;
      }
      return null;
    } catch (error: any) {
      if (error?.responseCode === 404 || error?.response_code === 404) {
        return null;
      }
      throw error;
    }
  },

  async getMeetings(): Promise<Meeting[]> {
    try {
      const response = await api.get<any>("/meetings/");

      const data = response as any;

      if (Array.isArray(data)) {
        return data as Meeting[];
      }

      if (data?.status === "success" && data?.data) {
        if (Array.isArray(data.data)) {
          return data.data as Meeting[];
        }
        // Paginated: { results: Meeting[] }
        if (data.data?.results && Array.isArray(data.data.results)) {
          return data.data.results as Meeting[];
        }
      }

      // Direct paginated: { results: Meeting[] }
      if (data?.results && Array.isArray(data.results)) {
        return data.results as Meeting[];
      }

      return [];
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch meetings",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Get available meeting slots for an event
   *
   * @param eventId - The ID of the event
   * @param page - Page number (optional, default: 1)
   * @param pageSize - Number of results per page (optional)
   * @param date - Optional date (YYYY-MM-DD) to return only slots for that day
   * @returns Promise that resolves with paginated meeting slots
   *
   * Backend Endpoint: GET /events/{event_id}/meeting-slots/
   */
  async getMeetingSlots(
    eventId: number,
    page: number = 1,
    pageSize?: number,
    date?: string
  ): Promise<{ slots: MeetingSlot[]; pagination: PaginationMeta }> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
      };
      if (pageSize) {
        params.page_size = pageSize.toString();
      }
      if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
        params.date = date;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get<any>(
        `/events/${eventId}/meeting-slots/?${queryString}`
      );

      const data = response as any;

      // Normalize slot so we have date in YYYY-MM-DD (backend may send date, slot_date, or start_date)
      const normalizeSlot = (raw: any): MeetingSlot => {
        const slot = raw as MeetingSlot;
        if (!slot.date && (raw.slot_date != null || raw.start_date != null)) {
          const d = raw.slot_date ?? raw.start_date;
          slot.date = typeof d === "string" ? d.slice(0, 10) : undefined;
        } else if (slot.date && slot.date.length > 10) {
          slot.date = slot.date.slice(0, 10);
        }
        return slot;
      };
      const normalizeSlots = (arr: any[]): MeetingSlot[] =>
        Array.isArray(arr) ? arr.map(normalizeSlot) : [];

      // Check if response has the PaginatedMeetingSlotList structure (direct)
      if (
        data &&
        typeof data === "object" &&
        "results" in data &&
        Array.isArray(data.results)
      ) {
        return {
          slots: normalizeSlots(data.results),
          pagination: {
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
          },
        };
      }

      // If wrapped in ApiResponse format
      if (data?.status === "success" && data?.data !== undefined) {
        const responseData = data.data;
        
        // Check if data.data is directly an array (ApiResponse with array data)
        if (Array.isArray(responseData)) {
          return {
            slots: normalizeSlots(responseData),
            pagination: {
              count: responseData.length,
              next: null,
              previous: null,
            },
          };
        }
        
        // Check if data.data is a PaginatedMeetingSlotList object with results
        if (
          responseData &&
          typeof responseData === "object" &&
          "results" in responseData &&
          Array.isArray(responseData.results)
        ) {
          return {
            slots: normalizeSlots(responseData.results),
            pagination: {
              count: responseData.count || 0,
              next: responseData.next || null,
              previous: responseData.previous || null,
            },
          };
        }
      }

      // Check if data is directly an array
      if (Array.isArray(data)) {
        return {
          slots: normalizeSlots(data),
          pagination: {
            count: data.length,
            next: null,
            previous: null,
          },
        };
      }

      // Fallback: return empty array
      return {
        slots: [],
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
        message: error?.message || "Failed to fetch meeting slots",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Create a meeting request
   *
   * @param eventId - The ID of the event
   * @param request - Meeting request data
   * @returns Promise that resolves with the created meeting
   *
   * Backend Endpoint: POST /events/{event_id}/request-meeting/
   * Returns 201 Created with Meeting object
   */
  async createMeetingRequest(
    eventId: number,
    request: MeetingRequest
  ): Promise<Meeting> {
    try {
      const response = await api.post<any>(
        `/events/${eventId}/request-meeting/`,
        request
      );

      // Handle successful response (201 Created or 200 OK)
      // Backend might return Meeting directly or wrapped in ApiResponse
      if (response.status === "success" && response.data) {
        return response.data as Meeting;
      }

      // If response_code is 201, treat as success even if status is different
      if (response.response_code === 201 && response.data) {
        return response.data as Meeting;
      }

      // Check if response IS the Meeting object directly
      const meetingEntity = response as unknown;
      if (isMeetingEntityPayload(meetingEntity)) {
        return meetingEntity;
      }

      // Parse validation errors from response
      let errorMessage = response.message || "Failed to create meeting request";
      
      // Check for non_field_errors at different nesting levels FIRST
      const nonFieldErrors = 
        response.data?.non_field_errors || 
        response.data?.data?.non_field_errors || 
        response.data?.data?.data?.non_field_errors;
      
      if (nonFieldErrors) {
        if (Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
          errorMessage = nonFieldErrors[0];
        } else if (typeof nonFieldErrors === "string") {
          errorMessage = nonFieldErrors;
        }
      } else if (response.data?.data) {
        // Extract field-specific validation errors
        const fieldErrors: string[] = [];
        
        // Then check other field-specific errors
        Object.keys(response.data.data).forEach((field) => {
          if (field === "non_field_errors") return; // Already handled above
          const fieldError = response.data.data[field];
          if (Array.isArray(fieldError)) {
            fieldErrors.push(`${field}: ${fieldError.join(", ")}`);
          } else if (typeof fieldError === "string") {
            fieldErrors.push(`${field}: ${fieldError}`);
          }
        });
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join(". ");
        }
      }

      if (__DEV__) {
        console.warn(
          "[meetingService] createMeetingRequest rejected — backend body (edge cases / validation)",
          {
            endpoint: `POST /events/${eventId}/request-meeting/`,
            requestBody: request,
            responseCode: response.response_code,
            parsedClientMessage: errorMessage,
            rawApiResponse: response,
          },
        );
      }

      throw new ApiClientError({
        status: "error",
        message: errorMessage,
        response_code: response.response_code || 500,
        data: response.data || {},
      });
    } catch (error: any) {
      // Re-throw ApiClientError as-is (it already has parsed errors)
      if (error instanceof ApiClientError) {
        throw error;
      }
      if (__DEV__) {
        console.warn(
          "[meetingService] createMeetingRequest threw (network/parse)",
          {
            endpoint: `POST /events/${eventId}/request-meeting/`,
            requestBody: request,
            error,
          },
        );
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to create meeting request",
        response_code: error?.response_code || 500,
        data: error?.data || {},
      });
    }
  },

  /**
   * Submit a meeting request from RequestMeetingModal form data.
   * Handles both physical and virtual meetings. Throws ApiClientError on failure.
   */
  async submitMeetingRequestFromForm(
    eventId: number,
    formData: {
      title: string;
      meetingType: "Physical" | "Virtual";
      tableNumber?: string;
      meetingLink?: string;
      date?: string;
      time?: string;
      timeApi?: string;
      description: string;
      meeting_slot_id?: number;
    },
    requesteeId: string
  ): Promise<void> {
    if (formData.meetingType === "Virtual") {
      const scheduledTime =
        formData.timeApi?.trim() ||
        (formData.time ? parseDisplayTimeToApi(formData.time) : "10:00:00");
      const virtualRequest: VirtualMeetingRequest = {
        requestee_id: requesteeId,
        reason: formData.description,
        meeting_link: formData.meetingLink!,
        scheduled_date: formData.date!,
        scheduled_time: scheduledTime,
        duration_minutes: 20,
        metadata: {
          title: formData.title,
          meetingType: formData.meetingType,
          selectedDate: formData.date,
          selectedTime: formData.time,
        },
      };
      await this.createVirtualMeetingRequest(virtualRequest);
    } else {
      if (!formData.meeting_slot_id) {
        throw new ApiClientError({
          status: "error",
          message: "Please select a valid date, time, and table for the meeting",
          response_code: 400,
          data: {},
        });
      }
      const meetingRequest: MeetingRequest = {
        meeting_slot_id: formData.meeting_slot_id,
        requestee_id: requesteeId,
        reason: formData.description,
        metadata: {
          title: formData.title,
          meetingType: formData.meetingType,
          selectedDate: formData.date,
          selectedTime: formData.time,
          tableNumber: formData.tableNumber,
        },
      };
      await this.createMeetingRequest(eventId, meetingRequest);
    }
  },

  /**
   * Accept or reject a meeting request
   *
   * @param meetingId - The ID of the meeting
   * @param action - "accept" or "reject"
   * @returns Promise that resolves with the updated meeting
   *
   * Backend Endpoint: POST /meetings/{meeting_id}/response/
   */
  async respondToMeeting(
    meetingId: number,
    action: "accept" | "reject",
    rejectionReason?: string
  ): Promise<Meeting> {
    try {
      const requestBody: MeetingResponseRequest = { action };
      if (action === "reject" && rejectionReason) {
        requestBody.rejection_reason = rejectionReason;
      }
      const response = await api.post<any>(
        `/meetings/${meetingId}/response/`,
        requestBody
      );

      // Handle successful response (200 OK)
      // Backend might return Meeting directly or wrapped in ApiResponse
      if (response.status === "success" && response.data) {
        return response.data as Meeting;
      }

      // If response_code is 200, treat as success even if status is different
      if (response.response_code === 200 && response.data) {
        return response.data as Meeting;
      }

      // Check if response IS the Meeting object directly
      const meetingEntity = response as unknown;
      if (isMeetingEntityPayload(meetingEntity)) {
        return meetingEntity;
      }

      throw new ApiClientError({
        status: "error",
        message: response.message || "Failed to respond to meeting",
        response_code: response.response_code || 500,
        data: response.data || {},
      });
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to respond to meeting",
        response_code: error?.response_code || error?.response?.status || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },

  /**
   * Cancel a meeting
   *
   * @param meetingId - The ID of the meeting to cancel
   * @param cancellationReason - User-entered reason (sent as cancellation_reason)
   * @returns Promise that resolves when the meeting is cancelled
   *
   * Backend Endpoint: POST /meetings/{meeting_id}/cancel-meeting/
   * Request body: { cancellation_reason: string }
   *
   * Backend note (for email templates): The app sends the user's reason in
   * cancellation_reason. Use this field for cancellation emails (metadata vs
   * reason field is backend's choice; the payload key is cancellation_reason).
   */
  async cancelMeeting(
    meetingId: number,
    cancellationReason: string
  ): Promise<void> {
    try {
      const response = await api.post<any>(
        `/meetings/${meetingId}/cancel-meeting/`,
        {
          cancellation_reason: cancellationReason,
        }
      );

      // Backend returns 200 OK on success (may or may not have response body)
      if (
        !response ||
        response.status === "success" ||
        response.response_code === 200
      ) {
        return;
      }

      throw new ApiClientError({
        status: "error",
        message: response?.message || "Failed to cancel meeting",
        response_code: response?.response_code || 500,
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
        message: error?.message || "Failed to cancel meeting",
        response_code: error?.response_code || error?.response?.status || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },

  /**
   * Update a meeting
   *
   * @param meetingId - The ID of the meeting to update
   * @param update - Update data (slot_id and/or reason)
   * @returns Promise that resolves with the updated meeting
   *
   * Backend Endpoint: PATCH /meetings/{meeting_id}/update-meeting/
   */
  async updateMeeting(
    meetingId: number,
    update: MeetingUpdateRequest
  ): Promise<Meeting> {
    try {
      const response = await api.patch<any>(
        `/meetings/${meetingId}/update-meeting/`,
        update
      );

      // Handle successful response (200 OK)
      // Backend might return Meeting directly or wrapped in ApiResponse
      if (response.status === "success" && response.data) {
        return response.data as Meeting;
      }

      // If response_code is 200, treat as success even if status is different
      if (response.response_code === 200 && response.data) {
        return response.data as Meeting;
      }

      // Check if response IS the Meeting object directly
      const meetingEntity = response as unknown;
      if (isMeetingEntityPayload(meetingEntity)) {
        return meetingEntity;
      }

      throw new ApiClientError({
        status: "error",
        message: response.message || "Failed to update meeting",
        response_code: response.response_code || 500,
        data: response.data || {},
      });
    } catch (error: any) {
      // Re-throw ApiClientError as-is
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to update meeting",
        response_code: error?.response_code || error?.response?.status || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },

  // ============================================================================
  // VIRTUAL MEETING METHODS
  // ============================================================================

  /**
   * Get all virtual meetings for the current user
   *
   * @returns Promise that resolves with array of virtual meetings
   *
   * Backend Endpoint: GET /virtual-meetings/
   */
  async getVirtualMeetings(): Promise<VirtualMeeting[]> {
    try {
      const response = await api.get<any>("/virtual-meetings/");

      const data = response as any;

      if (Array.isArray(data)) {
        return data as VirtualMeeting[];
      }

      if (data?.status === "success" && data?.data) {
        if (Array.isArray(data.data)) {
          return data.data as VirtualMeeting[];
        }
        if (data.data?.results && Array.isArray(data.data.results)) {
          return data.data.results as VirtualMeeting[];
        }
      }

      if (data?.results && Array.isArray(data.results)) {
        return data.results as VirtualMeeting[];
      }

      return [];
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to fetch virtual meetings",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Create a virtual meeting request
   *
   * @param request - Virtual meeting request data
   * @returns Promise that resolves with the created virtual meeting
   *
   * Backend Endpoint: POST /virtual-meetings/request/
   */
  async createVirtualMeetingRequest(
    request: VirtualMeetingRequest
  ): Promise<VirtualMeeting> {
    try {
      const response = await api.post<any>(
        `/virtual-meetings/${EVENT_ID}/request/`,
        request
      );

      if (response.status === "success" && response.data) {
        return response.data as VirtualMeeting;
      }

      if (response.response_code === 201 && response.data) {
        return response.data as VirtualMeeting;
      }

      const vmEntity = response as unknown;
      if (isVirtualMeetingEntityPayload(vmEntity)) {
        return vmEntity;
      }

      // Parse validation errors from response
      let errorMessage = response.message || "Failed to create virtual meeting request";
      
      // Check for non_field_errors at different nesting levels
      const nonFieldErrors = 
        response.data?.non_field_errors || 
        response.data?.data?.non_field_errors || 
        response.data?.data?.data?.non_field_errors;
      
      if (nonFieldErrors) {
        const fieldErrors: string[] = [];
        if (Array.isArray(nonFieldErrors)) {
          fieldErrors.push(...nonFieldErrors);
        } else if (typeof nonFieldErrors === "string") {
          fieldErrors.push(nonFieldErrors);
        }
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors[0];
        }
      } else if (response.data?.data) {
        // Extract field-specific validation errors and non_field_errors
        const fieldErrors: string[] = [];
        
        // Then check other field-specific errors
        Object.keys(response.data.data).forEach((field) => {
          if (field === "non_field_errors") return; // Already handled
          const fieldError = response.data.data[field];
          if (Array.isArray(fieldError)) {
            fieldErrors.push(`${field}: ${fieldError.join(", ")}`);
          } else if (typeof fieldError === "string") {
            fieldErrors.push(`${field}: ${fieldError}`);
          }
        });
        
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors.join(". ");
        }
      }

      if (__DEV__) {
        console.warn(
          "[meetingService] createVirtualMeetingRequest rejected — backend body",
          {
            endpoint: `POST /virtual-meetings/${EVENT_ID}/request/`,
            requestBody: request,
            responseCode: response.response_code,
            parsedClientMessage: errorMessage,
            rawApiResponse: response,
          },
        );
      }

      throw new ApiClientError({
        status: "error",
        message: errorMessage,
        response_code: response.response_code || 500,
        data: response.data || {},
      });
    } catch (error: any) {
      if (__DEV__) {
        console.error("❌ Virtual meeting request error:", {
          message: error?.message,
          response_code: error?.response_code,
          status: error?.status,
          data: error?.data,
          fullError: error,
        });
      }

      if (error instanceof ApiClientError) {
        // Enhance error message if it has nested data
        if (error.data?.data) {
          const fieldErrors: string[] = [];
          
          // Check for non_field_errors first (general validation errors)
          if (error.data.data.non_field_errors) {
            const nonFieldErrors = error.data.data.non_field_errors;
            if (Array.isArray(nonFieldErrors)) {
              fieldErrors.push(...nonFieldErrors);
            } else if (typeof nonFieldErrors === "string") {
              fieldErrors.push(nonFieldErrors);
            }
          }
          
          // Then check other field-specific errors
          Object.keys(error.data.data).forEach((field) => {
            if (field === "non_field_errors") return; // Already handled
            const fieldError = error.data.data[field];
            if (Array.isArray(fieldError)) {
              fieldErrors.push(`${field}: ${fieldError.join(", ")}`);
            } else if (typeof fieldError === "string") {
              fieldErrors.push(`${field}: ${fieldError}`);
            }
          });
          
          if (fieldErrors.length > 0) {
            throw new ApiClientError({
              status: "error",
              message: fieldErrors.join(". "),
              response_code: error.responseCode,
              data: error.data ?? {},
            });
          }
        }
        throw error;
      }
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to create virtual meeting request",
        response_code: error?.response_code || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },

  /**
   * Accept or reject a virtual meeting request
   *
   * @param virtualMeetingId - The ID of the virtual meeting
   * @param action - "accept" or "reject"
   * @returns Promise that resolves with the updated virtual meeting
   *
   * Backend Endpoint: POST /virtual-meetings/{virtual_meeting_id}/response/
   */
  async respondToVirtualMeeting(
    virtualMeetingId: number,
    action: "accept" | "reject",
    rejectionReason?: string
  ): Promise<VirtualMeeting> {
    try {
      const requestBody: VirtualMeetingResponseRequest = { action };
      if (action === "reject" && rejectionReason) {
        requestBody.rejection_reason = rejectionReason;
      }
      const response = await api.post<any>(
        `/virtual-meetings/${virtualMeetingId}/response/`,
        requestBody
      );

      if (response.status === "success" && response.data) {
        return response.data as VirtualMeeting;
      }

      if (response.response_code === 200 && response.data) {
        return response.data as VirtualMeeting;
      }

      const vmEntity = response as unknown;
      if (isVirtualMeetingEntityPayload(vmEntity)) {
        return vmEntity;
      }

      throw new ApiClientError({
        status: "error",
        message: response.message || "Failed to respond to virtual meeting",
        response_code: response.response_code || 500,
        data: response.data || {},
      });
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to respond to virtual meeting",
        response_code: error?.response_code || error?.response?.status || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },

  /**
   * Cancel a virtual meeting
   *
   * @param virtualMeetingId - The ID of the virtual meeting to cancel
   * @param cancellationReason - User-entered reason (sent as cancellation_reason)
   * @returns Promise that resolves when the virtual meeting is cancelled
   *
   * Backend Endpoint: POST /virtual-meetings/{virtual_meeting_id}/cancel/
   * Request body: { cancellation_reason: string } (optional for virtual)
   *
   * Backend note: Same as physical meeting - use cancellation_reason for emails.
   */
  async cancelVirtualMeeting(
    virtualMeetingId: number,
    cancellationReason?: string
  ): Promise<void> {
    try {
      const response = await api.post<any>(
        `/virtual-meetings/${virtualMeetingId}/cancel/`,
        {
          cancellation_reason: cancellationReason || "Cancelled by user",
        }
      );

      if (
        !response ||
        response.status === "success" ||
        response.response_code === 200
      ) {
        return;
      }

      throw new ApiClientError({
        status: "error",
        message: response?.message || "Failed to cancel virtual meeting",
        response_code: response?.response_code || 500,
        data: {},
      });
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to cancel virtual meeting",
        response_code: error?.response_code || error?.response?.status || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },

  /**
   * Update a virtual meeting
   *
   * @param virtualMeetingId - The ID of the virtual meeting to update
   * @param update - Update data
   * @returns Promise that resolves with the updated virtual meeting
   *
   * Backend Endpoint: PATCH /virtual-meetings/{virtual_meeting_id}/update/
   */
  async updateVirtualMeeting(
    virtualMeetingId: number,
    update: VirtualMeetingUpdateRequest
  ): Promise<VirtualMeeting> {
    try {
      const response = await api.patch<any>(
        `/virtual-meetings/${virtualMeetingId}/update/`,
        update
      );

      if (response.status === "success" && response.data) {
        return response.data as VirtualMeeting;
      }

      if (response.response_code === 200 && response.data) {
        return response.data as VirtualMeeting;
      }

      const vmEntity = response as unknown;
      if (isVirtualMeetingEntityPayload(vmEntity)) {
        return vmEntity;
      }

      throw new ApiClientError({
        status: "error",
        message: response.message || "Failed to update virtual meeting",
        response_code: response.response_code || 500,
        data: response.data || {},
      });
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to update virtual meeting",
        response_code: error?.response_code || error?.response?.status || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },
};
