/**
 * Connection Service
 *
 * Service layer for connection-related API calls.
 */

import { api, ApiResponse, PaginationMeta } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * User object (from backend User schema)
 * Matches backend schema: User
 */
export interface ConnectionUser {
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
  metadata?: any; // User metadata (interests, bio, etc.)
}

/**
 * Connection Response
 * Matches backend schema: Connection
 */
export interface Connection {
  id: number;
  from_user: ConnectionUser;
  to_user: ConnectionUser;
  status: "pending" | "accepted" | "rejected" | "blocked";
  created_at: string;
}

/**
 * Paginated Connection List Response
 * Matches backend schema: PaginatedConnectionList
 */
export interface PaginatedConnectionList {
  count: number;
  next: string | null;
  previous: string | null;
  results: Connection[];
}

/**
 * Connection Request
 */
export interface ConnectionRequest {
  to_user_id: string;
}

/**
 * Connection Action Request
 */
export interface ConnectionActionRequest {
  action: "accept" | "reject" | "block";
}

// ============================================================================
// SERVICE
// ============================================================================

export const connectionService = {
  /**
   * Get all connections for the current user
   *
   * @param page - Page number (optional, default: 1)
   * @param pageSize - Number of results per page (optional)
   * @returns Promise that resolves with paginated connections
   *
   * Backend Endpoint: GET /connections/
   */
  async getConnections(
    page: number = 1,
    pageSize?: number
  ): Promise<{ connections: Connection[]; pagination: PaginationMeta }> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
      };
      if (pageSize) {
        params.page_size = pageSize.toString();
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get<any>(`/connections/?${queryString}`);

      // Backend returns PaginatedConnectionList DIRECTLY (not wrapped in ApiResponse)
      // Structure: { count, next, previous, results: Connection[] }
      // The api.get() returns response.data from axios, which in this case IS the PaginatedConnectionList
      const data = response as any;

      // Check if response has the PaginatedConnectionList structure
      if (data && typeof data === "object" && "results" in data && Array.isArray(data.results)) {
        return {
          connections: data.results as Connection[],
          pagination: {
            count: data.count || 0,
            next: data.next || null,
            previous: data.previous || null,
          },
        };
      }

      // If wrapped in ApiResponse format (status, data, etc.)
      if (data?.status === "success" && data?.data) {
        const responseData = data.data;
        if (responseData && typeof responseData === "object" && "results" in responseData && Array.isArray(responseData.results)) {
          return {
            connections: responseData.results as Connection[],
            pagination: {
              count: responseData.count || 0,
              next: responseData.next || null,
              previous: responseData.previous || null,
            },
          };
        }
      }

      // Fallback: return empty array
      return {
        connections: [],
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
        message: error?.message || "Failed to fetch connections",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Create a connection request
   *
   * @param fromUserId - The ID of the current user (sender)
   * @param toUserId - The ID of the user to connect with (recipient)
   * @returns Promise that resolves with the connection
   *
   * Backend Endpoint: POST /connections/
   * Returns 201 Created with Connection object, or 409 if connection already exists
   */
  async createConnection(
    fromUserId: string,
    toUserId: string
  ): Promise<Connection> {
    try {
      const response = await api.post<any>("/connections/", {
        from_user_id: fromUserId,
        to_user_id: toUserId,
      });

      // Response logged only in development if needed for debugging

      // Handle successful response (201 Created or 200 OK)
      // Backend might return Connection directly or wrapped in ApiResponse
      if (response.status === "success" && response.data) {
        return response.data as Connection;
      }

      // If response_code is 201, treat as success even if status is different
      if (response.response_code === 201 && response.data) {
        return response.data as Connection;
      }

      // Check if response IS the Connection object directly (like GET /connections/)
      if (response.id && response.from_user && response.to_user) {
        return response as Connection;
      }

      throw new ApiClientError({
        status: "error",
        message: response.message || "Failed to create connection",
        response_code: response.response_code || 500,
        data: {},
      });
    } catch (error: any) {
      // Re-throw ApiClientError as-is (includes 409 "Connection already exists")
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to create connection",
        response_code: error?.response_code || 500,
        data: {},
      });
    }
  },

  /**
   * Accept a connection request
   *
   * @param connectionId - The ID of the connection to accept
   * @returns Promise that resolves with the updated connection
   *
   * Backend Endpoint: POST /connections/{id}/action/
   */
  async acceptConnection(connectionId: number): Promise<Connection> {
    try {
      const response = await api.post<Connection>(
        `/connections/${connectionId}/action/`,
        { action: "accept" }
      );

      if (response.status === "success" && response.data) {
        return response.data as Connection;
      }

      throw new ApiClientError({
        status: "error",
        message: response.message || "Failed to accept connection",
        response_code: response.response_code,
        data: response.data || {},
      });
    } catch (error: any) {
      // Re-throw ApiClientError as-is (it already has all the error details)
      if (error instanceof ApiClientError) {
        throw error;
      }
      // Error details already logged in api.ts handleError
      // Wrap other errors
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to accept connection",
        response_code: error?.response_code || error?.response?.status || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },

  /**
   * Reject a connection request
   *
   * @param connectionId - The ID of the connection to reject
   * @returns Promise that resolves with the updated connection
   *
   * Backend Endpoint: POST /connections/{id}/action/
   */
  async rejectConnection(connectionId: number): Promise<Connection> {
    const response = await api.post<Connection>(
      `/connections/${connectionId}/action/`,
      { action: "reject" }
    );

    if (response.status === "success" && response.data) {
      return response.data as Connection;
    }

    throw new ApiClientError({
      status: "error",
      message: response.message || "Failed to reject connection",
      response_code: response.response_code,
      data: {},
    });
  },

  /**
   * Delete a connection
   *
   * @param connectionId - The ID of the connection to delete
   * @returns Promise that resolves when the connection is deleted
   *
   * Backend Endpoint: DELETE /connections/{id}/
   * Returns 204 No Content on success, or 404 if connection not found
   */
  async deleteConnection(connectionId: number): Promise<void> {
    try {
      const response = await api.delete(`/connections/${connectionId}/`);
      
      // DELETE endpoints typically return 204 No Content (no response body)
      // or a success response. Handle both cases.
      if (!response || response.status === "success" || response.response_code === 204) {
        return;
      }

      throw new ApiClientError({
        status: "error",
        message: response?.message || "Failed to delete connection",
        response_code: response?.response_code || 500,
        data: {},
      });
    } catch (error: any) {
      // If it's a 204 No Content, that's success (no response body)
      if (error?.responseCode === 204 || error?.response_code === 204) {
        return;
      }
      
      // If connection not found (404), it might have been deleted by the other party
      // This is not necessarily an error - the connection is gone, which is what we want
      if (error?.responseCode === 404 || error?.response_code === 404) {
        // Connection already deleted (possibly by the other party) - treat as success
        return;
      }
      
      throw error;
    }
  },
};
