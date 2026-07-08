import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  Animated,
  PanResponder,
  Image,
  RefreshControl,
  Linking,
  Alert,
} from "react-native";
import {
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import {
  HeaderBar,
  LoadingSpinner,
  SkeletonListRows,
  RequestMeetingModal,
  FLOATING_NAV_BOTTOM_INSET,
} from "../components";
import ConnectionsExportBanner from "../components/ConnectionsExportBanner";
import {
  getCanUserBookMeetings,
  showExpoCannotBookMeetingAlert,
} from "../utils/meetingRestrictions";
import { trackMeetingEvent, trackConnectionEvent } from "../utils/analytics";
import {
  coerceMetadataLabel,
  coerceMetadataStringArray,
} from "../utils/metadataCoerce";
import { SearchIcon, ChevronRightIcon, SpeechBubbleIcon } from "../components/icons";
import { LinkedInIcon, CalendarIconWhite } from "../components/SocialIcons";
import { getLinkedInDisplayInfo } from "../utils/linkedInUtils";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import type { MeetingFormData } from "../components";
import Svg, { Circle, Path } from "react-native-svg";
import { useAuth } from "../context/AuthContext";
import { useMeetingsBadgeContext } from "../context/MeetingsBadgeContext";
import { useChecklist } from "../context/ChecklistContext";
import { useNotifications } from "../context/NotificationsContext";
import { connectionService, type Connection as BackendConnection } from "../services/connectionService";
import { meetingService } from "../services/meetingService";
import { ApiClientError } from "../services/api";
import {
  markConnectionsFetched,
  shouldRefetchConnectionsOnFocus,
} from "../utils/eventDataCache";
import { useChat } from "../context/ChatContext";
import { useFloatingNavVisibility } from "../context/FloatingNavVisibilityContext";
import { useToast } from "../hooks/useToast";
import { useListRowHighlight } from "../hooks/useListRowHighlight";
import ListRowHighlightOverlay from "../components/ListRowHighlightOverlay";
import { resolveConnectionById } from "../services/deepLinkResolveService";
import {
  useMessagesBadgeCount,
  useRefreshMessagesBadgeOnFocus,
} from "../hooks";
import Toast from "../components/Toast";
import { EVENT_ID } from "../config/env";
import { isPostEventMode } from "../config/eventMode";

// Person Icon Component (for profile placeholder)
function PersonIcon({
  size = 24,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="8"
        r="4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface ConnectionTag {
  label: string;
  borderColor: string; // e.g., "#ADD8E6" for light blue, "#90EE90" for light green
}

interface SpeakingSession {
  title: string;
  location: string;
  time: string;
}

/**
 * UI-friendly Connection interface
 * Mapped from backend Connection for display purposes
 */
interface Connection {
  id: string; // Backend connection ID as string
  backendConnectionId: number; // Original backend ID for API calls
  userId: string; // The other user's ID (stringified)
  name: string;
  title?: string;
  company?: string;
  avatar?: string | number;
  tags?: ConnectionTag[];
  about?: string;
  interests?: string[];
  speakingSessions?: SpeakingSession[];
  linkedInUrl?: string;
  isSpeaker?: boolean; // Only speakers have speaking sessions
  status: "pending" | "accepted" | "rejected" | "blocked";
  isFromCurrentUser: boolean; // Whether the current user sent the request
}

/** Remote URI for Conversation header (matches inbox / attendees). */
function getConnectionProfilePicUri(connection: Connection): string | undefined {
  const a = connection.avatar;
  if (typeof a === "string" && a.trim()) return a.trim();
  return undefined;
}

// Connection Card Component
interface ConnectionCardProps {
  connection: Connection;
  onPress?: () => void;
}

function ConnectionCard({ connection, onPress }: ConnectionCardProps) {
  // Status indicator colors and text
  const getStatusIndicator = () => {
    switch (connection.status) {
      case "pending":
        return {
          color: "#F59E0B", // Orange/amber for pending
          text: connection.isFromCurrentUser ? "Sent" : "Pending",
          bgColor: "#FEF3C7", // Light amber background
        };
      case "accepted":
        return {
          color: "#10B981", // Green for accepted
          text: "Connected",
          bgColor: "#D1FAE5", // Light green background
        };
      case "rejected":
        return {
          color: "#EF4444", // Red for rejected
          text: "Declined",
          bgColor: "#FEE2E2", // Light red background
        };
      case "blocked":
        return {
          color: "#6B7280", // Gray for blocked
          text: "Blocked",
          bgColor: "#F3F4F6", // Light gray background
        };
      default:
        return null;
    }
  };

  const statusIndicator = getStatusIndicator();

  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="flex-row items-center p-4">
        {/* Profile Picture - Circular */}
        <View className="w-14 h-14 rounded-full bg-neutral-100 items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
          {connection.avatar && typeof connection.avatar === "string" ? (
            <Image
              source={{ uri: connection.avatar }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <PersonIcon size={28} color="#000000" />
          )}
        </View>

        {/* Name and Title/Company - Stacked vertically */}
        <View className="flex-1">
          {/* Name - Bold and prominent */}
          <View className="flex-row items-center mb-0.5">
            <Text
              className="text-base font-bold text-neutral-900 flex-1"
              numberOfLines={1}
            >
              {connection.name}
            </Text>
            {/* Status Indicator */}
            {statusIndicator && (
              <View
                className="px-2 py-0.5 rounded-full ml-2"
                style={{ backgroundColor: statusIndicator.bgColor }}
              >
                <Text
                  className="text-xs font-medium"
                  style={{ color: statusIndicator.color }}
                >
                  {statusIndicator.text}
                </Text>
              </View>
            )}
          </View>

          {/* Title and Company - Lighter text */}
          <Text className="text-sm text-neutral-600" numberOfLines={1}>
            {connection.title && connection.company
              ? `${connection.title} · ${connection.company}`
              : connection.title || connection.company || ""}
          </Text>
        </View>

        {/* Right Arrow Icon */}
        <View className="ml-2">
          <ChevronRightIcon size={20} color="#A3A3A3" />
        </View>
      </View>
    </Pressable>
  );
}

export default function ConnectionsScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Connections">>();
  const route = useRoute<RouteProp<RootStackParamList, "Connections">>();
  const flatListRef = useRef<FlatList<Connection>>(null);
  const listHighlight = useListRowHighlight<number>();
  const { clearHighlight } = listHighlight;
  const messagesBadgeCount = useMessagesBadgeCount();
  useRefreshMessagesBadgeOnFocus();
  const { refresh: refreshMeetingsBadge } = useMeetingsBadgeContext();
  const { hasUnreadNotifications } = useNotifications();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const { markRequestMeetingComplete, markConnectAttendeesComplete } = useChecklist();
  const { getOrCreateConversation } = useChat();
  const insets = useSafeAreaInsets();

  // Search state (commented out for now)
  // const [searchQuery, setSearchQuery] = useState("");
  
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const { setFloatingNavSuppressed } = useFloatingNavVisibility();

  useEffect(() => {
    const detailOpen = showBottomSheet && selectedConnection != null;
    setFloatingNavSuppressed(detailOpen);
    return () => setFloatingNavSuppressed(false);
  }, [showBottomSheet, selectedConnection, setFloatingNavSuppressed]);

  const [isRequestMeetingModalVisible, setIsRequestMeetingModalVisible] =
    useState(false);
  const [meetingConnection, setMeetingConnection] = useState<Connection | null>(
    null
  );
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const isProcessingActionRef = useRef(false);
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);
  const [isOpeningChat, setIsOpeningChat] = useState(false);
  const [isExportingConnections, setIsExportingConnections] = useState(false);

  // Fresh connection detail fetched when opening sheet (so metadata is up-to-date without other user re-saving)
  const [connectionDetail, setConnectionDetail] = useState<Connection | null>(null);
  const [connectionDetailLoading, setConnectionDetailLoading] = useState(false);
  const detailFetchConnectionIdRef = useRef<number | null>(null);

  // Bottom sheet animation values
  const bottomSheetTranslateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const bottomSheetDragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);

  // Close bottom sheet with animation (defined early so handlers can reference it)
  const closeBottomSheet = useCallback(() => {
    setFloatingNavSuppressed(false);
    detailFetchConnectionIdRef.current = null;
    Animated.parallel([
      Animated.spring(bottomSheetTranslateY, {
        toValue: 1000,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowBottomSheet(false);
      setSelectedConnection(null);
      setConnectionDetail(null);
    });
  }, [setFloatingNavSuppressed]);

  /**
   * Map backend Connection to UI-friendly Connection.
   * Backend may send metadata as a JSON string (per schema); we parse it so interests, bio, industry, etc. work.
   */
  const mapBackendConnectionToUI = (
    backendConnection: BackendConnection
  ): Connection => {
    // Determine which user to display (the other user, not the current user)
    const currentUserId = user?.user_id != null ? String(user.user_id) : null;
    const fromId = String(backendConnection.from_user.id);
    const otherUser =
      currentUserId && fromId === currentUserId
        ? backendConnection.to_user
        : backendConnection.from_user;
    const isFromCurrentUser = currentUserId ? fromId === currentUserId : false;
    const otherUserId =
      otherUser && otherUser.id !== undefined && otherUser.id !== null
        ? otherUser.id.toString()
        : "";

    // Backend schema types metadata as string (JSON); normalize to object so we can read interests, bio, industry, etc.
    const rawMeta = otherUser?.metadata;
    const metadata =
      typeof rawMeta === "string"
        ? (() => {
            try {
              return rawMeta ? JSON.parse(rawMeta) : {};
            } catch {
              return {};
            }
          })()
        : (typeof rawMeta === "object" && rawMeta !== null ? rawMeta : {});

    // Interests may be strings or `{ label, value }` from registration forms.
    const interestsArray = coerceMetadataStringArray(metadata.interests);

    // Extract bio from metadata
    const bio = metadata.bio || "";

    // Extract LinkedIn URL from metadata
    const linkedInUrl = metadata.linkedIn || metadata.linkedin_url || undefined;

    // Build tags — industry/sector only (country omitted from cards; interests shown separately)
    const tags: ConnectionTag[] = [];
    const sector = coerceMetadataLabel(
      (otherUser as any).company?.company_sector ||
        metadata.sector ||
        metadata.industry
    );
    if (sector) {
      tags.push({ label: sector, borderColor: "#ADD8E6" });
    }
    // Note: Interests are displayed separately in the Interests section, not as tags

    // Extract company name - check company.name first (like participant cards), then fall back to organisation
    const companyName =
      (otherUser as any).company?.name ||
      (otherUser as any).company?.company_name ||
      otherUser.organisation ||
      undefined;

    return {
      id: backendConnection.id.toString(),
      backendConnectionId: backendConnection.id,
      userId: otherUserId,
      name: `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim() || otherUser.email,
      title: otherUser.job_title || undefined,
      company: companyName,
      avatar: otherUser.profile_pic || undefined,
      tags: tags.length > 0 ? tags : undefined,
      about: bio || undefined,
      interests: interestsArray.length > 0 ? interestsArray : undefined,
      linkedInUrl,
      isSpeaker: false, // TODO: Determine from backend data if needed
      status: backendConnection.status,
      isFromCurrentUser,
    };
  };

  /**
   * Fetch connections from backend.
   * We need the current user id to pick the correct "other" user in each connection
   * (from_user vs to_user). Without it we can show the wrong profile (e.g. only "Nigeria"
   * for new users whose own profile is minimal until they save).
   */
  const fetchConnections = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await connectionService.getConnections(1, 50);
      const currentUserId = user?.user_id != null ? String(user.user_id) : null;
      if (!currentUserId) {
        setConnections([]);
        return;
      }
      const mappedConnections = response.connections.map(mapBackendConnectionToUI);
      setConnections(mappedConnections);
      markConnectionsFetched();
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load connections. Please try again.";
      setError(errorMessage);
      showToast(errorMessage, "error");
      if (__DEV__) {
        console.error("Error fetching connections:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id, showToast]);

  const connectionsCountRef = useRef(0);
  useEffect(() => {
    connectionsCountRef.current = connections.length;
  }, [connections.length]);

  useFocusEffect(
    useCallback(() => {
      refreshMeetingsBadge();
      if (shouldRefetchConnectionsOnFocus(connectionsCountRef.current > 0)) {
        fetchConnections();
      }
    }, [fetchConnections, refreshMeetingsBadge]),
  );

  // Refetch when current user becomes available (e.g. auth restore from storage).
  // Avoids showing wrong/missing connection details for new users until profile is loaded.
  useEffect(() => {
    if (user?.user_id) {
      fetchConnections();
    }
  }, [user?.user_id, fetchConnections]);

  // Filter connections based on search query (commented out for now)
  // const filteredConnections = connections.filter((connection) => {
  //   if (!searchQuery.trim()) return true;
  //   const query = searchQuery.toLowerCase();
  //   return (
  //     connection.name.toLowerCase().includes(query) ||
  //     connection.title?.toLowerCase().includes(query) ||
  //     connection.company?.toLowerCase().includes(query)
  //   );
  // });
  const filteredConnections = connections;
  const postEventMode = isPostEventMode();

  const handleDownloadConnections = useCallback(async () => {
    if (isExportingConnections) return;
    setIsExportingConnections(true);
    try {
      const { url, count } = await connectionService.exportConnections(EVENT_ID);
      if (count === 0) {
        showToast("No accepted connections to export yet.", "error");
        return;
      }
      await Linking.openURL(url);
      showToast(
        `Opening CSV export (${count} connection${count === 1 ? "" : "s"})…`,
        "success",
      );
    } catch (err: unknown) {
      const message =
        err instanceof ApiClientError
          ? err.message
          : "Could not download connections. Please try again.";
      showToast(message, "error");
    } finally {
      setIsExportingConnections(false);
    }
  }, [isExportingConnections, showToast]);

  /**
   * Handle meeting request submission
   */
  const handleMeetingRequestSubmit = useCallback(
    async (data: MeetingFormData) => {
      if (!meetingConnection || !user?.user_id) {
        showToast("Unable to send meeting request", "error");
        return;
      }

      if (isPostEventMode() && data.meetingType === "Physical") {
        showToast(
          "Africa Startup Festival has ended — only virtual meetings are available via your connections.",
          "error",
        );
        return;
      }

      // Validate required fields based on meeting type
      if (data.meetingType === "Physical") {
        if (!data.meeting_slot_id) {
          showToast(
            "Please select a valid date, time, and table for the meeting",
            "error"
          );
          return;
        }
      } else if (data.meetingType === "Virtual") {
        if (!data.meetingLink) {
          showToast("Please provide a meeting link", "error");
          return;
        }
        if (!data.date || !data.time) {
          showToast(
            "Please select a date and time for the virtual meeting",
            "error"
          );
          return;
        }
      }

      try {
        setIsSubmittingMeeting(true);

        await meetingService.submitMeetingRequestFromForm(
          EVENT_ID,
          data,
          meetingConnection.userId
        );

        void trackMeetingEvent("request_submitted", {
          source: "connections_screen",
        });
        markRequestMeetingComplete();
        showToast("Meeting request sent successfully!", "success");
        setIsRequestMeetingModalVisible(false);
        setMeetingConnection(null);
      } catch (error: any) {
        if (__DEV__) {
          console.error("Error submitting meeting request:", error);
        }

        // Show error message with better handling for specific errors
        let errorMessage = "Failed to send meeting request. Please try again.";
        
        if (error instanceof ApiClientError) {
          // Check for 404 errors (endpoint not found)
          if (error.responseCode === 404) {
            if (data.meetingType === "Virtual") {
              errorMessage = "Virtual meeting endpoint not found. The backend may not have deployed this feature yet. Please contact support or try again later.";
            } else {
              errorMessage = "Meeting request endpoint not found. Please contact support.";
            }
          }
          // Check for virtual meeting validation errors
          else if (data.meetingType === "Virtual") {
            // Check for non_field_errors FIRST (could be at different nesting levels)
            const nonFieldErrors = 
              error.data?.non_field_errors || 
              error.data?.data?.non_field_errors || 
              error.data?.data?.data?.non_field_errors;
            
            // Check if this is a duplicate/pending meeting error
            const isDuplicateError = 
              nonFieldErrors && (
                (Array.isArray(nonFieldErrors) && nonFieldErrors.some(msg => 
                  typeof msg === "string" && (
                    msg.toLowerCase().includes("pending") ||
                    msg.toLowerCase().includes("already") ||
                    msg.toLowerCase().includes("duplicate") ||
                    msg.toLowerCase().includes("conflict")
                  )
                )) ||
                (typeof nonFieldErrors === "string" && (
                  nonFieldErrors.toLowerCase().includes("pending") ||
                  nonFieldErrors.toLowerCase().includes("already") ||
                  nonFieldErrors.toLowerCase().includes("duplicate") ||
                  nonFieldErrors.toLowerCase().includes("conflict")
                ))
              ) ||
              error.message?.toLowerCase().includes("pending") ||
              error.message?.toLowerCase().includes("already have") ||
              error.message?.toLowerCase().includes("duplicate") ||
              error.message?.toLowerCase().includes("conflict");
            
            if (isDuplicateError) {
              // Provide a clear, user-friendly message about duplicate requests
              errorMessage = "You already have a pending meeting request with this person. Please wait for them to accept or decline your request before creating a new one.";
            } else if (nonFieldErrors) {
              // Use the backend's non_field_errors message if it's not a duplicate error
              if (Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
                errorMessage = nonFieldErrors[0];
              } else if (typeof nonFieldErrors === "string") {
                errorMessage = nonFieldErrors;
              }
            }
            // Check for meeting_link validation errors
            else if (
              error.message?.toLowerCase().includes("meeting_link") ||
              error.data?.data?.meeting_link ||
              error.data?.meeting_link
            ) {
              const linkError = error.data?.meeting_link || error.data?.data?.meeting_link;
              if (Array.isArray(linkError) && linkError.length > 0) {
                errorMessage = `Meeting link error: ${linkError[0]}`;
              } else if (typeof linkError === "string") {
                errorMessage = `Meeting link error: ${linkError}`;
              } else {
                errorMessage = "Please provide a valid meeting link (e.g., https://zoom.us/... or https://meet.google.com/...)";
              }
            } else {
              // Use the parsed error message
              errorMessage = error.message || errorMessage;
            }
          }
          // Check for physical meeting errors
          else if (data.meetingType === "Physical") {
            // Check for non_field_errors first (could be at different nesting levels)
            const nonFieldErrors = 
              error.data?.non_field_errors || 
              error.data?.data?.non_field_errors || 
              error.data?.data?.data?.non_field_errors;
            
            // Check if this is a duplicate/pending meeting error
            const isDuplicateError = 
              nonFieldErrors && (
                (Array.isArray(nonFieldErrors) && nonFieldErrors.some(msg => 
                  typeof msg === "string" && (
                    msg.toLowerCase().includes("pending") ||
                    msg.toLowerCase().includes("already have") ||
                    msg.toLowerCase().includes("already scheduled") ||
                    msg.toLowerCase().includes("meeting scheduled") ||
                    msg.toLowerCase().includes("duplicate") ||
                    msg.toLowerCase().includes("conflict")
                  )
                )) ||
                (typeof nonFieldErrors === "string" && (
                  nonFieldErrors.toLowerCase().includes("pending") ||
                  nonFieldErrors.toLowerCase().includes("already have") ||
                  nonFieldErrors.toLowerCase().includes("already scheduled") ||
                  nonFieldErrors.toLowerCase().includes("meeting scheduled") ||
                  nonFieldErrors.toLowerCase().includes("duplicate") ||
                  nonFieldErrors.toLowerCase().includes("conflict")
                ))
              ) ||
              error.message?.toLowerCase().includes("already have") ||
              error.message?.toLowerCase().includes("already scheduled") ||
              error.message?.toLowerCase().includes("meeting scheduled") ||
              error.message?.toLowerCase().includes("duplicate") ||
              error.message?.toLowerCase().includes("conflict");
            
            if (isDuplicateError) {
              // Provide a clear, user-friendly message about duplicate requests
              errorMessage = "You already have a pending meeting request with this person. Please wait for them to accept or decline your request before creating a new one.";
            } else if (nonFieldErrors) {
              // Use the backend's non_field_errors message if it's not a duplicate error
              if (Array.isArray(nonFieldErrors) && nonFieldErrors.length > 0) {
                errorMessage = nonFieldErrors[0];
              } else if (typeof nonFieldErrors === "string") {
                errorMessage = nonFieldErrors;
              }
            }
            // Check for slot constraint error (different from duplicate - this is about slot availability)
            else if (
              error.message?.includes("UNIQUE constraint failed") ||
              error.message?.includes("slot_id") ||
              error.data?.preview?.includes(
                "UNIQUE constraint failed: portal_meeting.slot_id"
              )
            ) {
              errorMessage =
                "This time slot is no longer available. The slot may have been taken by someone else. Please close this modal and reopen it to refresh available slots, then select a different time slot.";
            } else {
              errorMessage = error.message || errorMessage;
            }
          } else {
            errorMessage = error.message || errorMessage;
          }
        }
        
        // For duplicate/pending meeting errors, ensure longer toast duration for better visibility
        const isDuplicateMessage = 
          errorMessage.toLowerCase().includes("already have a pending") ||
          errorMessage.toLowerCase().includes("wait for them to accept or decline");
        
        if (isDuplicateMessage) {
          // Show duplicate message for longer duration (8 seconds) to ensure user sees it clearly
          showToast(errorMessage, "error", 8000);
        } else {
          showToast(errorMessage, "error");
        }
      } finally {
        setIsSubmittingMeeting(false);
      }
    },
    [meetingConnection, user?.user_id, showToast, markRequestMeetingComplete]
  );

  /**
   * Handle accept connection
   */
  const handleAcceptConnection = useCallback(async (connection: Connection) => {
    // Prevent duplicate requests using ref (immediate synchronous check)
    if (isProcessingActionRef.current) {
      return;
    }

    try {
      isProcessingActionRef.current = true;
      setIsProcessingAction(true);
      await connectionService.acceptConnection(connection.backendConnectionId);
      void trackConnectionEvent("accepted", { source: "connections_screen" });
      markConnectAttendeesComplete();
      showToast("Connection accepted successfully!", "success");
      // Refresh connections list
      await fetchConnections();
      closeBottomSheet();
    } catch (err: any) {
      let errorMessage = "Failed to accept connection. Please try again.";
      const isBackendConfigError = err instanceof ApiClientError && 
        err.message?.includes("FRONTEND_PORTAL_URL");
      
      if (err instanceof ApiClientError) {
        if (isBackendConfigError) {
          // Backend configuration error - connection might still be accepted
          // Refresh to check actual status, but show a warning
          errorMessage = "Backend configuration error. Refreshing connection status...";
          showToast(errorMessage, "error");
          // Still refresh connections to see if it was actually accepted
          try {
            await fetchConnections();
          } catch (refreshErr) {
            if (__DEV__) {
              console.error("Error refreshing connections:", refreshErr);
            }
          }
        } else {
          errorMessage = err.message;
          showToast(errorMessage, "error");
        }
      } else {
        showToast(errorMessage, "error");
      }
      
      if (__DEV__) {
        console.error("❌ Error accepting connection:", {
          message: err?.message || "Unknown error",
          statusCode: err?.statusCode || err?.responseCode || err?.response_code,
          responseCode: err?.responseCode || err?.response_code,
          errorData: err?.data || err?.response?.data,
          isBackendConfigError,
        });
      }
    } finally {
      isProcessingActionRef.current = false;
      setIsProcessingAction(false);
    }
  }, [showToast, fetchConnections, closeBottomSheet, markConnectAttendeesComplete]);

  /**
   * Handle reject connection
   */
  const handleRejectConnection = useCallback(async (connection: Connection) => {
    // Prevent duplicate requests using ref (immediate synchronous check)
    if (isProcessingActionRef.current) {
      return;
    }

    try {
      isProcessingActionRef.current = true;
      setIsProcessingAction(true);
      await connectionService.rejectConnection(connection.backendConnectionId);
      void trackConnectionEvent("declined", { source: "connections_screen" });
      showToast("Connection declined", "error");
      // Refresh connections list
      await fetchConnections();
      closeBottomSheet();
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to reject connection. Please try again.";
      showToast(errorMessage, "error");
      if (__DEV__) {
        console.error("❌ Error rejecting connection:", {
          message: err?.message || "Unknown error",
          statusCode: err?.statusCode || err?.responseCode || err?.response_code,
          responseCode: err?.responseCode || err?.response_code,
          errorData: err?.data || err?.response?.data,
          fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
        });
      }
    } finally {
      isProcessingActionRef.current = false;
      setIsProcessingAction(false);
    }
  }, [showToast, fetchConnections, closeBottomSheet]);

  /**
   * Handle delete/remove connection
   */
  const handleDeleteConnection = useCallback(async (connection: Connection) => {
    // Prevent duplicate requests using ref (immediate synchronous check)
    if (isProcessingActionRef.current) {
      return;
    }

    try {
      isProcessingActionRef.current = true;
      setIsProcessingAction(true);
      await connectionService.deleteConnection(connection.backendConnectionId);
      showToast("Connection removed", "error");
      // Refresh connections list
      await fetchConnections();
      closeBottomSheet();
    } catch (err: any) {
      // If connection not found, it might have been deleted by the other party
      // In this case, just refresh the list and close - connection is already gone
      const responseCode =
        err?.responseCode || err?.response_code || err?.statusCode;
      if (responseCode === 404) {
        // Connection already deleted - treat as success
        showToast("Connection removed", "error");
        await fetchConnections();
        closeBottomSheet();
      } else {
        const errorMessage =
          err instanceof ApiClientError
            ? err.message
            : "Failed to remove connection. Please try again.";
        showToast(errorMessage, "error");
        if (__DEV__) {
          console.error("❌ Error deleting connection:", {
            message: err?.message || "Unknown error",
            statusCode: err?.statusCode || err?.responseCode || err?.response_code,
            responseCode: err?.responseCode || err?.response_code,
            errorData: err?.data || err?.response?.data,
            fullError: JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
          });
        }
      }
    } finally {
      isProcessingActionRef.current = false;
      setIsProcessingAction(false);
    }
  }, [showToast, fetchConnections, closeBottomSheet]);

  // Handle bottom sheet animation when it opens
  React.useEffect(() => {
    if (showBottomSheet && selectedConnection) {
      // Reset animation values
      bottomSheetTranslateY.setValue(1000); // Start off-screen
      backdropOpacity.setValue(0);
      bottomSheetDragY.setValue(0);

      // Animate in after a brief delay
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.spring(bottomSheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [showBottomSheet, selectedConnection]);

  // Open bottom sheet with animation; fetch fresh connection so other user's metadata (country, industry, interests) is current
  const openBottomSheet = useCallback(
    (connection: Connection) => {
      setFloatingNavSuppressed(true);
      setSelectedConnection(connection);
      setConnectionDetail(null);
      setConnectionDetailLoading(true);
      setShowBottomSheet(true);
      const connectionId = connection.backendConnectionId;
      detailFetchConnectionIdRef.current = connectionId;

      connectionService
        .getConnectionById(connectionId)
        .then((backendConn) => {
          if (!backendConn) {
            setConnectionDetailLoading(false);
            return;
          }
          const mapped = mapBackendConnectionToUI(backendConn);
          setConnectionDetail((prev) => {
            if (detailFetchConnectionIdRef.current === connectionId) return mapped;
            return prev;
          });
          setConnectionDetailLoading(false);
        })
        .catch(() => {
          setConnectionDetailLoading(false);
        });
    },
    [user?.user_id, setFloatingNavSuppressed],
  );

  const highlightListIndexRef = useRef(0);
  listHighlight.scrollToOffsetRef.current = useCallback(() => {
    try {
      flatListRef.current?.scrollToIndex({
        index: highlightListIndexRef.current,
        animated: true,
        viewPosition: 0.5,
      });
    } catch {
      flatListRef.current?.scrollToOffset({
        offset: highlightListIndexRef.current * 120,
        animated: true,
      });
    }
  }, []);

  React.useEffect(() => {
    const connectionId = route.params?.highlightConnectionId;
    if (connectionId == null) return;
    listHighlight.rowLayoutRef.current.clear();
    listHighlight.setHighlightTargetId(connectionId);
    navigation.setParams({ highlightConnectionId: undefined });
  }, [route.params?.highlightConnectionId, navigation, listHighlight]);

  React.useEffect(() => {
    const targetId = listHighlight.highlightTargetId;
    if (targetId == null || isLoading) return;

    const index = connections.findIndex(
      (c) => c.backendConnectionId === targetId,
    );
    if (index < 0) {
      let cancelled = false;
      void (async () => {
        const raw = await resolveConnectionById(targetId);
        if (cancelled || !raw) return;
        const mapped = mapBackendConnectionToUI(raw);
        setConnections((prev) => {
          if (prev.some((c) => c.backendConnectionId === targetId)) {
            return prev;
          }
          return [mapped, ...prev];
        });
      })();
      return () => {
        cancelled = true;
      };
    }

    listHighlight.clearHighlightTimers();
    const capturedId = targetId;
    highlightListIndexRef.current = index;
    const timer = setTimeout(() => {
      listHighlight.setHighlightTargetId(null);
      listHighlight.tryScrollAndHighlight(capturedId, index);
      const row = connections.find((c) => c.backendConnectionId === capturedId);
      if (row) {
        setTimeout(() => openBottomSheet(row), 400);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [
    listHighlight.highlightTargetId,
    connections,
    isLoading,
    mapBackendConnectionToUI,
    listHighlight,
    openBottomSheet,
  ]);

  useFocusEffect(
    React.useCallback(() => {
      return () => clearHighlight();
    }, [clearHighlight]),
  );

  // Bottom sheet drag handler
  const bottomSheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: (evt, gestureState) => {
        // Only respond to downward gestures or gestures starting near the top
        return gestureState.dy > 0 || evt.nativeEvent.pageY < 200;
      },
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Only respond if dragging down
        return gestureState.dy > 5;
      },
      onPanResponderGrant: () => {
        dragStartY.current = 0;
        bottomSheetDragY.setValue(0);
      },
      onPanResponderMove: (evt, gestureState) => {
        // Only allow downward drag
        if (gestureState.dy > 0) {
          bottomSheetDragY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const dragThreshold = 100; // Minimum drag distance to close

        if (gestureState.dy > dragThreshold || gestureState.vy > 0.5) {
          // Close the sheet
          closeBottomSheet();
        } else {
          // Snap back to open position
          Animated.spring(bottomSheetDragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  const renderConnectionItem = ({
    item,
    index,
  }: {
    item: Connection;
    index: number;
  }) => {
    const connectionId = item.backendConnectionId;
    const highlighted = listHighlight.isHighlighted(connectionId);
    return (
      <View
        ref={(node) => {
          if (node) {
            listHighlight.rowViewRefs.current.set(connectionId, node);
            listHighlight.measureRowLayout(connectionId, node);
          } else {
            listHighlight.rowViewRefs.current.delete(connectionId);
          }
        }}
        onLayout={() => {
          const node = listHighlight.rowViewRefs.current.get(connectionId);
          if (node) listHighlight.measureRowLayout(connectionId, node);
        }}
        style={{
          position: "relative",
          marginHorizontal: 16,
          marginBottom: 12,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <ConnectionCard
          connection={item}
          onPress={() => {
            listHighlight.clearHighlight();
            openBottomSheet(item);
          }}
        />
        <ListRowHighlightOverlay
          visible={highlighted}
          opacity={listHighlight.highlightOpacity}
        />
      </View>
    );
  };

  return (
    <View className="flex-1 bg-white">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onMyTicketPress={() =>
          navigation.navigate("ScanQR", {
            initialTab: "My Ticket",
            openPersonalTicketQr: true,
          })
        }
        onMessagesPress={() => navigation.navigate("Messages")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
        hasUnreadNotifications={hasUnreadNotifications}
        unreadMessagesCount={messagesBadgeCount}
      />

      {/* Loading spinner for meeting submission */}
      {isSubmittingMeeting && (
        <View className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex-row items-center justify-center">
          <LoadingSpinner size="small" />
          <Text className="text-sm text-blue-900 ml-2">
            Sending meeting request...
          </Text>
        </View>
      )}

      <View className="flex-1">
        {/* Search Bar - Commented out for now */}
        {/* <View className="px-4 pt-4 pb-3">
          <View
            className="flex-row items-center bg-white rounded-xl px-4 py-3 border border-neutral-200"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 1,
            }}
          >
            <SearchIcon size={20} color="#A3A3A3" />
            <TextInput
              className="flex-1 ml-3 text-base text-neutral-900"
              placeholder="Search..."
              placeholderTextColor="#A3A3A3"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View> */}

        {/* Connections List */}
        {isLoading ? (
          <SkeletonListRows count={8} />
        ) : error ? (
          <View className="flex-1 items-center justify-center px-4">
            <Text className="text-base text-neutral-500 text-center mb-4">
              {error}
            </Text>
            <Pressable
              onPress={fetchConnections}
              className="bg-neutral-900 rounded-xl px-6 py-3"
            >
              <Text className="text-white font-semibold">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={filteredConnections}
            renderItem={renderConnectionItem}
            keyExtractor={(item) => item.id}
            ListHeaderComponent={
              postEventMode ? (
                <ConnectionsExportBanner
                  onDownload={() => void handleDownloadConnections()}
                  downloading={isExportingConnections}
                />
              ) : null
            }
            contentContainerStyle={{
              paddingTop: postEventMode ? 8 : 16,
              paddingBottom: FLOATING_NAV_BOTTOM_INSET,
            }}
            onLayout={(e) => {
              listHighlight.scrollViewportHeightRef.current =
                e.nativeEvent.layout.height;
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={false}
                onRefresh={fetchConnections}
                tintColor="#1BB273"
                colors={["#1BB273"]}
              />
            }
            ListEmptyComponent={
              <View className="items-center justify-center py-12 px-4">
                <Text className="text-base text-neutral-500">
                  No connections yet
                </Text>
              </View>
            }
          />
        )}
      </View>

      {/* Connection Detail Bottom Sheet */}
      {showBottomSheet && selectedConnection && (() => {
        const displayConnection = connectionDetail ?? selectedConnection;
        return (
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 50,
          }}
          pointerEvents="box-none"
        >
          {/* Backdrop */}
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              opacity: backdropOpacity,
            }}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={() => {
                closeBottomSheet();
              }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </Animated.View>

          {/* Bottom Sheet */}
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: "90%",
              transform: [
                {
                  translateY: Animated.add(
                    bottomSheetTranslateY,
                    bottomSheetDragY
                  ),
                },
              ],
            }}
            {...bottomSheetPanResponder.panHandlers}
          >
            <Pressable
              onPress={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: -2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 10,
              }}
            >
              {/* Drag Handle */}
              <View
                className="w-12 h-1.5 bg-neutral-300 rounded-full self-center mt-3 mb-6"
                {...bottomSheetPanResponder.panHandlers}
              />

              {/* Content */}
              <ScrollView
                className="px-6 pb-8"
                showsVerticalScrollIndicator={false}
              >
                {/* Profile Header */}
                <View className="flex-row items-start mb-4">
                  <View className="w-16 h-16 rounded-full bg-neutral-100 items-center justify-center mr-4 flex-shrink-0 overflow-hidden">
                    {(displayConnection.avatar && typeof displayConnection.avatar === "string") ? (
                      <Image
                        source={{ uri: displayConnection.avatar }}
                        className="w-full h-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <PersonIcon size={32} color="#404040" />
                    )}
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-neutral-900 mb-1">
                      {displayConnection.name}
                    </Text>
                    <Text className="text-base text-neutral-500 mb-3">
                      {displayConnection.title && displayConnection.company
                        ? `${displayConnection.title} · ${displayConnection.company}`
                        : displayConnection.title ||
                          displayConnection.company ||
                          ""}
                    </Text>
                    {connectionDetailLoading && !connectionDetail ? (
                      <View className="flex-row items-center mt-1">
                        <LoadingSpinner size="small" />
                        <Text className="text-sm text-neutral-500 ml-2">Loading profile…</Text>
                      </View>
                    ) : null}
                    {/* Tags */}
                    {displayConnection.tags &&
                      displayConnection.tags.length > 0 && (
                        <View className="flex-row flex-wrap">
                          {displayConnection.tags.map((tag, index) => (
                            <View
                              key={index}
                              className="bg-white border rounded-full px-3 py-1.5 mr-2 mb-2"
                              style={{
                                borderColor: tag.borderColor,
                                borderWidth: 1.5,
                              }}
                            >
                              <Text className="text-sm font-medium text-neutral-900">
                                {tag.label}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                  </View>
                </View>

                {/* About Section */}
                {displayConnection.about && (
                  <Text className="text-[15px] text-neutral-700 mb-5 leading-6">
                    {displayConnection.about}
                  </Text>
                )}

                {/* Interests Section */}
                {displayConnection.interests &&
                  displayConnection.interests.length > 0 && (
                    <View className="mb-5">
                      <Text className="text-lg font-bold text-neutral-900 mb-3">
                        Interests
                      </Text>
                      <View className="flex-row flex-wrap">
                        {displayConnection.interests.map((interest, index) => (
                          <View
                            key={index}
                            className="bg-white border border-neutral-300 rounded-full px-3 py-1.5 mr-2 mb-2"
                          >
                            <Text className="text-sm font-medium text-neutral-700">
                              {interest}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                {/* Speaking Sessions Section - Only for Speakers */}
                {selectedConnection.isSpeaker &&
                  selectedConnection.speakingSessions &&
                  selectedConnection.speakingSessions.length > 0 && (
                    <View className="mb-6">
                      <Text className="text-lg font-bold text-neutral-900 mb-3">
                        Speaking Sessions
                      </Text>
                      {selectedConnection.speakingSessions.map(
                        (session, index) => (
                          <View
                            key={index}
                            className="bg-neutral-100 rounded-xl p-4 mb-2"
                          >
                            <Text className="text-base font-semibold text-neutral-900 mb-1">
                              {session.title}
                            </Text>
                            <Text className="text-sm text-neutral-500">
                              {session.location} • {session.time}
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  )}

                {/* Action Buttons */}
                <View className="mt-2">
                  {/* Show Accept/Reject buttons for pending connections where current user is the recipient */}
                  {selectedConnection.status === "pending" &&
                    !selectedConnection.isFromCurrentUser && (
                      <>
                        <Pressable
                          onPress={() => handleAcceptConnection(selectedConnection)}
                          disabled={isProcessingAction}
                          className="w-full flex-row items-center justify-center bg-[#1BB273] rounded-xl py-3.5 px-4 mb-3"
                        >
                          {isProcessingAction ? (
                            <LoadingSpinner size="small" color="#FFFFFF" />
                          ) : (
                            <Text className="text-base font-semibold text-white">
                              Accept Connection
                            </Text>
                          )}
                        </Pressable>
                        <Pressable
                          onPress={() => handleRejectConnection(selectedConnection)}
                          disabled={isProcessingAction}
                          className="w-full flex-row items-center justify-center rounded-xl py-3.5 px-4 mb-3"
                          style={{ backgroundColor: isProcessingAction ? "#FCA5A5" : "#EF4444" }}
                        >
                          {isProcessingAction ? (
                            <LoadingSpinner size="small" color="#FFFFFF" />
                          ) : (
                            <Text className="text-base font-semibold text-white">
                              Decline
                            </Text>
                          )}
                        </Pressable>
                      </>
                    )}

                  {/* Show Request Meeting button for accepted connections */}
                  {selectedConnection.status === "accepted" && (
                    <Pressable
                      onPress={async () => {
                        const canBook = await getCanUserBookMeetings();
                        if (canBook) {
                          setMeetingConnection(selectedConnection);
                          closeBottomSheet();
                          setIsRequestMeetingModalVisible(true);
                        } else {
                          closeBottomSheet();
                          showExpoCannotBookMeetingAlert(navigation);
                        }
                      }}
                      className="w-full flex-row items-center justify-center bg-neutral-900 rounded-xl py-3.5 px-4 mb-3"
                    >
                      <CalendarIconWhite size={20} color="#FFFFFF" />
                      <Text className="text-base font-semibold text-white ml-2">
                        Request Meeting
                      </Text>
                    </Pressable>
                  )}

                  {/* Accepted: LinkedIn + Message in one row (50/50). Others: LinkedIn full width only. */}
                  {selectedConnection.status === "accepted" ? (
                    <View
                      style={{
                        width: "100%",
                        flexDirection: "row",
                        alignItems: "stretch",
                        marginBottom: 12,
                      }}
                    >
                      {(() => {
                        const linkedIn = getLinkedInDisplayInfo(
                          selectedConnection.linkedInUrl
                        );
                        const openLinkedIn = async () => {
                          if (!linkedIn) return;
                          try {
                            const supported = await Linking.canOpenURL(
                              linkedIn.url
                            );
                            if (supported) {
                              await Linking.openURL(linkedIn.url);
                            } else {
                              try {
                                await Linking.openURL(linkedIn.url);
                              } catch {
                                Alert.alert(
                                  "Cannot Open LinkedIn",
                                  "Please make sure you have the LinkedIn app installed or try opening the link in your browser.",
                                  [{ text: "OK" }]
                                );
                              }
                            }
                          } catch (error) {
                            if (__DEV__)
                              console.error("Error opening LinkedIn URL:", error);
                            Alert.alert(
                              "Error",
                              "Failed to open LinkedIn profile. Please try again.",
                              [{ text: "OK" }]
                            );
                          }
                        };
                        return linkedIn ? (
                          <Pressable
                            onPress={openLinkedIn}
                            style={{ flex: 1, marginRight: 6 }}
                            className="flex-row items-center justify-center bg-neutral-200 rounded-xl py-3.5 px-3"
                          >
                            <LinkedInIcon size={20} color="#0A66C2" />
                            <Text
                              className="text-sm font-semibold text-neutral-700 ml-1.5"
                              numberOfLines={1}
                            >
                              {linkedIn.displayLabel}
                            </Text>
                          </Pressable>
                        ) : (
                          <View style={{ flex: 1, marginRight: 6 }} />
                        );
                      })()}
                      <Pressable
                        onPress={async () => {
                          if (isOpeningChat) return;
                          setIsOpeningChat(true);
                          try {
                            const { conversationId } =
                              await getOrCreateConversation(
                                EVENT_ID,
                                displayConnection.userId
                              );
                            closeBottomSheet();
                            navigation.navigate("Conversation", {
                              eventId: EVENT_ID,
                              conversationId,
                              otherPartyName: displayConnection.name,
                              otherPartyAvatarUri:
                                getConnectionProfilePicUri(displayConnection),
                              otherPartyUserId: displayConnection.userId,
                            });
                          } catch (err: any) {
                            const msg =
                              err instanceof ApiClientError
                                ? err.message
                                : "Failed to open chat. Please try again.";
                            showToast(msg, "error");
                          } finally {
                            setIsOpeningChat(false);
                          }
                        }}
                        disabled={isOpeningChat}
                        style={{ flex: 1, marginLeft: 6 }}
                        className="flex-row items-center justify-center bg-[#1BB273] rounded-xl py-3.5 px-3"
                      >
                        {isOpeningChat ? (
                          <LoadingSpinner size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <SpeechBubbleIcon size={20} color="#FFFFFF" />
                            <Text className="text-sm font-semibold text-white ml-1.5">
                              Message
                            </Text>
                          </>
                        )}
                      </Pressable>
                    </View>
                  ) : (
                    (() => {
                      const linkedIn = getLinkedInDisplayInfo(
                        selectedConnection.linkedInUrl
                      );
                      if (!linkedIn) return null;
                      return (
                        <Pressable
                          onPress={async () => {
                            try {
                              const supported = await Linking.canOpenURL(
                                linkedIn.url
                              );
                              if (supported) {
                                await Linking.openURL(linkedIn.url);
                              } else {
                                try {
                                  await Linking.openURL(linkedIn.url);
                                } catch {
                                  Alert.alert(
                                    "Cannot Open LinkedIn",
                                    "Please make sure you have the LinkedIn app installed or try opening the link in your browser.",
                                    [{ text: "OK" }]
                                  );
                                }
                              }
                            } catch (error) {
                              if (__DEV__)
                                console.error("Error opening LinkedIn URL:", error);
                              Alert.alert(
                                "Error",
                                "Failed to open LinkedIn profile. Please try again.",
                                [{ text: "OK" }]
                              );
                            }
                          }}
                          className="w-full flex-row items-center justify-center bg-neutral-200 rounded-xl py-3.5 px-4 mb-3"
                        >
                          <LinkedInIcon size={20} color="#0A66C2" />
                          <Text className="text-base font-semibold text-neutral-700 ml-2">
                            {linkedIn.displayLabel}
                          </Text>
                        </Pressable>
                      );
                    })()
                  )}

                  {selectedConnection.status === "pending" &&
                    !selectedConnection.isFromCurrentUser && (
                      <View
                        style={{
                          paddingHorizontal: 4,
                          paddingTop: 4,
                          paddingBottom: Math.max(insets.bottom, 10) + 0,
                        }}
                      >
                        <Text className="text-xs text-neutral-500 text-center leading-5">
                          Accepting this connection means your contact details will be shared, so you can stay in touch.
                        </Text>
                      </View>
                    )}

                  {/* Remove Connection button for both rejected and accepted connections */}
                  {(selectedConnection.status === "rejected" ||
                    selectedConnection.status === "accepted") && (
                    <Pressable
                      onPress={() => handleDeleteConnection(selectedConnection)}
                      disabled={isProcessingAction}
                      className="w-full flex-row items-center justify-center rounded-xl py-3.5 px-4 mt-3"
                      style={{ backgroundColor: isProcessingAction ? "#FCA5A5" : "#EF4444" }}
                    >
                      {isProcessingAction ? (
                        <LoadingSpinner size="small" color="#FFFFFF" />
                      ) : (
                        <Text className="text-base font-semibold text-white">
                          Remove Connection
                        </Text>
                      )}
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </View>
      );
      })()}

      {/* Request Meeting Modal */}
      <RequestMeetingModal
        visible={isRequestMeetingModalVisible}
        analyticsSource="connections_screen"
        onClose={() => {
          if (!isSubmittingMeeting) {
            setIsRequestMeetingModalVisible(false);
            setMeetingConnection(null);
          }
        }}
        onExpoBlocked={() => showExpoCannotBookMeetingAlert(navigation)}
        onSubmit={handleMeetingRequestSubmit}
        attendeeName={meetingConnection?.name}
        requesteeUserId={meetingConnection?.userId}
        eventId={EVENT_ID}
        virtualOnly={isPostEventMode()}
      />

      {/* Toast */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
}
