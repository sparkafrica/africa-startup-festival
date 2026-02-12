import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, RefreshControl, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  HeaderBar,
  BottomNavigation,
  MeetingCard,
  ScheduledMeetingCard,
  ScheduledMeetingModal,
  CancelledMeetingCard,
  CancelledMeetingDetailModal,
  EmptyCancelledMeetings,
  TabButton,
  SecondaryTabButton,
  ArrowDownRedIcon,
  ArrowUpGreenIcon,
  InboundMeetingModal,
  LoadingSpinner,
  OutboundMeetingModal,
  ParticipantDetailModal,
} from "../components";
import {
  HomeIcon,
  HomeIconFilled,
  PeopleIcon,
  PeopleIconFilled,
  CalendarIcon,
  CalendarIconFilled,
  ClockIcon,
  ClockIconFilled,
  HeartIcon,
  HeartIconFilled,
} from "../components/BottomNavIcons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import type {
  RootStackParamList,
  RootStackScreenProps,
} from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { useMeetingsBadgeContext } from "../context/MeetingsBadgeContext";
import { useNotifications } from "../context/NotificationsContext";
import { useMeetingsBadgeCount } from "../hooks";
import {
  meetingService,
  type Meeting as BackendMeeting,
  type VirtualMeeting,
  type MeetingUser,
} from "../services/meetingService";
import { ApiClientError } from "../services/api";
import { useToast } from "../hooks/useToast";
import Toast from "../components/Toast";

type PrimaryTab = "requests" | "scheduled" | "cancelled";
type SecondaryTab = "inbound" | "outbound";

type Props = RootStackScreenProps<"Meetings">;

// UI-friendly meeting interface
interface UIMeeting {
  id: string;
  backendMeetingId: number; // Store backend ID for API calls
  isVirtual: boolean; // Track if this is a virtual meeting (for API routing)
  isInbound: boolean; // Whether current user is requestee (for filtering)
  title: string; // reason from backend
  participantName: string;
  participantRole?: string;
  company: string;
  tags: string[];
  interests: string[];
  socialLabel?: string;
  linkedInUrl?: string; // Full LinkedIn URL for opening profiles
  bio?: string;
  participantAvatar?: { uri: string }; // Avatar from profile_pic
  date: string; // YYYY-MM-DD
  startTime: string; // "10:00 AM"
  endTime: string; // "10:20 AM"
  location?: string; // "Table T-15" or meeting link for virtual
  meetingType?: "physical" | "virtual";
  meetingLink?: string; // For virtual meetings
  status: "pending" | "accepted" | "rejected" | "cancelled";
  approvalMessage?: string;
  expiresIn?: number; // hours until expiration (for pending)
  timeUntil?: string; // "In 3hrs", "Tomorrow" (for scheduled)
  description: string; // reason from backend
  createdAt?: string; // ISO date-time for sorting (e.g. cancelled: latest first)
}

// ============================================================================
// EXTERNAL LINKS INTEGRATION POINTS - MeetingsScreen
// ============================================================================
// This screen handles external links in the following areas:
//
// 1. VIRTUAL MEETING LINKS
//    - Location: ScheduledMeetingModal, InboundMeetingModal, OutboundMeetingModal
//    - Action: Click meeting link → Open virtual meeting (Zoom/Teams/Google Meet)
//    - Implementation: Uses Linking.openURL() with meetingLink prop
//    - Status: ✅ Implemented in ScheduledMeetingModal (just added)
//    - TODO: Add to InboundMeetingModal and OutboundMeetingModal if not already present
//
// 2. LINKEDIN PROFILE LINKS
//    - Location: All meeting modals (participant detail sections)
//    - Action: Click LinkedIn pill → Open participant's LinkedIn profile
//    - Implementation: Uses Linking.openURL() with participantLinkedInUrl prop
//    - Status: ✅ Already implemented in all modals
//
// 3. LEAVE FEEDBACK (External Link Option)
//    - Location: ScheduledMeetingModal → onLeaveFeedback handler
//    - Action: Submit feedback → Could open external form URL or use API
//    - Implementation: Currently uses LeaveFeedbackModal (UI), can switch to external URL
//    - Status: ⚠️ Uses modal, external link option available
//    - TODO: Add option to use external feedback form URL if needed
//
// ============================================================================

export default function MeetingsScreen({ route }: Props) {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const { user } = useAuth();
  const meetingsBadgeCount = useMeetingsBadgeCount();
  const { refresh: refreshMeetingsBadge } = useMeetingsBadgeContext();
  const { hasUnreadNotifications } = useNotifications();
  const { toast, showToast, hideToast } = useToast();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("requests");
  const [secondaryTab, setSecondaryTab] = useState<SecondaryTab>("inbound");
  const [selectedMeeting, setSelectedMeeting] = useState<UIMeeting | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isCancelledDetailModalVisible, setIsCancelledDetailModalVisible] =
    useState(false);
  const [isParticipantModalVisible, setIsParticipantModalVisible] =
    useState(false);
  
  // API state
  const [meetings, setMeetings] = useState<UIMeeting[]>([]);
  const [meetingCounts, setMeetingCounts] = useState({
    requests: 0,
    scheduled: 0,
    cancelled: 0,
  });
  const [allMeetingsForCounts, setAllMeetingsForCounts] = useState<UIMeeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Handle navigation params to set tabs when navigating from notifications
  useEffect(() => {
    if (route.params) {
      if (route.params.primaryTab) {
        setPrimaryTab(route.params.primaryTab);
      }
      if (route.params.secondaryTab) {
        setSecondaryTab(route.params.secondaryTab);
      }
    }
  }, [route.params]);

  // Helper: terminated = cancelled or rejected (declined requests + cancelled meetings)
  const isTerminated = useCallback((m: UIMeeting) =>
    m.status === "cancelled" || m.status === "rejected", []);

  // Derive counts and filtered meetings from allMeetingsForCounts
  useEffect(() => {
    setMeetingCounts({
      requests: allMeetingsForCounts.filter((m) => m.status === "pending").length,
      scheduled: allMeetingsForCounts.filter((m) => m.status === "accepted").length,
      cancelled: allMeetingsForCounts.filter((m) => isTerminated(m)).length,
    });
    let filtered: UIMeeting[];
    if (primaryTab === "requests") {
      filtered = allMeetingsForCounts.filter((m) => m.status === "pending");
    } else if (primaryTab === "scheduled") {
      filtered = allMeetingsForCounts.filter((m) => m.status === "accepted");
    } else {
      // Cancelled tab: show both rejected (declined) and cancelled
      filtered = allMeetingsForCounts.filter((m) => isTerminated(m));
    }
    filtered = filtered.filter((m) =>
      secondaryTab === "inbound" ? m.isInbound : !m.isInbound
    );
    // Cancelled tab: latest first (by createdAt desc, else backendMeetingId desc)
    if (primaryTab === "cancelled" && filtered.length > 1) {
      filtered = [...filtered].sort((a, b) => {
        const aTs = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTs = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (aTs !== bTs) return bTs - aTs; // newer first
        return b.backendMeetingId - a.backendMeetingId;
      });
    }
    setMeetings(filtered);
  }, [allMeetingsForCounts, primaryTab, secondaryTab, isTerminated]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Format time from HH:MM:SS to "10:00 AM" format
   */
  const formatTime = (timeString: string): string => {
    try {
      const [hours, minutes] = timeString.split(":");
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return timeString;
    }
  };

  /**
   * Format date from YYYY-MM-DD to readable format like "26th June, 2026"
   */
  const formatDateForDisplay = (dateString: string): string => {
    try {
      // If already in readable format (contains letters), return as-is
      if (/[a-zA-Z]/.test(dateString)) {
        return dateString;
      }
      
      // Parse YYYY-MM-DD format
      const date = new Date(dateString + "T00:00:00"); // Add time to avoid timezone issues
      if (isNaN(date.getTime())) {
        return dateString; // Return original if parsing fails
      }

      const day = date.getDate();
      const month = date.toLocaleString("en-US", { month: "long" });
      const year = date.getFullYear();
      
      // Add ordinal suffix (1st, 2nd, 3rd, 4th, etc.)
      const getOrdinalSuffix = (n: number): string => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      };
      
      return `${getOrdinalSuffix(day)} ${month}, ${year}`;
    } catch {
      return dateString;
    }
  };

  const normalizeMeetingType = (
    value?: string
  ): "physical" | "virtual" | undefined => {
    if (!value) return undefined;
    const normalized = value.toLowerCase();
    if (normalized.includes("virtual")) return "virtual";
    if (normalized.includes("physical")) return "physical";
    return undefined;
  };

  const isLikelyMeetingUrl = (value?: string): boolean => {
    if (!value) return false;
    const lower = value.toLowerCase();
    return (
      lower.includes("http://") ||
      lower.includes("https://") ||
      lower.includes("zoom.us") ||
      lower.includes("teams.microsoft") ||
      lower.includes("meet.google")
    );
  };

  /**
   * Parse date label format like "26th June, 2026" to YYYY-MM-DD
   */
  const parseDateLabel = (dateLabel: string): string | null => {
    try {
      // Match patterns like "26th June, 2026" or "27th June, 2026"
      const match = dateLabel.match(/(\d{1,2})(?:st|nd|rd|th)?\s+(\w+),\s+(\d{4})/);
      if (match) {
        const [, day, monthName, year] = match;
        const monthMap: { [key: string]: string } = {
          january: "01", february: "02", march: "03", april: "04",
          may: "05", june: "06", july: "07", august: "08",
          september: "09", october: "10", november: "11", december: "12"
        };
        const month = monthMap[monthName.toLowerCase()];
        if (month) {
          return `${year}-${month}-${day.padStart(2, "0")}`;
        }
      }
      // Try standard Date parsing as fallback
      const parsed = new Date(dateLabel);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split("T")[0];
      }
    } catch {
      // Return null if parsing fails
    }
    return null;
  };

  /**
   * Extract date from meeting
   * Priority: metadata.selectedDate (value format) > metadata.selectedDate (label format) > created_at > today
   */
  const getMeetingDate = (meeting: BackendMeeting): string => {
    // First check metadata.selectedDate (sent from request form)
    const metadataDate = meeting.metadata?.selectedDate;
    if (metadataDate) {
      // If it's already in YYYY-MM-DD format, return it
      if (/^\d{4}-\d{2}-\d{2}$/.test(metadataDate)) {
        return metadataDate;
      }
      // Try to parse date label format like "26th June, 2026"
      const parsed = parseDateLabel(metadataDate);
      if (parsed) {
        return parsed;
      }
    }
    
    // Fallback to created_at date
    if (meeting.created_at) {
      return meeting.created_at.split("T")[0];
    }
    
    // Last resort: use today's date
    return new Date().toISOString().split("T")[0];
  };

  /**
   * Calculate hours until expiration for pending meetings
   * Assuming meetings expire 48 hours after creation
   */
  const calculateExpiresIn = (createdAt?: string): number => {
    if (!createdAt) return 24; // Default 24 hours
    const created = new Date(createdAt);
    const now = new Date();
    const hoursDiff = (created.getTime() + 48 * 60 * 60 * 1000 - now.getTime()) / (1000 * 60 * 60);
    return Math.max(0, Math.ceil(hoursDiff));
  };

  /**
   * Calculate time until meeting for scheduled meetings
   * Returns countdown format like "In 5 days", "In 3 days", "In 2 days", "Tomorrow", "In 3hrs", "In 45mins", or "Now"
   */
  const calculateTimeUntil = (date: string, startTime: string): string => {
    try {
      // Parse date - could be YYYY-MM-DD or label format like "26th June, 2026"
      let parsedDate = date;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        // Try to parse date label format
        const parsed = parseDateLabel(date);
        if (parsed) {
          parsedDate = parsed;
        }
      }

      const [hours, minutes] = startTime.split(":");
      const meetingDateTime = new Date(`${parsedDate}T${hours}:${minutes}:00`);
      const now = new Date();
      const diffMs = meetingDateTime.getTime() - now.getTime();
      
      // If meeting is in the past, return "Now"
      if (diffMs <= 0) {
        return "Now";
      }

      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      // Calculate days (round down)
      const days = Math.floor(diffDays);
      
      // Calculate hours remaining after full days
      const hoursRemaining = Math.floor(diffHours - (days * 24));
      
      // Calculate minutes remaining after full hours
      const minutesRemaining = Math.floor((diffHours - Math.floor(diffHours)) * 60);

      if (days > 1) {
        return `In ${days} days`;
      } else if (days === 1) {
        return "Tomorrow";
      } else if (diffHours >= 1) {
        return `In ${Math.floor(diffHours)}hrs`;
      } else if (minutesRemaining > 0) {
        return `In ${minutesRemaining}mins`;
      } else {
        return "Now";
      }
    } catch {
      return "Soon";
    }
  };

  /**
   * Map backend VirtualMeeting to UI-friendly format
   */
  const mapVirtualMeetingToUI = (
    virtualMeeting: VirtualMeeting,
    currentUserId: string
  ): UIMeeting => {
    // Determine if current user is requester or requestee (normalize IDs for comparison)
    const isRequester = String(virtualMeeting.requester) === String(currentUserId);
    const otherUser = (isRequester
      ? virtualMeeting.requestee_info
      : virtualMeeting.requester_info) ?? ({} as MeetingUser);
    const otherCompany = isRequester
      ? virtualMeeting.requestee_company
      : virtualMeeting.requester_company;

    // Extract participant info
    const participantName =
      `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim() ||
      otherUser?.email ||
      "Unknown";
    const participantRole = otherUser?.job_title || undefined;
    const company =
      otherCompany?.name ||
      otherUser?.organisation ||
      "No Company";

    // Extract tags (country, industry/sector)
    const tags: string[] = [];
    if (otherUser?.country) {
      tags.push(otherUser.country);
    }
    const sector =
      otherCompany?.company_type ||
      otherUser?.metadata?.sector ||
      otherUser?.metadata?.industry;
    if (sector) {
      tags.push(sector);
    }

    // Extract interests
    const interests = otherUser?.metadata?.interests || [];

    // Extract bio
    const bio = otherUser?.metadata?.bio || "";

    // Extract LinkedIn
    const linkedInUrl =
      otherUser?.metadata?.linkedIn || otherUser?.metadata?.linkedin_url;
    const socialLabel = linkedInUrl
      ? linkedInUrl.replace("https://www.linkedin.com/in/", "").replace("/", "")
      : undefined;

    // Extract avatar
    const participantAvatar = otherUser?.profile_pic
      ? { uri: otherUser.profile_pic }
      : undefined;

    // Format time from HH:MM:SS to "10:00 AM" format
    const startTime = formatTime(virtualMeeting.scheduled_time);
    // Calculate end time from duration (default 20 minutes if not provided)
    const durationMinutes = virtualMeeting.duration_minutes || 20;
    const [startHours, startMinutes] = virtualMeeting.scheduled_time.split(":");
    const startDate = new Date(`2000-01-01T${startHours}:${startMinutes}:00`);
    startDate.setMinutes(startDate.getMinutes() + durationMinutes);
    const endTime = formatTime(
      `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}:00`
    );

    // Get date
    const date = formatDateForDisplay(virtualMeeting.scheduled_date);

    // Determine if inbound (current user is requestee)
    const isInbound = !isRequester;

    // Extract title from metadata
    // Priority: metadata.title > reason
    // Note: Backend may also have top-level title field, but we prioritize metadata.title
    const title = virtualMeeting.metadata?.title || (virtualMeeting as any).title || virtualMeeting.reason;

    // Calculate expiresIn for pending meetings
    const expiresIn =
      virtualMeeting.status === "pending"
        ? calculateExpiresIn(virtualMeeting.created_at)
        : undefined;

    // Calculate timeUntil for scheduled meetings
    const timeUntil =
      virtualMeeting.status === "accepted"
        ? calculateTimeUntil(
            virtualMeeting.scheduled_date,
            virtualMeeting.scheduled_time
          )
        : undefined;

    return {
      id: `virtual-meeting-${virtualMeeting.id}`,
      backendMeetingId: virtualMeeting.id,
      isVirtual: true, // Mark as virtual meeting
      isInbound,
      title,
      participantName,
      participantRole,
      company,
      tags,
      interests,
      socialLabel,
      linkedInUrl,
      bio,
      participantAvatar,
      date,
      startTime,
      endTime,
      location: undefined, // Virtual meetings don't have location
      meetingType: "virtual",
      meetingLink: virtualMeeting.meeting_link,
      status: virtualMeeting.status,
      approvalMessage:
        virtualMeeting.status === "pending"
          ? isRequester
            ? "Waiting for their approval."
            : "You have a pending request."
          : undefined,
      expiresIn,
      timeUntil,
      description: virtualMeeting.reason,
      createdAt: virtualMeeting.created_at,
    };
  };

  /**
   * Map backend Meeting to UI-friendly format
   */
  const mapBackendMeetingToUI = (
    backendMeeting: BackendMeeting,
    currentUserId: string
  ): UIMeeting => {
    // Determine if current user is requester or requestee (normalize IDs for comparison)
    const isRequester = String(backendMeeting.requester) === String(currentUserId);
    const otherUser: MeetingUser = (isRequester
      ? backendMeeting.requestee_info
      : backendMeeting.requester_info) ?? ({} as MeetingUser);
    const otherCompany = isRequester
      ? backendMeeting.requestee_company
      : backendMeeting.requester_company;

    // Extract participant info
    const participantName =
      `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim() ||
      otherUser?.email ||
      "Unknown";
    const participantRole = otherUser?.job_title || undefined;
    const company =
      otherCompany?.name ||
      otherUser?.organisation ||
      "No Company";

    // Extract tags (country, industry/sector)
    const tags: string[] = [];
    if (otherUser?.country) {
      tags.push(otherUser.country);
    }
    const sector =
      otherCompany?.company_type ||
      otherUser?.metadata?.sector ||
      otherUser?.metadata?.industry;
    if (sector) {
      tags.push(sector);
    }

    // Extract interests
    const interests = otherUser?.metadata?.interests || [];

    // Extract bio
    const bio = otherUser?.metadata?.bio || "";

    // Extract LinkedIn
    const linkedInUrl =
      otherUser?.metadata?.linkedIn || otherUser?.metadata?.linkedin_url;
    const socialLabel = linkedInUrl
      ? linkedInUrl.replace("https://www.linkedin.com/in/", "").replace("/", "")
      : undefined;

    // Extract avatar
    const participantAvatar = otherUser?.profile_pic
      ? { uri: otherUser.profile_pic }
      : undefined;

    // Format time (slot may be null for some cancelled meetings)
    const slot = backendMeeting.slot;
    const startTime = slot?.start_time ? formatTime(slot.start_time) : "—";
    const endTime = slot?.end_time ? formatTime(slot.end_time) : "—";

    // Get date and format for display
    const rawDate = getMeetingDate(backendMeeting);
    const date = formatDateForDisplay(rawDate);

    const metadataMeetingType = normalizeMeetingType(
      backendMeeting.metadata?.meetingType
    );
    const metadataMeetingLink =
      typeof backendMeeting.metadata?.meetingLink === "string"
        ? backendMeeting.metadata.meetingLink.trim()
        : undefined;
    const locationLooksLikeLink = isLikelyMeetingUrl(backendMeeting.location);

    // Determine meeting type (physical vs virtual)
    const isVirtual =
      metadataMeetingType === "virtual" ||
      (!!metadataMeetingLink && metadataMeetingType !== "physical") ||
      locationLooksLikeLink;
    const meetingType: "physical" | "virtual" = isVirtual ? "virtual" : "physical";
    const location = isVirtual
      ? undefined
      : backendMeeting.location || backendMeeting.metadata?.tableNumber;
    const meetingLink = isVirtual
      ? metadataMeetingLink ||
        (locationLooksLikeLink ? backendMeeting.location : undefined) ||
        (isLikelyMeetingUrl(backendMeeting.calendar_link)
          ? backendMeeting.calendar_link
          : undefined)
      : undefined;

    // Calculate expiresIn for pending meetings
    const expiresIn =
      backendMeeting.status === "pending"
        ? calculateExpiresIn(backendMeeting.created_at)
        : undefined;

    // Calculate timeUntil for scheduled meetings
    const timeUntil =
      backendMeeting.status === "accepted" && slot?.start_time
        ? calculateTimeUntil(rawDate, slot.start_time)
        : undefined;

    // Determine if inbound (current user is requestee)
    const isInbound = !isRequester;

    // Extract title from metadata (stored when creating meeting request)
    // Fallback to reason if metadata.title doesn't exist (for backwards compatibility)
    // Note: Backend may also have top-level title field, but we prioritize metadata.title
    const title = backendMeeting.metadata?.title || (backendMeeting as any).title || backendMeeting.reason;

    const mappedMeeting: UIMeeting = {
      id: `meeting-${backendMeeting.id}`,
      backendMeetingId: backendMeeting.id,
      isVirtual, // Use calculated isVirtual value
      isInbound,
      title, // Use metadata.title if available, otherwise fallback to reason
      participantName,
      participantRole,
      company,
      tags,
      interests,
      socialLabel,
      linkedInUrl,
      bio,
      participantAvatar,
      date,
      startTime,
      endTime,
      location,
      meetingType: meetingType as "physical" | "virtual",
      meetingLink,
      status: backendMeeting.status,
      approvalMessage:
        backendMeeting.status === "pending"
          ? isRequester
            ? "Waiting for their approval."
            : "You have a pending request."
          : undefined,
      expiresIn,
      timeUntil,
      description: backendMeeting.reason, // Keep reason as description
      createdAt: backendMeeting.created_at,
    };
    
    return mappedMeeting;
  };

  const bottomNavItems = [
    {
      icon: (active: boolean) =>
        active ? (
          <HomeIconFilled size={24} color="#000000" />
        ) : (
          <HomeIcon size={24} color="#A3A3A3" />
        ),
      label: "Home",
      route: "Home",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <PeopleIconFilled size={24} color="#000000" />
        ) : (
          <PeopleIcon size={24} color="#A3A3A3" />
        ),
      label: "Attendees",
      route: "Attendees",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <CalendarIconFilled size={24} color="#000000" />
        ) : (
          <CalendarIcon size={24} color="#A3A3A3" />
        ),
      label: "Schedule",
      route: "Schedule",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <ClockIconFilled size={24} color="#000000" />
        ) : (
          <ClockIcon size={24} color="#A3A3A3" />
        ),
      label: "Meetings",
      route: "Meetings",
      badge: meetingsBadgeCount,
    },
    {
      icon: (active: boolean) =>
        active ? (
          <HeartIconFilled size={24} color="#000000" />
        ) : (
          <HeartIcon size={24} color="#A3A3A3" />
        ),
      label: "Connections",
      route: "Connections",
    },
  ];

  // ============================================================================
  // FETCH MEETINGS
  // ============================================================================

  /**
   * Fetch meetings from backend and filter by status and direction
   * Fetches both physical and virtual meetings and merges them
   */
  const fetchMeetings = useCallback(async (isRefresh = false) => {
    if (!user?.user_id) {
      setError("User not authenticated");
      setIsLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);
      const currentUserId = user.user_id;

      // Fetch both physical and virtual meetings in parallel
      const [physicalMeetings, virtualMeetings] = await Promise.all([
        meetingService.getMeetings(),
        meetingService.getVirtualMeetings(),
      ]);

      // Map physical meetings to UI format
      const physicalUIMeetings = physicalMeetings.map((meeting) =>
        mapBackendMeetingToUI(meeting, currentUserId)
      );

      // Map virtual meetings to UI format
      const virtualUIMeetings = virtualMeetings.map((meeting) =>
        mapVirtualMeetingToUI(meeting, currentUserId)
      );

      // Simple: API is source of truth. Whatever backend returns, we display.
      const fromApi = [...physicalUIMeetings, ...virtualUIMeetings];
      setAllMeetingsForCounts(fromApi);
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to fetch meetings. Please try again.";
      setError(errorMessage);
      if (__DEV__) {
        console.error("Error fetching meetings:", err);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.user_id]);

  // Fetch meetings on mount and when tabs change
  useEffect(() => {
    fetchMeetings(false);
  }, [fetchMeetings]);

  // Refetch when screen gains focus so the other user sees cancelled/declined updates
  useFocusEffect(
    useCallback(() => {
      refreshMeetingsBadge();
      fetchMeetings(false);
    }, [refreshMeetingsBadge, fetchMeetings])
  );

  // ============================================================================
  // ACTION HANDLERS (Task 4)
  // ============================================================================

  const handleRespondToMeeting = useCallback(
    async (meeting: UIMeeting, action: "accept" | "reject", rejectionReason?: string) => {
      if (isActionLoading) return;
      
      try {
        setIsActionLoading(true);
        
        // Use appropriate endpoint based on meeting type
        if (meeting.isVirtual) {
          await meetingService.respondToVirtualMeeting(
            meeting.backendMeetingId,
            action,
            rejectionReason
          );
        } else {
          await meetingService.respondToMeeting(
            meeting.backendMeetingId,
            action,
            rejectionReason
          );
        }
        
        setIsModalVisible(false);
        setSelectedMeeting(null);
        showToast(
          action === "accept" ? "Meeting accepted" : "Meeting declined",
          "success"
        );
        await fetchMeetings(false);
        refreshMeetingsBadge();
      } catch (err: any) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to update meeting";
        showToast(message, "error");
      } finally {
        setIsActionLoading(false);
      }
    },
    [fetchMeetings, isActionLoading, showToast, refreshMeetingsBadge]
  );

  const handleCancelMeeting = useCallback(
    async (meeting: UIMeeting, reason = "Cancelled by requester") => {
      if (isActionLoading) return;
      try {
        setIsActionLoading(true);
        
        // Use appropriate endpoint based on meeting type
        if (meeting.isVirtual) {
          await meetingService.cancelVirtualMeeting(
            meeting.backendMeetingId,
            reason
          );
        } else {
          await meetingService.cancelMeeting(meeting.backendMeetingId, reason);
        }
        
        showToast("Meeting cancelled", "success");
        setIsModalVisible(false);
        setSelectedMeeting(null);
        await fetchMeetings(false);
        refreshMeetingsBadge();
      } catch (err: any) {
        let message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to cancel meeting";
        
        // Handle 404 - meeting might already be cancelled
        if (err instanceof ApiClientError && err.responseCode === 404) {
          if (err.message?.includes("already cancelled") || err.message?.includes("not found")) {
            message = "This meeting is already cancelled or doesn't exist.";
            // Close modal and refresh even on 404 (meeting already cancelled)
            setIsModalVisible(false);
            setSelectedMeeting(null);
            showToast(message, "error");
            await fetchMeetings(false);
            refreshMeetingsBadge();
            return; // Exit early - already handled the error
          }
        }
        
        showToast(message, "error");
      } finally {
        setIsActionLoading(false);
      }
    },
    [fetchMeetings, isActionLoading, showToast, refreshMeetingsBadge]
  );

  /**
   * Handle updating a meeting (edit/reschedule)
   * Updates both reason (description) and slot_id (if rescheduled)
   */
  const handleUpdateMeeting = useCallback(
    async (
      meeting: UIMeeting,
      updateData: {
        title: string;
        meetingType: "physical" | "virtual";
        tableNumber?: string;
        meetingLink?: string;
        time: string;
        date: string;
        description: string;
        slotId?: number; // Selected slot ID for rescheduling (for physical) or time selection (for virtual)
      }
    ) => {
      if (isActionLoading) return;
      try {
        setIsActionLoading(true);
        
        // Handle virtual meeting updates
        if (meeting.isVirtual || updateData.meetingType === "virtual") {
          // Parse time from format "10:00 AM - 10:20 AM" to "10:00:00"
          const parseTimeFromDisplay = (timeDisplay: string): string => {
            try {
              // Extract start time (first part before " - ")
              const startTimeStr = timeDisplay.split(" - ")[0].trim();
              // Parse "10:00 AM" format to "10:00:00"
              const [timePart, period] = startTimeStr.split(" ");
              const [hours, minutes] = timePart.split(":");
              let hour24 = parseInt(hours, 10);
              if (period?.toUpperCase() === "PM" && hour24 !== 12) {
                hour24 += 12;
              } else if (period?.toUpperCase() === "AM" && hour24 === 12) {
                hour24 = 0;
              }
              return `${hour24.toString().padStart(2, "0")}:${minutes}:00`;
            } catch {
              // Fallback: assume it's already in HH:MM:SS format
              return "10:00:00";
            }
          };

          // Calculate duration from time range (default 20 minutes)
          const calculateDuration = (timeDisplay: string): number => {
            try {
              const parts = timeDisplay.split(" - ");
              if (parts.length === 2) {
                const start = parts[0].trim();
                const end = parts[1].trim();
                // Simple calculation - extract hours and minutes
                const parseTime = (timeStr: string) => {
                  const [timePart, period] = timeStr.split(" ");
                  const [hours, minutes] = timePart.split(":");
                  let hour24 = parseInt(hours, 10);
                  if (period?.toUpperCase() === "PM" && hour24 !== 12) {
                    hour24 += 12;
                  } else if (period?.toUpperCase() === "AM" && hour24 === 12) {
                    hour24 = 0;
                  }
                  return hour24 * 60 + parseInt(minutes, 10);
                };
                const startMinutes = parseTime(start);
                const endMinutes = parseTime(end);
                return Math.max(15, endMinutes - startMinutes); // Minimum 15 minutes
              }
            } catch {
              // Fallback
            }
            return 20; // Default 20 minutes
          };

          const virtualUpdateRequest: {
            reason?: string;
            meeting_link?: string;
            scheduled_date?: string;
            scheduled_time?: string;
            duration_minutes?: number;
            metadata?: any;
          } = {
            reason: updateData.description,
          };

          // Always include meeting_link if provided (for updates)
          if (updateData.meetingLink !== undefined) {
            virtualUpdateRequest.meeting_link = updateData.meetingLink.trim() || undefined;
          }

          // Parse date from label format to YYYY-MM-DD if needed
          let parsedDate = updateData.date;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(updateData.date)) {
            const parsed = parseDateLabel(updateData.date);
            if (parsed) {
              parsedDate = parsed;
            }
          }

          // Always include scheduled_date and scheduled_time for virtual meetings (required fields)
          // Parse date from label format to YYYY-MM-DD if needed
          virtualUpdateRequest.scheduled_date = parsedDate; // Should be YYYY-MM-DD
          virtualUpdateRequest.scheduled_time = parseTimeFromDisplay(updateData.time);
          virtualUpdateRequest.duration_minutes = calculateDuration(updateData.time);

          // Build complete metadata object - backend requires all metadata fields to be sent together
          // This matches the structure used when creating meetings (see ConnectionsScreen)
          virtualUpdateRequest.metadata = {
            title: updateData.title,
            meetingType: "Virtual",
            selectedDate: parsedDate, // Use parsed date in YYYY-MM-DD format
            selectedTime: updateData.time, // Keep original time format "8:00 AM - 8:20 AM"
          };

          const updatedMeeting = await meetingService.updateVirtualMeeting(meeting.backendMeetingId, virtualUpdateRequest);
        } else {
          // Handle physical meeting updates
          const updateRequest: { reason?: string; slot_id?: number; metadata?: any } = {
            reason: updateData.description,
          };
          
          // If slot_id is provided (user selected a new time/table), include it for rescheduling
          if (updateData.slotId) {
            updateRequest.slot_id = updateData.slotId;
          }

          // Build complete metadata object - backend requires all metadata fields to be sent together
          // This matches the structure used when creating meetings (see ConnectionsScreen)
          // Get table number from location if it exists
          const tableNumber = updateData.tableNumber || 
            (meeting.location?.startsWith("Table ") 
              ? meeting.location.replace("Table ", "") 
              : meeting.location);
          
          updateRequest.metadata = {
            title: updateData.title,
            meetingType: "Physical",
            selectedDate: (() => {
              // Parse date from display format back to YYYY-MM-DD if needed
              let parsedDate = updateData.date;
              if (!/^\d{4}-\d{2}-\d{2}$/.test(updateData.date)) {
                const parsed = parseDateLabel(updateData.date);
                if (parsed) {
                  parsedDate = parsed;
                }
              }
              return parsedDate;
            })(),
            selectedTime: updateData.time, // Keep original time format "8:00 AM - 8:20 AM"
            ...(tableNumber && { tableNumber: tableNumber }),
          };

          // For physical meetings, if date changed, we need to find a slot on that date
          // The slot_id should already be set from the time/table selection, but if date changed
          // and no new slot_id is provided, we might need to handle it
          // For now, slot_id is the primary way to reschedule physical meetings
          
          const updatedMeeting = await meetingService.updateMeeting(meeting.backendMeetingId, updateRequest);
        }
        
        // Show toast first (before closing modal to ensure it displays)
        showToast("Meeting updated successfully", "success", 3000);
        
        // Close modal after a brief delay to allow toast to appear
        setTimeout(() => {
          setIsModalVisible(false);
          setSelectedMeeting(null);
        }, 100);
        
        // Refresh after modal closes and toast is visible
        setTimeout(async () => {
          await fetchMeetings(false);
        }, 800);
      } catch (err: any) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to update meeting";
        showToast(message, "error");
      } finally {
        setIsActionLoading(false);
      }
    },
    [fetchMeetings, isActionLoading, showToast]
  );

  // Calculate counts for each tab
  const tabCounts = meetingCounts;

  // Calculate inbound/outbound counts for current primary tab status
  // This shows counts for the current primary tab (requests/scheduled/cancelled)
  // Counts should always be visible regardless of which secondary tab is selected
  // so users can see "3 inbound, 2 outbound" even when viewing only inbound
  const getSecondaryTabCounts = useCallback(() => {
    let meetingsForStatus: UIMeeting[];
    if (primaryTab === "requests") {
      meetingsForStatus = allMeetingsForCounts.filter((m) => m.status === "pending");
    } else if (primaryTab === "scheduled") {
      meetingsForStatus = allMeetingsForCounts.filter((m) => m.status === "accepted");
    } else {
      meetingsForStatus = allMeetingsForCounts.filter((m) => isTerminated(m));
    }

    // Count inbound and outbound for this status
    const inboundCount = meetingsForStatus.filter((m) => m.isInbound).length;
    const outboundCount = meetingsForStatus.filter((m) => !m.isInbound).length;

    return { inbound: inboundCount, outbound: outboundCount };
  }, [primaryTab, allMeetingsForCounts, isTerminated]);

  const secondaryTabCounts = getSecondaryTabCounts();

  return (
    <View className="flex-1 bg-white">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
        hasUnreadNotifications={hasUnreadNotifications}
      />

      {/* Fixed Primary Tab Navigation */}
      <View className="px-4 pt-4 pb-3 bg-white">
        <View className="bg-gray-100 rounded-xl p-1 flex-row">
          <TabButton
            label="Requests"
            count={tabCounts.requests}
            isActive={primaryTab === "requests"}
            onPress={() => {
              // Clear selected meeting and close modal when switching tabs
              setSelectedMeeting(null);
              setIsModalVisible(false);
              setIsParticipantModalVisible(false);
              setPrimaryTab("requests");
            }}
          />
          <TabButton
            label="Scheduled"
            count={tabCounts.scheduled}
            isActive={primaryTab === "scheduled"}
            onPress={() => {
              // Clear selected meeting and close modal when switching tabs
              setSelectedMeeting(null);
              setIsModalVisible(false);
              setIsParticipantModalVisible(false);
              setPrimaryTab("scheduled");
            }}
          />
          <TabButton
            label="Cancelled"
            count={tabCounts.cancelled}
            isActive={primaryTab === "cancelled"}
            onPress={() => {
              setSelectedMeeting(null);
              setIsModalVisible(false);
              setIsCancelledDetailModalVisible(false);
              setIsParticipantModalVisible(false);
              setPrimaryTab("cancelled");
            }}
          />
        </View>
      </View>

      {/* Fixed Secondary Tab Navigation */}
      <View className="px-4 border-b border-gray-300 bg-white">
        <View className="flex-row">
          <SecondaryTabButton
            label="Inbound"
            icon={<ArrowDownRedIcon size={16} color="#FF0000" />}
            isActive={secondaryTab === "inbound"}
            count={secondaryTabCounts.inbound}
            onPress={() => setSecondaryTab("inbound")}
          />
          <SecondaryTabButton
            label="Outbound"
            icon={<ArrowUpGreenIcon size={16} color="#008000" />}
            isActive={secondaryTab === "outbound"}
            count={secondaryTabCounts.outbound}
            onPress={() => setSecondaryTab("outbound")}
          />
        </View>
      </View>

      {/* Scrollable Meeting Cards */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => fetchMeetings(true)}
            tintColor="#1BB273"
            colors={["#1BB273"]}
          />
        }
      >
        <View className="px-4 pt-4 flex-1">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-12">
              <LoadingSpinner size="large" />
              <Text className="text-base text-neutral-500 mt-4">
                Loading meetings...
              </Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center px-4 py-12">
              <Text className="text-base text-neutral-500 text-center mb-4">
                {error}
              </Text>
              <Pressable
                onPress={() => fetchMeetings(false)}
                className="bg-neutral-900 rounded-xl px-6 py-3"
              >
                <Text className="text-white font-semibold">Retry</Text>
              </Pressable>
            </View>
          ) : meetings.length === 0 && primaryTab === "cancelled" ? (
            <EmptyCancelledMeetings />
          ) : meetings.length === 0 ? (
            <View className="flex-1 items-center justify-center py-12 px-4">
              <Text className="text-base text-neutral-500 text-center">
                No meetings found
              </Text>
            </View>
          ) : primaryTab === "scheduled" ? (
            meetings.map((meeting) => (
              <ScheduledMeetingCard
                key={meeting.id}
                title={meeting.title}
                participantName={meeting.participantName}
                company={meeting.company}
                date={meeting.date}
                startTime={meeting.startTime}
                endTime={meeting.endTime}
                meetingType={meeting.meetingType || "physical"}
                timeUntil={meeting.timeUntil || "Soon"}
                onPress={() => {
                  setIsParticipantModalVisible(false); // Reset participant modal
                  setSelectedMeeting(meeting);
                  setIsModalVisible(true);
                }}
              />
            ))
          ) : primaryTab === "cancelled" ? (
            meetings.map((meeting) => (
              <CancelledMeetingCard
                key={meeting.id}
                title={meeting.title}
                participantName={meeting.participantName}
                company={meeting.company}
                date={meeting.date}
                startTime={meeting.startTime}
                endTime={meeting.endTime}
                meetingType={meeting.meetingType || "physical"}
                onPress={() => {
                  setSelectedMeeting(meeting);
                  setIsCancelledDetailModalVisible(true);
                }}
              />
            ))
          ) : (
            meetings.map((meeting) => (
              <MeetingCard
                key={meeting.id}
                title={meeting.title}
                participantName={meeting.participantName}
                company={meeting.company}
                date={meeting.date}
                startTime={meeting.startTime}
                endTime={meeting.endTime}
                location={meeting.location}
                meetingType={meeting.meetingType || "physical"}
                meetingLink={meeting.meetingLink}
                status={meeting.status === "pending" ? "pending" : meeting.status === "accepted" ? "approved" : "cancelled"}
                approvalMessage={meeting.approvalMessage}
                expiresIn={meeting.expiresIn}
                onPress={() => {
                  setIsParticipantModalVisible(false); // Reset participant modal
                  setSelectedMeeting(meeting);
                  setIsModalVisible(true);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Meetings"
          onNavigate={(route) => {
            if (route === "Home") {
              navigation.navigate("Home");
            } else if (route === "Attendees") {
              navigation.navigate("Attendees");
            } else if (route === "Schedule") {
              navigation.navigate("Schedule");
            } else if (route === "Meetings") {
              // Already on Meetings screen
            } else if (route === "Connections") {
              navigation.navigate("Connections");
            } else {
              console.log(`Navigate to ${route}`);
            }
          }}
        />
      </SafeAreaView>

      {/* Inbound Meeting Modal */}
      {selectedMeeting &&
        secondaryTab === "inbound" &&
        primaryTab === "requests" && (
          <InboundMeetingModal
            key={`inbound-${selectedMeeting.id}`}
            visible={isModalVisible}
            onClose={() => {
              setIsModalVisible(false);
              setSelectedMeeting(null);
            }}
            title={selectedMeeting.title}
            date={selectedMeeting.date}
            startTime={selectedMeeting.startTime}
            endTime={selectedMeeting.endTime}
            location={selectedMeeting.location}
            meetingType={selectedMeeting.meetingType || "physical"}
            meetingLink={selectedMeeting.meetingLink}
            participantName={selectedMeeting.participantName}
            participantRole={selectedMeeting.participantRole || "Participant"}
            participantCompany={selectedMeeting.company}
            description={selectedMeeting.description}
            expiresIn={selectedMeeting.expiresIn}
            onParticipantPress={() => {
              setIsParticipantModalVisible(true);
            }}
            showParticipantDetail={isParticipantModalVisible}
            participantTags={selectedMeeting.tags}
            participantBio={selectedMeeting.bio}
            participantInterests={selectedMeeting.interests}
            participantSocialLabel={selectedMeeting.socialLabel}
            participantLinkedInUrl={selectedMeeting.linkedInUrl}
            participantAvatar={selectedMeeting.participantAvatar}
            onCloseParticipantDetail={() => {
              setIsParticipantModalVisible(false);
            }}
            onAccept={() => handleRespondToMeeting(selectedMeeting, "accept")}
            onDecline={(reason) => handleRespondToMeeting(selectedMeeting, "reject", reason)}
          />
        )}

      {/* Outbound Meeting Modal */}
      {selectedMeeting &&
        secondaryTab === "outbound" &&
        primaryTab === "requests" && (
          <OutboundMeetingModal
            visible={isModalVisible}
            onClose={() => {
              setIsModalVisible(false);
              setSelectedMeeting(null);
            }}
            title={selectedMeeting.title}
            date={selectedMeeting.date}
            startTime={selectedMeeting.startTime}
            endTime={selectedMeeting.endTime}
            location={selectedMeeting.location || "TBD"}
            meetingType={selectedMeeting.meetingType}
            meetingLink={selectedMeeting.meetingLink}
            participantName={selectedMeeting.participantName}
            participantRole={selectedMeeting.participantRole || "Participant"}
            participantCompany={selectedMeeting.company}
            description={selectedMeeting.description}
            expiresIn={selectedMeeting.expiresIn}
            onParticipantPress={() => {
              setIsParticipantModalVisible(true);
            }}
            showParticipantDetail={isParticipantModalVisible}
            participantTags={selectedMeeting.tags}
            participantBio={selectedMeeting.bio}
            participantInterests={selectedMeeting.interests}
            participantSocialLabel={selectedMeeting.socialLabel}
            participantAvatar={selectedMeeting.participantAvatar}
            onCloseParticipantDetail={() => {
              setIsParticipantModalVisible(false);
            }}
            onEdit={(editData) => {
              if (selectedMeeting) {
                handleUpdateMeeting(selectedMeeting, editData);
              }
            }}
            onCancel={() => {
              setIsModalVisible(false);
              setSelectedMeeting(null);
            }}
            onConfirmCancel={(reason) => handleCancelMeeting(selectedMeeting, reason)}
          />
        )}

      {/* Scheduled Meeting Modal */}
      {selectedMeeting && primaryTab === "scheduled" && (
        <ScheduledMeetingModal
          visible={isModalVisible}
          onClose={() => {
            setIsParticipantModalVisible(false); // Close participant modal when meeting modal closes
            setIsModalVisible(false);
            setSelectedMeeting(null);
          }}
          title={selectedMeeting.title}
          date={selectedMeeting.date}
          startTime={selectedMeeting.startTime}
          endTime={selectedMeeting.endTime}
          location={selectedMeeting.location}
          meetingLink={selectedMeeting.meetingLink}
          meetingType={selectedMeeting.meetingType || "physical"}
          participantName={selectedMeeting.participantName}
          participantRole={selectedMeeting.participantRole || "Participant"}
          participantCompany={selectedMeeting.company}
          description={selectedMeeting.description}
          isOutbound={secondaryTab === "outbound"}
          onParticipantPress={() => {
            setIsParticipantModalVisible(true);
          }}
          showParticipantDetail={isParticipantModalVisible}
          participantTags={selectedMeeting.tags || []}
          participantBio={selectedMeeting.bio}
          participantInterests={selectedMeeting.interests || []}
          participantSocialLabel={selectedMeeting.socialLabel}
          participantLinkedInUrl={selectedMeeting.linkedInUrl}
          participantAvatar={selectedMeeting.participantAvatar}
          onCloseParticipantDetail={() => {
            setIsParticipantModalVisible(false);
          }}
          onEdit={(editData) => {
            if (selectedMeeting) {
              handleUpdateMeeting(selectedMeeting, editData);
            }
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedMeeting(null);
          }}
          onConfirmCancel={(reason) => handleCancelMeeting(selectedMeeting, reason)}
          onLeaveFeedback={async () => {
            // ============================================================================
            // EXTERNAL LINK: Leave Feedback
            // ============================================================================
            // Integration point for meeting feedback submission.
            // Options:
            // - Option A: Use backend API endpoint (when available):
            //   await meetingService.submitMeetingFeedback(selectedMeeting.backendMeetingId, feedbackText)
            // - Option B: Open external feedback form URL:
            //   await Linking.openURL(FEEDBACK_FORM_URL)
            // - Option C: Use event-specific feedback URL from metadata:
            //   const feedbackUrl = selectedMeeting.metadata?.feedbackUrl || FEEDBACK_FORM_URL
            //   await Linking.openURL(feedbackUrl)
            //
            // Current: Uses LeaveFeedbackModal for UI, backend integration pending
            // ============================================================================
          }}
        />
      )}

      {/* Cancelled Meeting Detail Modal - read-only view */}
      {selectedMeeting && primaryTab === "cancelled" && (
        <CancelledMeetingDetailModal
          visible={isCancelledDetailModalVisible}
          onClose={() => {
            setIsCancelledDetailModalVisible(false);
            setSelectedMeeting(null);
          }}
          title={selectedMeeting.title}
          participantName={selectedMeeting.participantName}
          company={selectedMeeting.company}
          date={selectedMeeting.date}
          startTime={selectedMeeting.startTime}
          endTime={selectedMeeting.endTime}
          meetingType={selectedMeeting.meetingType || "physical"}
          location={selectedMeeting.location}
          meetingLink={selectedMeeting.meetingLink}
          description={selectedMeeting.description}
        />
      )}

      {/* Toast Component */}
      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
    </View>
  );
}
