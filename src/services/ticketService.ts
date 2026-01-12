/**
 * Ticket Service
 *
 * Service layer for ticket-related API calls.
 * Follows the same pattern as authService for consistency.
 */

import { api } from "./api";
import { ApiResponse, ApiClientError } from "./api";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Ticket Quota Response
 * Matches backend schema: TicketQuota
 */
export interface TicketQuota {
  id: number;
  user: string | null;
  event: {
    id: number;
    name: string;
    // Add other event fields as needed
  };
  ticket_class: {
    id: number;
    name: string;
    type?: string; // Optional - some backends use user_type instead
    user_type?: string; // Backend field: "exhibitor", "partner", "attendee", etc.
    // Add other ticket class fields as needed
  };
  quota: number; // Total quota available
  allocated_tickets: number; // Number of tickets already allocated
  remaining_quota?: number; // Optional: Remaining quota (if provided by backend)
}

/**
 * Ticket Allocation Response
 * Matches backend schema: TicketAllocation
 */
export interface TicketAllocation {
  id: number;
  quota: number;
  ticket_class_name: string;
  email: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  created_at: string;
  updated_at: string;
}

/**
 * Ticket Response
 * Represents a ticket owned by the user
 * Matches backend Ticket schema
 */
export interface Ticket {
  id: number;
  ticket_code: string; // UUID format - backend field name (snake_case)
  ticketNumber?: string; // Frontend field name (camelCase) - for compatibility (maps to ticket_code)
  qr_code?: string | null; // QR code URL
  type: TicketClass; // Backend uses 'type' field for TicketClass
  ticket_class?: TicketClass; // Frontend compatibility (maps to type)
  // Additional fields as needed
  [key: string]: any;
}

/**
 * Ticket Class (from backend schema)
 */
export interface TicketClass {
  id: number;
  name: string;
  description?: string;
  user_type?: string; // "founder", "investor", "partner", "exhibitor", "delegate", etc.
}

/**
 * Company (from backend schema)
 * Minimal Company interface for scanned attendee display
 */
export interface Company {
  id: number;
  name: string;
  company_type?: string;
  logo?: string | null;
  company_sector?: string;
  [key: string]: any;
}

/**
 * User (from backend schema)
 * Matches backend User schema
 * Can have either organisation (string) or company (object) or both
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
  company?: Company | null; // Company object (if backend returns it)
  metadata?: any;
}

/**
 * Attendee Response
 * Response from GET /events/{event_id}/attendees/{ticket_code}/
 * Matches backend Attendee schema
 */
export interface Attendee {
  ticket: Ticket;
  user: AttendeeUser;
  match_info: string | null;
}

/**
 * Ticket Recipient Data
 * Data for transferring/assigning tickets
 */
export interface TicketRecipient {
  fullName: string;
  email: string;
  phoneNumber: string;
  countryCode?: string;
}

/**
 * Transfer Ticket Request
 */
export interface TransferTicketRequest {
  recipient: TicketRecipient;
}

/**
 * Assign Ticket Request
 */
export interface AssignTicketRequest {
  recipient: TicketRecipient;
}

/**
 * Revoke Ticket Request
 */
export interface RevokeTicketRequest {
  reason?: string;
}

// ============================================================================
// TICKET SERVICE
// ============================================================================

export const ticketService = {
  /**
   * Get user's ticket quotas for a specific event
   *
   * @param eventId - The event ID
   * @returns Promise that resolves with array of ticket quotas
   *
   * Backend Endpoint: GET /tickets/{event_id}/user/quotas/
   */
  async getUserQuotas(eventId: number): Promise<TicketQuota[]> {
    const response = await api.get<TicketQuota[]>(
      `/tickets/${eventId}/user/quotas/`
    );

    if (response.status === "success" && response.data) {
      // Backend returns paginated response or array
      // Check if data is array or paginated object
      const data = response.data as any;

      // If paginated response
      if (data.results && Array.isArray(data.results)) {
        return data.results as TicketQuota[];
      }

      // If direct array
      if (Array.isArray(data)) {
        return data as TicketQuota[];
      }

      // If single object, wrap in array
      return [data as TicketQuota];
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to get ticket quotas",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Get user's ticket allocations for a specific event
   *
   * @param eventId - The event ID
   * @returns Promise that resolves with array of ticket allocations
   *
   * Backend Endpoint: GET /tickets/{event_id}/user/allocations/
   */
  async getUserAllocations(eventId: number): Promise<TicketAllocation[]> {
    const response = await api.get<TicketAllocation[]>(
      `/tickets/${eventId}/user/allocations/`
    );

    if (response.status === "success" && response.data) {
      const data = response.data as any;

      if (data.results && Array.isArray(data.results)) {
        return data.results as TicketAllocation[];
      }

      if (Array.isArray(data)) {
        return data as TicketAllocation[];
      }

      return [data as TicketAllocation];
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to get ticket allocations",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Get user's ticket for a specific event
   *
   * @param eventId - Event ID (required)
   * @returns Promise that resolves with the user's ticket
   *
   * Backend Endpoint: GET /tickets/{event_id}/user/
   * Note: Returns a single Ticket, not an array
   */
  async getUserTicket(eventId: number): Promise<Ticket> {
    const response = await api.get<Ticket>(
      `/tickets/${eventId}/user/`
    );

    if (response.status === "success" && response.data) {
      const data = response.data as any;
      
      if (data && typeof data === "object") {
        return data as Ticket;
      }
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to get user ticket",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Scan/lookup ticket by ticket code (UUID)
   *
   * @param eventId - Event ID
   * @param ticketCode - Ticket code (UUID format)
   * @returns Promise that resolves with attendee data (ticket + user info)
   *
   * Backend Endpoint: GET /events/{event_id}/attendees/{ticket_code}/
   */
  async scanTicketByCode(
    eventId: number,
    ticketCode: string
  ): Promise<Attendee> {
    const response = await api.get<Attendee>(
      `/events/${eventId}/attendees/${ticketCode}/`
    );

    if (response.status === "success" && response.data) {
      const data = response.data as any;
      // Check if data has the expected structure (ticket and user properties)
      if (data && typeof data === "object" && (data.ticket || data.user)) {
        return data as Attendee;
      }
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to scan ticket",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Transfer ticket to recipient
   *
   * @param ticketId - Ticket ID to transfer
   * @param recipientData - Recipient information
   * @returns Promise that resolves with updated ticket data
   *
   * Backend Endpoint: POST /tickets/{ticketId}/transfer/
   */
  async transferTicket(
    ticketId: number | string,
    recipientData: TicketRecipient
  ): Promise<Ticket> {
    const requestBody: TransferTicketRequest = {
      recipient: recipientData,
    };

    const response = await api.post<TransferTicketRequest>(
      `/tickets/${ticketId}/transfer/`,
      requestBody
    );

    if (response.status === "success" && response.data) {
      return response.data as Ticket;
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to transfer ticket",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Assign ticket to recipient
   *
   * @param ticketId - Ticket ID to assign
   * @param recipientData - Recipient information
   * @returns Promise that resolves with updated ticket data
   *
   * Backend Endpoint: POST /tickets/{ticketId}/assign/
   */
  async assignTicket(
    ticketId: number | string,
    recipientData: TicketRecipient
  ): Promise<Ticket> {
    const requestBody: AssignTicketRequest = {
      recipient: recipientData,
    };

    const response = await api.post<AssignTicketRequest>(
      `/tickets/${ticketId}/assign/`,
      requestBody
    );

    if (response.status === "success" && response.data) {
      return response.data as Ticket;
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to assign ticket",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Revoke ticket access
   *
   * @param ticketId - Ticket ID to revoke
   * @param reason - Optional reason for revocation
   * @returns Promise that resolves with updated ticket data
   *
   * Backend Endpoint: POST /tickets/{ticketId}/revoke/
   */
  async revokeTicket(
    ticketId: number | string,
    reason?: string
  ): Promise<Ticket> {
    const requestBody: RevokeTicketRequest = {
      reason: reason || undefined,
    };

    const response = await api.post<RevokeTicketRequest>(
      `/tickets/${ticketId}/revoke/`,
      requestBody
    );

    if (response.status === "success" && response.data) {
      return response.data as Ticket;
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to revoke ticket",
      response_code: response.response_code,
      data: {},
    });
  },
};
