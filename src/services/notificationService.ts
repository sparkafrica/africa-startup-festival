/**
 * Notification Service
 *
 * Service layer for notification-related API calls.
 */

import { api, ApiResponse, PaginationMeta } from "./api";
import { ApiClientError } from "./api";

// ============================================================================
// REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * User Notification
 * Matches backend schema: UserNotification
 */
export interface UserNotification {
  id: number;
  title: string;
  description: string;
  timestamp: string; // ISO date-time string
  route: string | null; // Navigation route
  meeting_id: string | null;
  connection_id: string | null;
  is_read: boolean;
  /** When backend includes chat metadata (optional). */
  conversation_id?: string | null;
  event_id?: string | null;
  notification_type?: string | null;
  other_party_name?: string | null;
  /** Optional store listing URL for app_update notifications. */
  store_url?: string | null;
}

/**
 * Paginated User Notification List Response
 * Matches backend schema: PaginatedUserNotificationList
 */
export interface PaginatedUserNotificationList {
  count: number;
  next: string | null;
  previous: string | null;
  results: UserNotification[];
}

// ============================================================================
// SERVICE
// ============================================================================

export const notificationService = {
  /**
   * Get all notifications for the authenticated user
   *
   * @param page - Page number (optional, default: 1)
   * @param pageSize - Number of results per page (optional)
   * @param ordering - Ordering field (optional, default: latest first)
   * @param search - Search term (optional)
   * @returns Promise that resolves with paginated notifications
   *
   * Backend Endpoint: GET /notifications/
   * Returns last 7 days, ordered by timestamp (latest first)
   */
  async getNotifications(
    page: number = 1,
    pageSize?: number,
    ordering?: string,
    search?: string
  ): Promise<{ notifications: UserNotification[]; pagination: PaginationMeta }> {
    try {
      const params: Record<string, string> = {
        page: page.toString(),
      };
      if (pageSize) {
        params.page_size = pageSize.toString();
      }
      if (ordering) {
        params.ordering = ordering;
      }
      if (search) {
        params.search = search;
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get<any>(
        `/notifications/?${queryString}`
      );

      const data = response as any;

      // Check if response has the PaginatedUserNotificationList structure (direct)
      if (
        data &&
        typeof data === "object" &&
        "results" in data &&
        Array.isArray(data.results)
      ) {
        return {
          notifications: data.results as UserNotification[],
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
            notifications: responseData as UserNotification[],
            pagination: {
              count: responseData.length,
              next: null,
              previous: null,
            },
          };
        }
        
        // Check if data.data is a PaginatedUserNotificationList object with results
        if (
          responseData &&
          typeof responseData === "object" &&
          "results" in responseData &&
          Array.isArray(responseData.results)
        ) {
          return {
            notifications: responseData.results as UserNotification[],
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
          notifications: data as UserNotification[],
          pagination: {
            count: data.length,
            next: null,
            previous: null,
          },
        };
      }

      // Fallback: return empty array
      return {
        notifications: [],
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
        message: error?.message || "Failed to fetch notifications",
        response_code: error?.response_code || 0,
        data: {},
      });
    }
  },

  /**
   * Mark a notification as read
   *
   * @param notificationId - The ID of the notification to mark as read
   * @returns Promise that resolves when the notification is marked as read
   *
   * Backend Endpoint: PATCH /notifications/{id}/mark-read/
   * Returns 200 OK with no response body
   */
  /**
   * Register FCM device for push notifications
   *
   * @param registrationId - FCM/APNs device token
   * @param type - Device type: "android" | "ios" | "web"
   * @returns Promise that resolves when device is registered
   *
   * Backend Endpoint: POST /devices/
   * Request body: { registration_id: string, type: "android" | "ios" | "web" }
   */
  async registerDevice(
    registrationId: string,
    type: "android" | "ios" | "web"
  ): Promise<void> {
    try {
      const response = await api.post<any>("/devices/", {
        registration_id: registrationId,
        type,
      });

      if (
        !response ||
        response.status === "success" ||
        response.response_code === 201
      ) {
        return;
      }

      throw new ApiClientError({
        status: "error",
        message: response?.message || "Failed to register device",
        response_code: response?.response_code || 500,
        data: response?.data || {},
      });
    } catch (error: any) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to register device",
        response_code: error?.response_code || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },

  /**
   * Unregister FCM device
   *
   * @param registrationId - FCM device registration ID to remove
   *
   * Backend Endpoint: DELETE /devices/{registration_id}/
   */
  async unregisterDevice(registrationId: string): Promise<void> {
    try {
      const encoded = encodeURIComponent(registrationId);
      await api.delete<any>(`/devices/${encoded}/`);
    } catch (error: any) {
      if (error instanceof ApiClientError) throw error;
      throw new ApiClientError({
        status: "error",
        message: error?.message || "Failed to unregister device",
        response_code: error?.response_code || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },

  async markAsRead(notificationId: number): Promise<void> {
    try {
      const response = await api.patch<any>(
        `/notifications/${notificationId}/mark-read/`,
        {}
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
        message: response?.message || "Failed to mark notification as read",
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
        message: error?.message || "Failed to mark notification as read",
        response_code: error?.response_code || error?.response?.status || 500,
        data: error?.response?.data || error?.data || {},
      });
    }
  },
};
