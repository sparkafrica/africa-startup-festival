import React, { useState, useEffect, useCallback } from "react";
import { View, ScrollView, ActivityIndicator, RefreshControl, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  HeaderBar,
  BottomNavigation,
  MeetingCard,
  ScheduledMeetingCard,
  ScheduledMeetingModal,
  CancelledMeetingCard,
  EmptyCancelledMeetings,
  TabButton,
  SecondaryTabButton,
  ArrowDownRedIcon,
  ArrowUpGreenIcon,
  InboundMeetingModal,
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
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import type {
  RootStackParamList,
  RootStackScreenProps,
} from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import { meetingService, type Meeting as BackendMeeting } from "../services/meetingService";
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
  isInbound: boolean; // Whether current user is requestee (for filtering)
  title: string; // reason from backend
  participantName: string;
  participantRole?: string;
  company: string;
  tags: string[];
  interests: string[];
  socialLabel?: string;
  bio?: string;
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
}

export default function MeetingsScreen({ route }: Props) {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("requests");
  const [secondaryTab, setSecondaryTab] = useState<SecondaryTab>("inbound");
  const [selectedMeeting, setSelectedMeeting] = useState<UIMeeting | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isParticipantModalVisible, setIsParticipantModalVisible] =
    useState(false);
  
  // API state
  const [meetings, setMeetings] = useState<UIMeeting[]>([]);
  const [allMeetings, setAllMeetings] = useState<UIMeeting[]>([]); // Store all meetings for counting
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
   * Extract date from slot (assuming slot has event date info)
   * For now, we'll use today's date or parse from created_at
   * TODO: Backend should provide event date in slot or meeting
   */
  const getMeetingDate = (meeting: BackendMeeting): string => {
    // If created_at exists, extract date
    if (meeting.created_at) {
      return meeting.created_at.split("T")[0];
    }
    // Fallback: use today's date (this should be improved when backend provides event date)
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
   */
  const calculateTimeUntil = (date: string, startTime: string): string => {
    try {
      const [hours, minutes] = startTime.split(":");
      const meetingDateTime = new Date(`${date}T${hours}:${minutes}:00`);
      const now = new Date();
      const diffMs = meetingDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays >= 1) {
        return "Tomorrow";
      } else if (diffHours >= 1) {
        return `In ${Math.floor(diffHours)}hrs`;
      } else if (diffHours > 0) {
        return `In ${Math.floor(diffHours * 60)}mins`;
      } else {
        return "Now";
      }
    } catch {
      return "Soon";
    }
  };

  /**
   * Map backend Meeting to UI-friendly format
   */
  const mapBackendMeetingToUI = (
    backendMeeting: BackendMeeting,
    currentUserId: string
  ): UIMeeting => {
    // Determine if current user is requester or requestee
    const isRequester = backendMeeting.requester === currentUserId;
    const otherUser = isRequester
      ? backendMeeting.requestee_info
      : backendMeeting.requester_info;
    const otherCompany = isRequester
      ? backendMeeting.requestee_company
      : backendMeeting.requester_company;

    // Extract participant info
    const participantName =
      `${otherUser.first_name || ""} ${otherUser.last_name || ""}`.trim() ||
      otherUser.email;
    const participantRole = otherUser.job_title || undefined;
    const company =
      otherCompany?.name ||
      otherUser.organisation ||
      "No Company";

    // Extract tags (country, industry/sector)
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

    // Extract interests
    const interests = otherUser.metadata?.interests || [];

    // Extract bio
    const bio = otherUser.metadata?.bio || "";

    // Extract LinkedIn
    const linkedInUrl =
      otherUser.metadata?.linkedIn || otherUser.metadata?.linkedin_url;
    const socialLabel = linkedInUrl
      ? linkedInUrl.replace("https://www.linkedin.com/in/", "").replace("/", "")
      : undefined;

    // Format time
    const startTime = formatTime(backendMeeting.slot.start_time);
    const endTime = formatTime(backendMeeting.slot.end_time);

    // Get date
    const date = getMeetingDate(backendMeeting);

    // Determine meeting type (physical vs virtual)
    // Backend location field should indicate this
    const isVirtual = backendMeeting.location?.includes("http") || 
                      backendMeeting.location?.includes("meet") ||
                      backendMeeting.location?.includes("zoom") ||
                      backendMeeting.location?.includes("teams");
    const meetingType = isVirtual ? "virtual" : "physical";
    const location = isVirtual ? undefined : backendMeeting.location;
    const meetingLink = isVirtual ? backendMeeting.location : undefined;

    // Calculate expiresIn for pending meetings
    const expiresIn =
      backendMeeting.status === "pending"
        ? calculateExpiresIn(backendMeeting.created_at)
        : undefined;

    // Calculate timeUntil for scheduled meetings
    const timeUntil =
      backendMeeting.status === "accepted"
        ? calculateTimeUntil(date, backendMeeting.slot.start_time)
        : undefined;

    // Determine if inbound (current user is requestee)
    const isInbound = !isRequester;

    return {
      id: `meeting-${backendMeeting.id}`,
      backendMeetingId: backendMeeting.id,
      isInbound,
      title: backendMeeting.reason,
      participantName,
      participantRole,
      company,
      tags,
      interests,
      socialLabel,
      bio,
      date,
      startTime,
      endTime,
      location,
      meetingType,
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
      description: backendMeeting.reason,
    };
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
      const backendMeetings = await meetingService.getMeetings();
      const currentUserId = user.user_id;

      // Map all meetings to UI format
      const uiMeetings = backendMeetings.map((meeting) =>
        mapBackendMeetingToUI(meeting, currentUserId)
      );

      // Store all meetings for counting
      setAllMeetings(uiMeetings);

      // Filter by status and direction based on current tabs
      // Determine status filter
      const statusFilter =
        primaryTab === "requests"
          ? "pending"
          : primaryTab === "scheduled"
          ? "accepted"
          : "cancelled";

      // Filter by status
      let filtered = uiMeetings.filter((m) => m.status === statusFilter);

      // Filter by direction (inbound vs outbound)
      // Inbound = current user is requestee (someone requested meeting with me)
      // Outbound = current user is requester (I requested meeting with someone)
      filtered = filtered.filter((m) => {
        return secondaryTab === "inbound" ? m.isInbound : !m.isInbound;
      });

      setMeetings(filtered);
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
  }, [user?.user_id, primaryTab, secondaryTab]);

  // Fetch meetings on mount and when tabs change
  useEffect(() => {
    fetchMeetings(false);
  }, [fetchMeetings]);

  // ============================================================================
  // ACTION HANDLERS (Task 4)
  // ============================================================================

  const handleRespondToMeeting = useCallback(
    async (meeting: UIMeeting, action: "accept" | "reject") => {
      if (isActionLoading) return;
      try {
        setIsActionLoading(true);
        await meetingService.respondToMeeting(meeting.backendMeetingId, action);
        showToast(
          action === "accept"
            ? "Meeting accepted"
            : "Meeting declined",
          "success"
        );
        setIsModalVisible(false);
        setSelectedMeeting(null);
        await fetchMeetings(false);
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

  const handleCancelMeeting = useCallback(
    async (meeting: UIMeeting, reason = "Cancelled by requester") => {
      if (isActionLoading) return;
      try {
        setIsActionLoading(true);
        await meetingService.cancelMeeting(meeting.backendMeetingId, reason);
        showToast("Meeting cancelled", "success");
        setIsModalVisible(false);
        setSelectedMeeting(null);
        await fetchMeetings(false);
      } catch (err: any) {
        const message =
          err instanceof ApiClientError
            ? err.message
            : "Failed to cancel meeting";
        showToast(message, "error");
      } finally {
        setIsActionLoading(false);
      }
    },
    [fetchMeetings, isActionLoading, showToast]
  );

  // Calculate counts for each tab
  const getTabCounts = () => {
    if (allMeetings.length === 0) {
      return { requests: 0, scheduled: 0, cancelled: 0 };
    }

    const currentUserId = user?.user_id;
    if (!currentUserId) {
      return { requests: 0, scheduled: 0, cancelled: 0 };
    }

    // Count by status (regardless of direction for tab badges)
    const requests = allMeetings.filter((m) => m.status === "pending").length;
    const scheduled = allMeetings.filter((m) => m.status === "accepted").length;
    const cancelled = allMeetings.filter((m) => m.status === "cancelled").length;

    return { requests, scheduled, cancelled };
  };

  const tabCounts = getTabCounts();

  return (
    <View className="flex-1 bg-white">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
      />

      {/* Fixed Primary Tab Navigation */}
      <View className="px-4 pt-4 pb-3 bg-white">
        <View className="bg-gray-100 rounded-xl p-1 flex-row">
          <TabButton
            label="Requests"
            count={tabCounts.requests}
            isActive={primaryTab === "requests"}
            onPress={() => setPrimaryTab("requests")}
          />
          <TabButton
            label="Scheduled"
            count={tabCounts.scheduled}
            isActive={primaryTab === "scheduled"}
            onPress={() => setPrimaryTab("scheduled")}
          />
          <TabButton
            label="Cancelled"
            isActive={primaryTab === "cancelled"}
            onPress={() => setPrimaryTab("cancelled")}
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
            onPress={() => setSecondaryTab("inbound")}
          />
          <SecondaryTabButton
            label="Outbound"
            icon={<ArrowUpGreenIcon size={16} color="#008000" />}
            isActive={secondaryTab === "outbound"}
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
              <ActivityIndicator size="large" color="#1BB273" />
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
                  // Show cancelled meeting details (optional - could show modal)
                  setIsParticipantModalVisible(false);
                  setSelectedMeeting(meeting);
                  setIsModalVisible(true);
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
                location={meeting.location || "TBD"}
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
            onCloseParticipantDetail={() => {
              setIsParticipantModalVisible(false);
            }}
            onAccept={() => handleRespondToMeeting(selectedMeeting, "accept")}
            onDecline={() => handleRespondToMeeting(selectedMeeting, "reject")}
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
            onCloseParticipantDetail={() => {
              setIsParticipantModalVisible(false);
            }}
            onEdit={() => {
              // Future enhancement: reschedule/update slot
            }}
            onCancel={() => handleCancelMeeting(selectedMeeting)}
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
          onCloseParticipantDetail={() => {
            setIsParticipantModalVisible(false);
          }}
          onEdit={() => {
            // Future enhancement: reschedule/update slot
          }}
          onCancel={() => {
            handleCancelMeeting(selectedMeeting);
            setIsModalVisible(false);
            setSelectedMeeting(null);
          }}
          onLeaveFeedback={() => {
            // TODO: Handle leave feedback (future task)
          }}
        />
      )}
    </View>
  );
}
