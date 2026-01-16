/**
 * Meeting Service
 *
 * Service layer for meeting-related API calls.
 */

import { api, ApiResponse, PaginationMeta } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Meeting Slot
 * Matches backend schema: MeetingSlot
 */
export interface MeetingSlot {
  id: number;
  event: number;
  start_time: string; // Format: time (HH:MM:SS)
  end_time: string; // Format: time (HH:MM:SS)
  table_number: number;
  is_available: boolean;
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
 */
export interface MeetingUpdateRequest {
  slot_id?: number;
  reason?: string;
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
 */
export interface VirtualMeetingUpdateRequest {
  reason?: string;
  meeting_link?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  duration_minutes?: number;
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
  async getMeetings(): Promise<Meeting[]> {
    try {
      const response = await api.get<any>("/meetings/");

      // Backend returns array of Meeting objects directly or wrapped in ApiResponse
      const data = response as any;

      // If it's an array, return it directly
      if (Array.isArray(data)) {
        return data as Meeting[];
      }

      // If wrapped in ApiResponse format
      if (data?.status === "success" && data?.data) {
        if (Array.isArray(data.data)) {
          return data.data as Meeting[];
        }
      }

      // Fallback: return empty array
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
   * @returns Promise that resolves with paginated meeting slots
   *
   * Backend Endpoint: GET /events/{event_id}/meeting-slots/
   */
  async getMeetingSlots(
    eventId: number,
    page: number = 1,
    pageSize?: number
  ): Promise<{ slots: MeetingSlot[]; pagination: PaginationMeta }> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
      };
      if (pageSize) {
        params.page_size = pageSize.toString();
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get<any>(
        `/events/${eventId}/meeting-slots/?${queryString}`
      );

      const data = response as any;

      // Check if response has the PaginatedMeetingSlotList structure (direct)
      if (
        data &&
        typeof data === "object" &&
        "results" in data &&
        Array.isArray(data.results)
      ) {
        return {
          slots: data.results as MeetingSlot[],
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
            slots: responseData as MeetingSlot[],
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
            slots: responseData.results as MeetingSlot[],
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
          slots: data as MeetingSlot[],
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
      if (response.id && response.slot && response.requester) {
        return response as Meeting;
      }

      throw new ApiClientError({
        status: "error",
        message: response.message || "Failed to create meeting request",
        response_code: response.response_code || 500,
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
        message: error?.message || "Failed to create meeting request",
        response_code: error?.response_code || 500,
        data: {},
      });
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
      if (response.id && response.slot && response.requester) {
        return response as Meeting;
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
   * @param cancellationReason - Reason for cancellation
   * @returns Promise that resolves when the meeting is cancelled
   *
   * Backend Endpoint: POST /meetings/{meeting_id}/cancel-meeting/
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
      if (response.id && response.slot && response.requester) {
        return response as Meeting;
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
        "/virtual-meetings/request/",
        request
      );

      if (response.status === "success" && response.data) {
        return response.data as VirtualMeeting;
      }

      if (response.response_code === 201 && response.data) {
        return response.data as VirtualMeeting;
      }

      if (response.id && response.requester && response.requestee) {
        return response as VirtualMeeting;
      }

      throw new ApiClientError({
        status: "error",
        message: response.message || "Failed to create virtual meeting request",
        response_code: response.response_code || 500,
        data: {},
      });
    } catch (error: any) {
      if (error instanceof ApiClientError) {
        throw error;
      }
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to create virtual meeting request",
        response_code: error?.response_code || 500,
        data: {},
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

      if (response.id && response.requester && response.requestee) {
        return response as VirtualMeeting;
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
   * @param cancellationReason - Reason for cancellation
   * @returns Promise that resolves when the virtual meeting is cancelled
   *
   * Backend Endpoint: POST /virtual-meetings/{virtual_meeting_id}/cancel/
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

      if (response.id && response.requester && response.requestee) {
        return response as VirtualMeeting;
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
