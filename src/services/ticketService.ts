/**
 * Ticket Service
 *
 * Service layer for ticket-related API calls.
 * Follows the same pattern as authService for consistency.
 */

import { api } from "./api";

// In-memory cache for user ticket (Menu prefetch) - TTL 5 min
const USER_TICKET_CACHE: Map<number, { ticket: any; ts: number }> = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

export function clearTicketCache(): void {
  USER_TICKET_CACHE.clear();
}
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
  /** Backend returns first_name, last_name (no recipient_ prefix) */
  first_name?: string;
  last_name?: string;
  phone?: string;
  /** Legacy/alternate field names */
  recipient_first_name?: string;
  recipient_last_name?: string;
  recipient_phone?: string;
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
  fullName?: string;
  firstName?: string;
  lastName?: string;
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
 * Transfer initiate request – POST /tickets/transfer/initiate/
 * Backend: transfer current user's personal ticket for the event to the recipient.
 */
export interface TicketTransferInitiateRequest {
  event_id: number;
  recipient_email: string;
  recipient_first_name?: string;
  recipient_last_name?: string;
}

/**
 * Transfer ticket initiate request – POST /tickets/transfer/initiate/
 * Backend uses auth user's personal ticket for the given event_id.
 */
export interface TicketTransferInitiateRequest {
  event_id: number;
  recipient_email: string;
  recipient_first_name?: string;
  recipient_last_name?: string;
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

/**
 * Upgrade Ticket Request
 * Backend: POST /purchase/upgrade-ticket/
 * Required: event_id, ticket_id, new_ticket_class_id, payment_method (enum), currency.
 */
export interface UpgradeTicketRequest {
  event_id: number;
  ticket_id: number;
  new_ticket_class_id: number;
  /** Backend enum: e.g. "KORAPAY", "PAYAYA" */
  payment_method: string;
  currency: string;
}

/**
 * Upgrade Ticket Response – backend returns payment_url and amount for redirect.
 */
export interface UpgradeTicketResponse {
  payment_url: string;
  amount: string | number;
  /** Updated ticket if returned */
  ticket?: Ticket;
  [key: string]: any;
}

/** Payment method enum for upgrade-ticket (backend). Must match backend TicketUpgradeRequest.payment_method enum. */
/** ATE2026: Korapay only. Re-add others here if needed: PAYSTACK, PAYAZA, STRIPE, INVOICE, OTHER, FREE. */
export const UPGRADE_PAYMENT_METHODS = [
  { value: "KORAPAY", label: "Korapay" },
] as const;

/**
 * Allocation Request - for allocate-ticket API
 * Matches backend AllocationRequest schema
 */
export interface AllocationRequest {
  ticket_class_id: number;
  recipient_email: string;
  recipient_first_name: string;
  recipient_last_name: string;
  organisation?: string | null;
  organisation_website?: string | null;
  organisation_role?: string | null;
}

/**
 * Allocate Ticket Request
 * Matches backend AllocateTicketRequest schema
 */
export interface AllocateTicketRequest {
  event_id: number;
  allocations: AllocationRequest[];
  otp?: number;
  email?: string;
  payment_reference?: string;
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

      let items: any[];
      if (data.results && Array.isArray(data.results)) {
        items = data.results;
      } else if (Array.isArray(data)) {
        items = data;
      } else {
        items = [data];
      }

      return items as TicketAllocation[];
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to get ticket allocations",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * List ticket classes for an event (Event Management).
   * Use for upgrade flow to get new_ticket_class_id for each tier.
   *
   * Backend Endpoint: GET /tickets/classes/?event={eventId}
   */
  async getTicketClasses(eventId: number): Promise<TicketClass[]> {
    const response = await api.get<TicketClass[]>(
      `/tickets/classes/?event=${eventId}`
    );
    if (response.status === "success" && response.data !== undefined) {
      const data = response.data as any;
      if (Array.isArray(data)) return data as TicketClass[];
      if (data?.results && Array.isArray(data.results))
        return data.results as TicketClass[];
      if (data?.data && Array.isArray(data.data)) return data.data as TicketClass[];
    }
    throw new ApiClientError({
      status: "error",
      message: (response as any).message || "Failed to get ticket classes",
      response_code: (response as any).response_code ?? 500,
      data: {},
    });
  },

  /**
   * Get a single ticket class by ID.
   * Backend Endpoint: GET /tickets/classes/{id}/
   */
  async getTicketClass(id: number): Promise<TicketClass> {
    const response = await api.get<TicketClass>(`/tickets/classes/${id}/`);
    if (response.status === "success" && response.data) {
      const data = response.data as any;
      if (data && typeof data === "object") return data as TicketClass;
    }
    throw new ApiClientError({
      status: "error",
      message: (response as any).message || "Failed to get ticket class",
      response_code: (response as any).response_code ?? 500,
      data: {},
    });
  },

  /**
   * Get user's ticket for a specific event
   *
   * @param eventId - Event ID (required)
   * @param options.bypassCache - If true, skip cache so pass type/colors stay correct after backend changes
   * @returns Promise that resolves with the user's ticket
   *
   * Backend Endpoint: GET /tickets/{event_id}/user/
   * Note: Returns a single Ticket, not an array
   */
  async getUserTicket(
    eventId: number,
    options?: { bypassCache?: boolean }
  ): Promise<Ticket> {
    const bypassCache = options?.bypassCache === true;
    if (!bypassCache) {
      const cached = USER_TICKET_CACHE.get(eventId);
      if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
        return cached.ticket as Ticket;
      }
    }

    const response = await api.get<Ticket>(
      `/tickets/${eventId}/user/`
    );

    if (response.status === "success" && response.data) {
      const data = response.data as any;
      
      if (data && typeof data === "object") {
        const ticket = data as Ticket;
        USER_TICKET_CACHE.set(eventId, { ticket, ts: Date.now() });
        return ticket;
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
   * Allocate ticket from quota to recipient
   *
   * @param eventId - Event ID
   * @param ticketClassId - Ticket class ID
   * @param recipientData - Recipient information (fullName, email, phoneNumber)
   * @returns Promise that resolves with created allocation(s)
   *
   * Backend Endpoint: POST /tickets/allocate-ticket/
   */
  async allocateTicket(
    eventId: number,
    ticketClassId: number,
    recipientData: TicketRecipient
  ): Promise<TicketAllocation[]> {
    const firstName =
      recipientData.firstName?.trim() ||
      (recipientData.fullName || "").trim().split(/\s+/)[0] ||
      "";
    const lastName =
      recipientData.lastName?.trim() ||
      (recipientData.fullName || "").trim().split(/\s+/).slice(1).join(" ") ||
      firstName;

    const requestBody: AllocateTicketRequest = {
      event_id: eventId,
      allocations: [
        {
          ticket_class_id: ticketClassId,
          recipient_email: recipientData.email,
          recipient_first_name: firstName,
          recipient_last_name: lastName,
          organisation: null,
          organisation_website: null,
          organisation_role: null,
        },
      ],
    };

    const response = await api.post<AllocateTicketRequest>(
      "/tickets/allocate-ticket/",
      requestBody
    );

    if (response.status === "success" && response.data) {
      const data = response.data as any;
      if (Array.isArray(data)) return data as TicketAllocation[];
      if (data.results && Array.isArray(data.results))
        return data.results as TicketAllocation[];
      return [data as TicketAllocation];
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to allocate ticket",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Initiate transfer of current user's personal ticket to a recipient.
   * Backend determines the ticket from auth + event_id.
   *
   * Backend Endpoint: POST /tickets/transfer/initiate/
   */
  async transferTicketInitiate(
    eventId: number,
    recipientData: TicketRecipient
  ): Promise<void> {
    const firstName =
      recipientData.firstName?.trim() ||
      (recipientData.fullName || "").trim().split(/\s+/)[0] ||
      "";
    const lastName =
      recipientData.lastName?.trim() ||
      (recipientData.fullName || "").trim().split(/\s+/).slice(1).join(" ") ||
      firstName;

    const requestBody: TicketTransferInitiateRequest = {
      event_id: eventId,
      recipient_email: recipientData.email.trim(),
      recipient_first_name: firstName || undefined,
      recipient_last_name: lastName || undefined,
    };

    const response = await api.post<TicketTransferInitiateRequest>(
      "/tickets/transfer/initiate/",
      requestBody
    );

    if (response.status !== "success") {
      throw new ApiClientError({
        status: "error",
        message: (response as any).message || "Failed to transfer ticket",
        response_code: (response as any).response_code ?? 400,
        data: {},
      });
    }
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
   * Cancel allocation (return assigned ticket to quota)
   * Per Spark EMS YAML: POST /tickets/cancel-allocation/{allocation_id}/
   *
   * @param allocationId - Allocation ID to cancel
   * @returns Promise that resolves with cancelled allocation
   */
  async cancelAllocation(allocationId: number): Promise<TicketAllocation> {
    const response = await api.post<unknown>(
      `/tickets/cancel-allocation/${allocationId}/`,
      {}
    );
    if (response.status === "success" && response.data) {
      return response.data as TicketAllocation;
    }
    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to cancel allocation",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * @deprecated Use cancelAllocation. Kept for compatibility.
   */
  async revokeAllocation(
    allocationId: number,
    _reason?: string
  ): Promise<void> {
    await this.cancelAllocation(allocationId);
  },

  /**
   * Update allocation recipient details
   * NOTE: Backend does NOT expose this endpoint in Spark EMS YAML.
   * The only allocation endpoints are: allocate-ticket, cancel-allocation, get allocations.
   * Returns 404 until backend adds PATCH /tickets/allocations/{id}/ or equivalent.
   */
  async updateAllocation(
    allocationId: number,
    recipientData: TicketRecipient
  ): Promise<TicketAllocation> {
    const nameParts = (recipientData.fullName || "").trim().split(/\s+/);
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || firstName;
    const body = {
      recipient_email: recipientData.email,
      recipient_first_name: firstName,
      recipient_last_name: lastName,
      recipient_phone: recipientData.phoneNumber || null,
    };
    const response = await api.patch<typeof body>(
      `/tickets/allocations/${allocationId}/`,
      body
    );
    if (response.status === "success" && response.data) {
      return response.data as TicketAllocation;
    }
    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to update allocation",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Upgrade ticket to a higher tier. Backend returns payment_url and amount;
   * app should redirect user to payment_url to complete payment.
   *
   * @param eventId - Event ID
   * @param ticketId - User's ticket ID (personal ticket)
   * @param newTicketClassId - Ticket class ID (from GET /tickets/classes/)
   * @param paymentMethod - Backend enum: "KORAPAY" | "NGN FOR TESTING" (others may be added)
   * @param currency - e.g. "NGN", "USD"
   * @returns UpgradeTicketResponse with payment_url and amount for redirect
   *
   * Backend Endpoint: POST /purchase/upgrade-ticket/
   */
  async upgradeTicket(
    eventId: number,
    ticketId: number,
    newTicketClassId: number,
    paymentMethod: string,
    currency: string
  ): Promise<UpgradeTicketResponse> {
    const requestBody: UpgradeTicketRequest = {
      event_id: eventId,
      ticket_id: ticketId,
      new_ticket_class_id: newTicketClassId,
      payment_method: paymentMethod,
      currency,
    };
    const response = await api.post<UpgradeTicketResponse>(
      "/purchase/upgrade-ticket/",
      requestBody
    );
    if (response.status === "success" && response.data) {
      const data = response.data as any;
      if (data && typeof data === "object") {
        clearTicketCache();
        return data as UpgradeTicketResponse;
      }
    }
    throw new ApiClientError({
      status: "error",
      message: (response as any).message || "Failed to upgrade ticket",
      response_code: (response as any).response_code ?? 500,
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
