/**
 * Notification Utilities
 *
 * Helper functions for mapping backend notification data to UI format
 */

import React from "react";
import { View } from "react-native";
import { UserNotification } from "../services/notificationService";
import {
  CalendarIcon,
  ProfileIcon,
  BellIcon,
} from "../components/MenuIcons";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Inferred notification type based on backend data
 */
export type NotificationType =
  | "meeting_time_change"
  | "meeting_approved"
  | "meeting_cancelled"
  | "connection"
  | "reminder"
  | "meeting_request"
  | "generic";

/**
 * UI-friendly notification interface
 */
export interface UINotification {
  id: string;
  type: NotificationType;
  icon: React.ReactNode;
  title: string;
  description: string;
  time: string; // Formatted relative time (e.g., "1 hour ago")
  unread: boolean;
  // Optional fields for detail modal
  requester?: {
    name: string;
    role?: string;
    company?: string;
    avatar?: { uri: string };
    tags?: string[];
    interests?: string[];
    socialLabel?: string;
  };
  meetingDetails?: {
    title: string;
    originalTime?: string;
    newTime?: string;
    location?: string;
  };
  reason?: string;
  cancelledBy?: "them" | "you";
  direction?: "inbound" | "outbound";
  // Backend fields for navigation/actions
  route: string | null;
  meeting_id: string | null;
  connection_id: string | null;
  backendNotificationId: number; // Store backend ID for API calls
}

// ============================================================================
// TYPE INFERENCE
// ============================================================================

/**
 * Infer notification type from backend data
 * 
 * NOTE: This is a heuristic approach since backend doesn't provide a 'type' field.
 * We use multiple keyword checks and prioritize meeting_id/connection_id for accuracy.
 * 
 * Production considerations:
 * - If backend adds a 'type' field in the future, replace this function
 * - Monitor logs for cases where type can't be determined (falls back to 'generic')
 * - Consider asking backend team to standardize notification title/description formats
 */
export function inferNotificationType(
  notification: UserNotification
): NotificationType {
  const title = notification.title.toLowerCase();
  const description = notification.description.toLowerCase();
  const combined = `${title} ${description}`.toLowerCase();

  // Priority 1: Check meeting_id (most reliable indicator)
  if (notification.meeting_id) {
    // Check for time change/reschedule (multiple keywords for robustness)
    if (
      combined.includes("time change") ||
      combined.includes("reschedule") ||
      combined.includes("change time") ||
      combined.includes("new time") ||
      title.includes("reschedule")
    ) {
      return "meeting_time_change";
    }
    
    // Check for cancellation (multiple variations)
    if (
      combined.includes("cancelled") ||
      combined.includes("canceled") ||
      combined.includes("cancellation") ||
      title.includes("cancel")
    ) {
      return "meeting_cancelled";
    }
    
    // Check for approval/acceptance
    if (
      combined.includes("approved") ||
      combined.includes("accepted") ||
      combined.includes("accept") ||
      title.includes("approved")
    ) {
      return "meeting_approved";
    }
    
    // Check for meeting request
    if (
      combined.includes("meeting request") ||
      combined.includes("requested a meeting") ||
      title.includes("request")
    ) {
      return "meeting_request";
    }
    
    // Check for reminder
    if (combined.includes("reminder") || title.includes("reminder")) {
      return "reminder";
    }
    
    // Default for meeting notifications (most common case)
    return "meeting_approved";
  }

  // Priority 2: Check connection_id (reliable indicator)
  if (notification.connection_id) {
    return "connection";
  }

  // Priority 3: Check for reminder (even without meeting_id)
  if (combined.includes("reminder") || title.includes("reminder")) {
    return "reminder";
  }

  // Fallback: Generic notification
  // Log in dev mode if we can't determine type
  if (__DEV__) {
    console.warn("⚠️ Could not infer notification type, using 'generic':", {
      id: notification.id,
      title: notification.title,
      description: notification.description.substring(0, 50),
    });
  }
  
  return "generic";
}

// ============================================================================
// ICON GENERATION
// ============================================================================

/**
 * Generate icon component based on notification type
 */
export function getNotificationIcon(type: NotificationType): React.ReactNode {
  switch (type) {
    case "meeting_time_change":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#FFF7ED" }}
        >
          <CalendarIcon size={24} color="#F97316" />
        </View>
      );

    case "meeting_approved":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#F0FDF4" }}
        >
          <CalendarIcon size={24} color="#1BB273" />
        </View>
      );

    case "meeting_cancelled":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#FEF2F2" }}
        >
          <CalendarIcon size={24} color="#EF4444" />
        </View>
      );

    case "meeting_request":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#EDF2FB" }}
        >
          <CalendarIcon size={24} color="#2762C7" />
        </View>
      );

    case "connection":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#EDF2FB" }}
        >
          <ProfileIcon size={24} color="#2762C7" />
        </View>
      );

    case "reminder":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#FFF7ED" }}
        >
          <BellIcon size={24} color="#F97316" />
        </View>
      );

    default:
      // Generic notification icon
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#F5F5F5" }}
        >
          <BellIcon size={24} color="#404040" />
        </View>
      );
  }
}

// ============================================================================
// TIME FORMATTING
// ============================================================================

/**
 * Format ISO timestamp to relative time string
 * Examples: "1 hour ago", "2 days ago", "Just now"
 */
export function formatRelativeTime(timestamp: string): string {
  const now = new Date();
  const notificationTime = new Date(timestamp);

  // Check if timestamp is valid
  if (isNaN(notificationTime.getTime())) {
    return "Recently";
  }

  const diffInMs = now.getTime() - notificationTime.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  } else {
    // For older notifications, show date
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const day = notificationTime.getDate();
    const month = monthNames[notificationTime.getMonth()];
    const year = notificationTime.getFullYear();
    const currentYear = now.getFullYear();

    if (year === currentYear) {
      return `${month} ${day}`;
    } else {
      return `${month} ${day}, ${year}`;
    }
  }
}

// ============================================================================
// MAIN MAPPING FUNCTION
// ============================================================================

/**
 * Map backend UserNotification to UI-friendly format
 */
export function mapBackendNotificationToUI(
  notification: UserNotification,
  currentUserId?: string
): UINotification {
  const type = inferNotificationType(notification);
  const icon = getNotificationIcon(type);
  const time = formatRelativeTime(notification.timestamp);

  // Determine direction for meeting notifications
  // This is a best guess - backend doesn't provide this directly
  let direction: "inbound" | "outbound" | undefined;
  if (notification.meeting_id) {
    // Try to infer from title/description
    const title = notification.title.toLowerCase();
    const description = notification.description.toLowerCase();
    if (
      description.includes("you approved") ||
      description.includes("you accepted")
    ) {
      direction = "inbound";
    } else if (
      description.includes("approved your") ||
      description.includes("accepted your")
    ) {
      direction = "outbound";
    }
  }

  return {
    id: `notification-${notification.id}`,
    type,
    icon,
    title: notification.title,
    description: notification.description,
    time,
    unread: !notification.is_read,
    route: notification.route,
    meeting_id: notification.meeting_id,
    connection_id: notification.connection_id,
    backendNotificationId: notification.id,
    direction,
    // requester, meetingDetails, reason will be populated
    // when fetchNotificationDetails() is called (when detail modal opens)
  };
}

/**
 * Fetch additional details for a notification
 * 
 * PRODUCTION APPROACH: Lazy Loading (Option A)
 * - Called when user opens the notification detail modal
 * - Benefits: Faster initial load, fewer API calls, better performance
 * - Industry standard: Gmail, Slack, LinkedIn all use this approach
 * 
 * @param notification - The UI notification that needs details
 * @param currentUserId - Current user ID to determine requester vs requestee
 * @returns Promise that resolves with enriched notification data
 */
export async function fetchNotificationDetails(
  notification: UINotification,
  currentUserId?: string
): Promise<UINotification> {
  // If notification already has details, return as-is
  if (notification.requester || notification.meetingDetails) {
    return notification;
  }

  // Fetch meeting details if meeting_id exists
  if (notification.meeting_id) {
    try {
      const { meetingService } = await import("../services/meetingService");
      const meetings = await meetingService.getMeetings();
      const meetingDetail = meetings.find(
        (m) => m.id.toString() === notification.meeting_id
      );

      if (meetingDetail) {
        // Determine if current user is requester or requestee
        const isRequester = meetingDetail.requester === currentUserId;
        const otherUser = isRequester
          ? meetingDetail.requestee_info
          : meetingDetail.requester_info;
        const otherCompany = isRequester
          ? meetingDetail.requestee_company
          : meetingDetail.requester_company;

        // Extract requester info with tags, interests, LinkedIn
        const tags: string[] = [];
        if (otherUser.country) {
          tags.push(otherUser.country);
        }
        const sector =
          otherCompany?.company_type ||
          otherUser.metadata?.sector ||
          otherUser.metadata?.industry;
        if (sector) {
          tags.push(sector);
        }
        if (otherUser.job_title) {
          tags.push(otherUser.job_title);
        }

        const interests = otherUser.metadata?.interests || [];
        
        const linkedInUrl =
          otherUser.metadata?.linkedIn || otherUser.metadata?.linkedin_url;
        const socialLabel = linkedInUrl
          ? linkedInUrl.replace("https://www.linkedin.com/in/", "").replace("/", "")
          : undefined;

        const requester = {
          name: `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim() || otherUser.email,
          role: otherUser.job_title || undefined,
          company: otherUser.organisation || otherCompany?.name || undefined,
          avatar: otherUser.profile_pic ? { uri: otherUser.profile_pic } : undefined,
          tags,
          interests,
          socialLabel,
        };

        // Format meeting time
        const formatTime = (timeStr: string): string => {
          const [hours, minutes] = timeStr.split(':').map(Number);
          const period = hours >= 12 ? 'PM' : 'AM';
          const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
          return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
        };

        // Extract meeting details
        const meetingDetails = {
          title: meetingDetail.reason,
          originalTime: `${formatTime(meetingDetail.slot.start_time)} - ${formatTime(meetingDetail.slot.end_time)}`,
          location: meetingDetail.location || undefined,
        };

        // For time change notifications, we'd need to check metadata or fetch update history
        // For now, we'll use the current slot time
        // TODO: If backend provides new_time in metadata, use that for newTime

        return {
          ...notification,
          requester,
          meetingDetails,
          reason: notification.description, // Use description as reason for now
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error fetching meeting details for notification:", error);
      }
    }
  }

  // Fetch connection details if connection_id exists
  if (notification.connection_id) {
    try {
      const { connectionService } = await import("../services/connectionService");
      const response = await connectionService.getConnections(1, 100);
      const connection = response.connections.find(
        (c) => c.id.toString() === notification.connection_id
      );

      if (connection) {
        // Determine which user to show (from_user vs to_user)
        // For now, show to_user (the person you connected with)
        const connectionUser = connection.to_user;
        // Extract tags, interests, LinkedIn for connection notifications
        const tags: string[] = [];
        if (connectionUser.country) {
          tags.push(connectionUser.country);
        }
        const sector =
          connectionUser.metadata?.sector ||
          connectionUser.metadata?.industry;
        if (sector) {
          tags.push(sector);
        }
        if (connectionUser.job_title) {
          tags.push(connectionUser.job_title);
        }

        const interests = connectionUser.metadata?.interests || [];
        
        const linkedInUrl =
          connectionUser.metadata?.linkedIn || connectionUser.metadata?.linkedin_url;
        const socialLabel = linkedInUrl
          ? linkedInUrl.replace("https://www.linkedin.com/in/", "").replace("/", "")
          : undefined;

        const requester = {
          name: `${connectionUser.first_name || ""} ${connectionUser.last_name || ""}`.trim() || connectionUser.email,
          role: connectionUser.job_title || undefined,
          company: connectionUser.organisation || undefined,
          avatar: connectionUser.profile_pic ? { uri: connectionUser.profile_pic } : undefined,
          tags,
          interests,
          socialLabel,
        };

        return {
          ...notification,
          requester,
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error fetching connection details for notification:", error);
      }
    }
  }

  return notification;
}
