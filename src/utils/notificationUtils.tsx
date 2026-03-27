/**
 * Notification Utilities
 *
 * Helper functions for mapping backend notification data to UI format
 */

import React from "react";
import { View } from "react-native";
import { getLinkedInDisplayInfo } from "./linkedInUtils";
import { UserNotification } from "../services/notificationService";
import { CalendarIcon, ProfileIcon, TicketsIcon } from "../components/MenuIcons";
import { BellIcon } from "../components/HeaderIcons";

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
  | "connection_request"   // Inbound: A wants to connect with B
  | "connection_accepted"  // B accepted A's connection request
  | "ticket_allocation_accepted"
  | "ticket_allocation_declined"
  | "reminder"
  | "meeting_request"
  | "meeting_request_sent"
  | "chat_message"
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
    socialLabel?: string; // Display label for LinkedIn pill (e.g. username)
    linkedInUrl?: string; // Full URL for opening profile
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
  /** Chat: from API or parsed route `.../events/{id}/conversations/{id}` */
  conversation_id: string | null;
  event_id: string | null;
  /** Display name for Messages → Conversation when opening from notification list */
  chatOtherPartyName?: string;
  backendNotificationId: number; // Store backend ID for API calls
}

// ============================================================================
// ROUTE / CHAT HELPERS
// ============================================================================

export function parseEventConversationFromRoute(route: string | null): {
  eventId: string | null;
  conversationId: string | null;
} {
  if (!route) return { eventId: null, conversationId: null };
  const normalized = route.replace(/^\/+/, "");
  const m = normalized.match(/events\/(\d+)\/conversations\/(\d+)/i);
  if (m) return { eventId: m[1], conversationId: m[2] };
  return { eventId: null, conversationId: null };
}

/** Parse sender label from titles like "New Message from Jane Doe". */
export function extractChatOtherPartyName(title: string): string {
  const m = title.match(/new message from\s+(.+)/i);
  if (m?.[1]) return m[1].trim();
  return "Chat";
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
  notification: UserNotification,
): NotificationType {
  const title = notification.title.toLowerCase();
  const description = notification.description.toLowerCase();
  const combined = `${title} ${description}`.toLowerCase();

  const routeLower = (notification.route || "").toLowerCase();
  const ntype = (notification.notification_type || "").toLowerCase();
  const fromRoute = parseEventConversationFromRoute(notification.route);

  // Chat / DM — before generic and before broad "accepted/approved" meeting heuristics
  if (
    ntype.includes("chat") ||
    routeLower.includes("conversation") ||
    Boolean(fromRoute.conversationId) ||
    /\bnew message\b/.test(title) ||
    /\bnew message\b/.test(description)
  ) {
    return "chat_message";
  }

  // Priority 0: Keyword-based inference (works even without meeting_id)
  // Backend titles: "Meeting Request Updated", "Meeting Cancelled", "Meeting Accepted", etc.
  if (
    combined.includes("cancelled") ||
    combined.includes("canceled") ||
    title.includes("cancel")
  ) {
    return "meeting_cancelled";
  }
  // Ticket allocation accepted/declined (before meeting_approved)
  if (
    combined.includes("ticket allocation") ||
    (combined.includes("allocation") && combined.includes("ticket"))
  ) {
    if (
      combined.includes("declined") ||
      combined.includes("rejected")
    ) {
      return "ticket_allocation_declined";
    }
    if (
      combined.includes("accepted") ||
      combined.includes("approved")
    ) {
      return "ticket_allocation_accepted";
    }
  }
  // Connection accepted (before meeting_approved - "accepted your connection" != meeting)
  if (
    (combined.includes("accepted your connection") ||
      combined.includes("connection request accepted") ||
      (combined.includes("accepted") && combined.includes("connection"))) &&
    !combined.includes("meeting")
  ) {
    return "connection_accepted";
  }
  if (
    combined.includes("approved") ||
    combined.includes("accepted") ||
    title.includes("accepted") ||
    title.includes("approved")
  ) {
    return "meeting_approved";
  }
  if (
    combined.includes("time change") ||
    combined.includes("reschedule") ||
    combined.includes("updated") ||
    combined.includes("change time") ||
    title.includes("updated") ||
    title.includes("reschedule")
  ) {
    return "meeting_time_change";
  }
  if (
    combined.includes("sent to") ||
    combined.includes("has been sent") ||
    description.includes("has been sent")
  ) {
    return "meeting_request_sent";
  }
  if (
    combined.includes("meeting request") ||
    combined.includes("requested a meeting") ||
    title.includes("meeting request")
  ) {
    return "meeting_request";
  }

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

  // Priority 2: Check connection_id – differentiate request vs accepted
  if (notification.connection_id) {
    if (
      combined.includes("accepted your connection") ||
      combined.includes("connection request accepted") ||
      (combined.includes("accepted") && combined.includes("connection") && !combined.includes("meeting"))
    ) {
      return "connection_accepted";
    }
    return "connection_request";
  }

  // Priority 3: Check for reminder (even without meeting_id)
  if (combined.includes("reminder") || title.includes("reminder")) {
    return "reminder";
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
    case "meeting_request_sent":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#EDF2FB" }}
        >
          <CalendarIcon size={24} color="#2762C7" />
        </View>
      );

    case "connection":
    case "connection_request":
    case "connection_accepted":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#EDF2FB" }}
        >
          <ProfileIcon size={24} color="#2762C7" />
        </View>
      );

    case "ticket_allocation_accepted":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#F0FDF4" }}
        >
          <TicketsIcon size={24} color="#1BB273" />
        </View>
      );

    case "ticket_allocation_declined":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#FEF2F2" }}
        >
          <TicketsIcon size={24} color="#EF4444" />
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

    case "chat_message":
      return (
        <View
          className="w-12 h-12 rounded-lg items-center justify-center"
          style={{ backgroundColor: "#ECFDF5" }}
        >
          <BellIcon size={24} color="#1BB273" />
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
  currentUserId?: string,
): UINotification {
  const type = inferNotificationType(notification);
  const icon = getNotificationIcon(type);
  const time = formatRelativeTime(notification.timestamp);
  const fromRoute = parseEventConversationFromRoute(notification.route);
  const conversation_id =
    notification.conversation_id ?? fromRoute.conversationId;
  const event_id = notification.event_id ?? fromRoute.eventId;
  const chatOtherPartyName =
    type === "chat_message"
      ? (notification.other_party_name?.trim() ||
          extractChatOtherPartyName(notification.title))
      : undefined;

  // Determine direction for meeting notifications
  // Use direction so requester → Outbound, requestee → Inbound (per item 4)
  let direction: "inbound" | "outbound" | undefined;
  if (notification.meeting_id) {
    const description = notification.description.toLowerCase();
    // You approved/accepted = you are the requestee (inbound)
    if (
      description.includes("you approved") ||
      description.includes("you accepted")
    ) {
      direction = "inbound";
    } else if (
      description.includes("approved your") ||
      description.includes("accepted your") ||
      // "Your meeting request has been accepted" = requester (outbound)
      (description.includes("your") &&
        (description.includes("accepted") || description.includes("approved")))
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
    conversation_id,
    event_id,
    chatOtherPartyName,
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
  currentUserId?: string,
): Promise<UINotification> {
  // If notification already has details, return as-is
  if (notification.requester || notification.meetingDetails) {
    return notification;
  }

  // Fetch meeting details if meeting_id exists
  // Search both physical and virtual meetings (Item 6: fix inbound/outbound metadata)
  if (notification.meeting_id) {
    try {
      const { meetingService } = await import("../services/meetingService");
      const [physicalMeetings, virtualMeetings] = await Promise.all([
        meetingService.getMeetings(),
        meetingService.getVirtualMeetings(),
      ]);

      const formatTime = (timeStr: string): string => {
        const [hours, minutes] = timeStr.split(":").map(Number);
        const period = hours >= 12 ? "PM" : "AM";
        const displayHours =
          hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
        return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
      };

      // Build requester + meetingDetails from otherUser/otherCompany (shared logic)
      const buildRequesterAndDetails = (
        otherUser: { first_name?: string; last_name?: string; email: string; country?: string; job_title?: string; organisation?: string | null; profile_pic?: string | null; metadata?: any },
        otherCompany: { name?: string; company_type?: string } | null,
        title: string,
        originalTime: string,
        location?: string | null,
      ) => {
        const tags: string[] = [];
        if (otherUser?.country) tags.push(otherUser.country);
        const sector =
          otherCompany?.company_type ||
          otherUser?.metadata?.sector ||
          otherUser?.metadata?.industry;
        if (sector) tags.push(sector);
        if (otherUser?.job_title) tags.push(otherUser.job_title);

        const interests = otherUser?.metadata?.interests || [];
        // Align with MeetingsScreen: check linkedIn, linkedin_url, linkedin (Item 6)
        const linkedInRaw =
          otherUser?.metadata?.linkedIn ||
          otherUser?.metadata?.linkedin_url ||
          otherUser?.metadata?.linkedin;
        const linkedInInfo = getLinkedInDisplayInfo(linkedInRaw);
        const requester = {
          name:
            `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim() ||
            otherUser?.email ||
            "Unknown",
          role: otherUser?.job_title || undefined,
          company: otherUser?.organisation || otherCompany?.name || undefined,
          avatar: otherUser?.profile_pic
            ? { uri: otherUser.profile_pic }
            : undefined,
          tags,
          interests,
          socialLabel: linkedInInfo?.displayLabel,
          linkedInUrl: linkedInInfo?.url,
        };
        const meetingDetails = { title, originalTime, location: location || undefined };
        return { requester, meetingDetails };
      };

      const mid = notification.meeting_id;

      // 1) Try physical meeting first
      const physicalMatch = physicalMeetings.find(
        (m) => String(m.id) === mid,
      );
      if (physicalMatch) {
        const isRequester = String(physicalMatch.requester) === String(currentUserId);
        const otherUser = isRequester
          ? physicalMatch.requestee_info
          : physicalMatch.requester_info;
        const otherCompany = isRequester
          ? physicalMatch.requestee_company
          : physicalMatch.requester_company;
        const slot = physicalMatch.slot;
        const originalTime = slot?.start_time && slot?.end_time
          ? `${formatTime(slot.start_time)} - ${formatTime(slot.end_time)}`
          : "—";
        const title =
          physicalMatch.metadata?.title ||
          (physicalMatch as any).title ||
          physicalMatch.reason;
        const { requester, meetingDetails } = buildRequesterAndDetails(
          otherUser ?? { email: "Unknown" },
          otherCompany,
          title,
          originalTime,
          physicalMatch.location,
        );
        return { ...notification, requester, meetingDetails, reason: notification.description };
      }

      // 2) Try virtual meeting
      const virtualMatch = virtualMeetings.find(
        (m) => String(m.id) === mid,
      );
      if (virtualMatch) {
        const isRequester = String(virtualMatch.requester) === String(currentUserId);
        const otherUser = isRequester
          ? virtualMatch.requestee_info
          : virtualMatch.requester_info;
        const otherCompany = isRequester
          ? virtualMatch.requestee_company
          : virtualMatch.requester_company;
        const startTime = virtualMatch.scheduled_time;
        const durationMinutes = virtualMatch.duration_minutes ?? 20;
        const [h, min] = virtualMatch.scheduled_time.split(":").map(Number);
        const endDate = new Date(2000, 0, 1, h, min, 0);
        endDate.setMinutes(endDate.getMinutes() + durationMinutes);
        const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}:00`;
        const originalTime = `${formatTime(startTime)} - ${formatTime(endTime)}`;
        const title =
          virtualMatch.metadata?.title ||
          (virtualMatch as any).title ||
          virtualMatch.reason;
        const { requester, meetingDetails } = buildRequesterAndDetails(
          otherUser ?? { email: "Unknown" },
          otherCompany,
          title,
          originalTime,
          undefined,
        );
        return { ...notification, requester, meetingDetails, reason: notification.description };
      }
    } catch (error) {
      if (__DEV__) {
        console.error(
          "Error fetching meeting details for notification:",
          error,
        );
      }
    }
  }

  // Fetch connection details if connection_id exists
  if (notification.connection_id) {
    try {
      const { connectionService } =
        await import("../services/connectionService");
      const response = await connectionService.getConnections(1, 100);
      const connection = response.connections.find(
        (c) => c.id.toString() === notification.connection_id,
      );

      if (connection) {
        // connection_request: A wants to connect with B → show A (from_user)
        // connection_accepted: B accepted A's request → show B (to_user)
        const connectionUser =
          notification.type === "connection_request"
            ? connection.from_user
            : connection.to_user;
        // Extract tags, interests, LinkedIn for connection notifications
        const tags: string[] = [];
        if (connectionUser.country) {
          tags.push(connectionUser.country);
        }
        const sector =
          connectionUser.metadata?.sector || connectionUser.metadata?.industry;
        if (sector) {
          tags.push(sector);
        }
        if (connectionUser.job_title) {
          tags.push(connectionUser.job_title);
        }

        const interests = connectionUser.metadata?.interests || [];

        const linkedInRaw =
          connectionUser.metadata?.linkedIn ||
          connectionUser.metadata?.linkedin_url;
        const linkedInInfo = getLinkedInDisplayInfo(linkedInRaw);
        const socialLabel = linkedInInfo?.displayLabel;
        const linkedInUrl = linkedInInfo?.url;

        const requester = {
          name:
            `${connectionUser.first_name || ""} ${connectionUser.last_name || ""}`.trim() ||
            connectionUser.email,
          role: connectionUser.job_title || undefined,
          company: connectionUser.organisation || undefined,
          avatar: connectionUser.profile_pic
            ? { uri: connectionUser.profile_pic }
            : undefined,
          tags,
          interests,
          socialLabel,
          linkedInUrl,
        };

        return {
          ...notification,
          requester,
        };
      }
    } catch (error) {
      if (__DEV__) {
        console.error(
          "Error fetching connection details for notification:",
          error,
        );
      }
    }
  }

  return notification;
}
