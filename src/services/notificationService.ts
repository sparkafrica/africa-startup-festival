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

      if (__DEV__) {
        console.log("🔔 Raw notifications response:", {
          hasData: !!data,
          dataType: typeof data,
          keys: data ? Object.keys(data) : [],
          hasResults: data?.results !== undefined,
          hasDataResults: data?.data?.results !== undefined,
          resultsLength: data?.results?.length || data?.data?.results?.length || data?.data?.length || 0,
          status: data?.status,
          message: data?.message,
          response_code: data?.response_code,
          dataIsArray: Array.isArray(data?.data),
          dataLength: Array.isArray(data?.data) ? data.data.length : 'N/A',
          fullResponsePreview: JSON.stringify(data, null, 2).substring(0, 500),
        });
      }

      // Check if response has the PaginatedUserNotificationList structure (direct)
      if (
        data &&
        typeof data === "object" &&
        "results" in data &&
        Array.isArray(data.results)
      ) {
        if (__DEV__) {
          console.log("✅ Found direct PaginatedUserNotificationList structure");
        }
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
          if (__DEV__) {
            console.log("✅ Found array directly in data.data (ApiResponse format)");
          }
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
          if (__DEV__) {
            console.log("✅ Found ApiResponse wrapped PaginatedUserNotificationList structure");
          }
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
        if (__DEV__) {
          console.log("✅ Found array directly in response");
        }
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
      if (__DEV__) {
        console.warn("⚠️ Could not parse notifications response, returning empty array");
      }
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
