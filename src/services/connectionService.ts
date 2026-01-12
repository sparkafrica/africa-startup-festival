/**
 * Connection Service
 *
 * Service layer for connection-related API calls.
 */

import { api } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Connection Response
 * Matches backend schema: Connection
 */
export interface Connection {
  id: number;
  from_user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  to_user: {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
  };
  status: "pending" | "accepted" | "rejected" | "blocked";
  created_at: string;
}

/**
 * Connection Request
 */
export interface ConnectionRequest {
  to_user_id: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const connectionService = {
  /**
   * Create a connection request
   *
   * @param toUserId - The ID of the user to connect with
   * @returns Promise that resolves with the connection
   *
   * Backend Endpoint: POST /connections/
   */
  async createConnection(toUserId: string): Promise<Connection> {
    const response = await api.post<Connection>("/connections/", {
      to_user_id: toUserId,
    });

    if (response.status === "success" && response.data) {
      return response.data as Connection;
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to create connection",
      response_code: response.response_code,
      data: {},
    });
  },
};
