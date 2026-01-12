/**
 * Meeting Service
 *
 * Service layer for meeting-related API calls.
 */

import { api } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Meeting Response
 * Matches backend schema: Meeting
 */
export interface Meeting {
  id: number;
  requester: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  requestee: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  slot?: {
    id: number;
    start_time: string;
    end_time: string;
    table_number: number;
  };
  reason: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
}

/**
 * Meeting Request
 */
export interface MeetingRequest {
  requestee_id: string;
  meeting_slot_id: number;
  reason: string;
  metadata?: any;
}

// ============================================================================
// SERVICE
// ============================================================================

export const meetingService = {
  /**
   * Request a meeting with another user
   *
   * @param request - Meeting request data
   * @returns Promise that resolves with the meeting
   *
   * Backend Endpoint: POST /meetings/request/
   */
  async requestMeeting(request: MeetingRequest): Promise<Meeting> {
    const response = await api.post<Meeting>("/meetings/request/", request);

    if (response.status === "success" && response.data) {
      return response.data as Meeting;
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to request meeting",
      response_code: response.response_code,
      data: {},
    });
  },
};
