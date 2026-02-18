import React, { useCallback } from "react";
import { View, ScrollView, Pressable, Linking, Alert, Text, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  HeaderBar,
  BottomNavigation,
  EventCard,
  DropdownButton,
  TimeZoneAlertBanner,
  FilterModal,
  LoadingSpinner,
  EventViewModal,
  LeaveFeedbackModal,
  FeedbackSentModal,
  ParticipantDetailModal,
  type FilterCategory,
  type Speaker,
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
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { navigate as navigateRef } from "../navigation/navigationRef";
import { useChecklist } from "../context/ChecklistContext";
import { useMeetingsBadgeContext } from "../context/MeetingsBadgeContext";
import { useNotifications } from "../context/NotificationsContext";
import { useMeetingsBadgeCount } from "../hooks";
import { eventService, type EventSchedule } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";

// ============================================================================
// EXTERNAL LINKS INTEGRATION POINTS - ScheduleScreen
// ============================================================================
// This screen handles external links in the following areas:
//
// 1. "ASK A QUESTION" BUTTON
//    - Location: EventCard component & EventViewModal component
//    - Action: Click button → Open external question form URL
//    - Implementation: handleAskQuestion() uses Linking.openURL(QUESTION_FORM_URL)
//    - URL Source Options:
//      a) From event metadata: schedule.metadata.questionUrl
//      b) From event config: event.metadata.questionUrl
//      c) From global config: QUESTION_FORM_URL constant
//    - Status: ✅ Implemented, ready for backend URL integration
//
// 2. "LEAVE FEEDBACK" BUTTON
//    - Location: EventCard component & EventViewModal component
//    - Action: Click button → Open external feedback form URL
//    - Implementation: handleLeaveFeedback() uses Linking.openURL(FEEDBACK_FORM_URL)
//    - URL Source Options:
//      a) From event metadata: schedule.metadata.feedbackUrl
//      b) From event config: event.metadata.feedbackUrl
//      c) From global config: FEEDBACK_FORM_URL constant
//    - Status: ✅ Implemented, ready for backend URL integration
//
// 3. LINKEDIN PROFILE LINKS (Future)
//    - Location: EventViewModal → Speaker cards (if speakers have LinkedIn)
//    - Action: Click speaker LinkedIn → Open speaker's LinkedIn profile
//    - Implementation: Would use Linking.openURL() with speaker.linkedInUrl
//    - Status: ⚠️ Not yet implemented (waiting for backend speaker data with LinkedIn URLs)
//
// ============================================================================

export default function ScheduleScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const meetingsBadgeCount = useMeetingsBadgeCount();
  const { refresh: refreshMeetingsBadge } = useMeetingsBadgeContext();
  const { hasUnreadNotifications } = useNotifications();
  const [selectedStage, setSelectedStage] =
    React.useState<string>("main-stage");
  const [isFilterModalVisible, setIsFilterModalVisible] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  interface EventData {
    id: string;
    title: string;
    stage: string;
    day: string;
    startTime: string;
    endTime: string;
    sponsoredBy?: { name: string; color: "blue" | "purple" };
    speakers?: Speaker[];
    description?: string;
  }

  const [selectedEvent, setSelectedEvent] = React.useState<EventData | null>(
    null
  );
  const [isEventViewModalVisible, setIsEventViewModalVisible] =
    React.useState(false);
  const [isLeaveFeedbackModalVisible, setIsLeaveFeedbackModalVisible] =
    React.useState(false);
  const [isFeedbackSentModalVisible, setIsFeedbackSentModalVisible] =
    React.useState(false);
  const [selectedSpeaker, setSelectedSpeaker] = React.useState<Speaker | null>(
    null
  );
  const [isSpeakerDetailVisible, setIsSpeakerDetailVisible] =
    React.useState(false);

  // State for API data
  const [events, setEvents] = React.useState<EventData[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [refreshing, setRefreshing] = React.useState(false);
  // Speaker cache: Map of speaker ID -> full speaker object
  const speakerCacheRef = React.useRef<Map<number, any>>(new Map());

  // ============================================================================
  // EXTERNAL LINKS CONFIGURATION
  // ============================================================================
  // These URLs will be used for external link buttons in the ScheduleScreen.
  // Integration points:
  // 1. "Ask a question" button (EventCard & EventViewModal) → QUESTION_FORM_URL
  // 2. "Leave feedback" button (EventCard & EventViewModal) → FEEDBACK_FORM_URL
  //
  // TODO: Backend Integration Options:
  // - Option A: Store URLs in event metadata (schedule.metadata.questionUrl, schedule.metadata.feedbackUrl)
  // - Option B: Store URLs in event config (event.metadata.questionUrl, event.metadata.feedbackUrl)
  // - Option C: Use global config/env variables for default URLs
  // - Option D: Fetch from dedicated API endpoint (e.g., GET /events/{id}/links/)
  //
  // Current implementation: Uses placeholder URLs, will be replaced with backend data
  // ============================================================================
  const QUESTION_FORM_URL = "https://example.com/ask-question"; // TODO: Replace with backend URL
  const FEEDBACK_FORM_URL = "https://example.com/leave-feedback"; // TODO: Replace with backend URL

  /**
   * Fetch all speakers for the event and cache them
   */
  const fetchAndCacheSpeakers = React.useCallback(async () => {
    try {
      // Fetch all speakers for the event (with a large page size to get all)
      const response = await eventService.getEventSpeakers(EVENT_ID, {
        page_size: 1000, // Large page size to get all speakers
      });

      // Cache speakers by ID
      if (response && response.speakers && Array.isArray(response.speakers)) {
        response.speakers.forEach((speaker) => {
          if (speaker && speaker.id) {
            speakerCacheRef.current.set(speaker.id, speaker);
          }
        });
      }
    } catch (err: any) {
      // Silently fail - we can still show schedules without speaker details
    }
  }, []);

  /**
   * Map EventSchedule (backend) to EventData (UI format)
   */
  const mapEventScheduleToEventData = (schedule: EventSchedule): EventData => {
    // Parse start_time and end_time (ISO 8601 format)
    const startDate = new Date(schedule.start_time);
    const endDate = new Date(schedule.end_time);

    // Format time as "10:00 AM"
    const formatTime = (date: Date): string => {
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const period = hours >= 12 ? "PM" : "AM";
      const hour12 = hours % 12 || 12;
      const minutesStr = minutes.toString().padStart(2, "0");
      return `${hour12}:${minutesStr} ${period}`;
    };

    // Format day as "Day 1", "Day 2", etc. based on event date
    const formatDay = (date: Date): string => {
      // For now, use a simple day calculation
      // You might want to use event.dates or calculate based on event start date
      const eventObj = typeof schedule.event === "object" ? schedule.event : null;
      const eventDate = eventObj?.date ? new Date(eventObj.date) : date;
      const daysDiff = Math.floor((date.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24));
      return `Day ${daysDiff + 1}`;
    };

    // Extract stage from venue or metadata
    const eventObj = typeof schedule.event === "object" ? schedule.event : null;
    const stage = schedule.venue || eventObj?.venue || "Main Stage";
    
    // Extract sponsoredBy from metadata if available
    const sponsoredBy = schedule.metadata?.sponsoredBy || eventObj?.metadata?.sponsoredBy;

    // Extract speakers - schedule.speakers is an array of speaker IDs
    let speakers: Speaker[] = [];
    if (schedule.speakers && Array.isArray(schedule.speakers)) {
      // Map speaker IDs to full speaker objects using the cache
      speakers = schedule.speakers
        .map((speakerId: number | any) => {
          // Check if it's already a full speaker object (fallback)
          if (speakerId && typeof speakerId === "object" && speakerId.name) {
            return speakerId;
          }
          
          // If it's an ID, look it up in cache
          if (typeof speakerId === "number") {
            const cached = speakerCacheRef.current.get(speakerId);
            if (cached) {
              // Map backend Speaker format to UI Speaker format
              return {
                id: cached.id.toString(),
                name: cached.full_name || "",
                affiliation: [cached.role, cached.company].filter(Boolean).join(" · ") || "",
                bio: cached.description || "",
                interests: [],
                tags: [],
                socialLabel: cached.linkedin_url || cached.website_url || "",
              };
            }
          }
          
          return null;
        })
        .filter((speaker): speaker is Speaker => speaker !== null);
    }


    return {
      id: `schedule-${schedule.id}`,
      title: schedule.name,
      stage: stage,
      day: formatDay(startDate),
      startTime: formatTime(startDate),
      endTime: formatTime(endDate),
      sponsoredBy: sponsoredBy ? {
        name: sponsoredBy.name || "",
        color: (sponsoredBy.color || "blue") as "blue" | "purple",
      } : undefined,
      speakers: speakers,
      description: schedule.description || (typeof schedule.event === "object" ? schedule.event.description : undefined),
    };
  };

  /**
   * Fetch event schedules from API
   */
  const fetchEventSchedules = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Build filters based on selected stage and filters
      const filters: { search?: string; ordering?: string } = {};
      
      // Map UI stage values to backend venue values for filtering
      const stageMapping: Record<string, string> = {
        "main-stage": "Main Stage",
        "enterprise-stage": "Enterprise Stage",
        "future-stage": "Future Stage",
        "mentor-hours": "Mentor Hours",
        "city-circle": "City Circle",
      };
      const selectedVenue = stageMapping[selectedStage] || "Main Stage";

      // First, fetch and cache all speakers for the event
      await fetchAndCacheSpeakers();

      const response = await eventService.getEventSchedules(EVENT_ID, filters);
      
      // Map backend schedules to UI format
      let mappedEvents = response.schedules.map(mapEventScheduleToEventData);
      
      // Filter by stage/venue client-side (since backend might not support venue filtering)
      // Match venue from schedule.venue or schedule.event.venue
      mappedEvents = mappedEvents.filter((event) => {
        // Check if event stage matches selected stage
        return event.stage === selectedVenue;
      });
      
      setEvents(mappedEvents);
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load event schedule";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStage, selectedFilters]);

  // Handle pull-to-refresh
  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear speaker cache to force refresh
      speakerCacheRef.current.clear();
      await fetchEventSchedules();
    } catch (err) {
      // Error already handled in fetchEventSchedules
    } finally {
      setRefreshing(false);
    }
  }, [fetchEventSchedules]);

  // Fetch schedules on mount and when filters change
  React.useEffect(() => {
    fetchEventSchedules();
  }, [fetchEventSchedules]);

  useFocusEffect(
    useCallback(() => {
      refreshMeetingsBadge();
    }, [refreshMeetingsBadge])
  );

  // MOCK DATA - Commented out, using backend API now
  /*
  React.useEffect(() => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      const mockEvents: EventData[] = [
        {
          id: "1",
          title: "Opening Keynote: The Future of African Tech",
          stage: "Main Stage",
          day: "Day 1",
          startTime: "10:00 AM",
          endTime: "11:00 AM",
          sponsoredBy: {
            name: "Spark Capital",
            color: "blue" as const,
          },
          speakers: [
            {
              id: "1",
              name: "Dr. Jane Smith",
              affiliation: "VC Partner · TechVentures Inc",
              bio: "Dr. Jane Smith is a seasoned venture capitalist with over 15 years of experience in technology investments. She specializes in early-stage fintech and enterprise SaaS companies across Africa. Jane has led investments in over 50 startups and has been instrumental in scaling some of the continent's most successful tech companies.",
              interests: [
                "Fintech",
                "Enterprise SaaS",
                "AI/ML",
                "Startup Ecosystem",
              ],
              tags: ["VC", "Fintech Expert", "Africa Tech"],
              socialLabel: "jane.smith@techventures.com",
            },
            {
              id: "2",
              name: "Sarah Johnson",
              affiliation: "Founder · Innovation Labs",
              bio: "Sarah Johnson is the founder and CEO of Innovation Labs, a leading technology incubator focused on supporting African entrepreneurs. With a background in software engineering and product management, Sarah has helped launch over 30 successful startups in the past decade.",
              interests: [
                "Product Development",
                "Startup Mentoring",
                "Tech Innovation",
              ],
              tags: ["Founder", "Product Expert", "Mentor"],
              socialLabel: "sarah.johnson@innovationlabs.com",
            },
          ] as Speaker[],
          description:
            "Explore how AI is transforming enterprise operations and what's next.",
        },
        {
          id: "2",
          title: "Building Enterprise-Ready SaaS from Africa",
          stage: "Enterprise Stage",
          day: "Day 1",
          startTime: "11:00 AM",
          endTime: "11:40 AM",
          speakers: [
            {
              id: "3",
              name: "Michael Chen",
              affiliation: "CTO · CloudScale Africa",
              bio: "Michael Chen is the Chief Technology Officer at CloudScale Africa, where he leads a team of 50+ engineers building scalable cloud infrastructure solutions. He has over 12 years of experience in distributed systems and cloud architecture, having previously worked at major tech companies.",
              interests: [
                "Cloud Infrastructure",
                "Distributed Systems",
                "DevOps",
                "Scalability",
              ],
              tags: ["CTO", "Cloud Expert", "Architecture"],
              socialLabel: "michael.chen@cloudscale.africa",
            },
            {
              id: "4",
              name: "Amina Okafor",
              affiliation: "Product Lead · TechBuild",
              bio: "Amina Okafor is a product leader with a passion for building user-centric technology solutions. She has led product teams at several successful startups and has a track record of launching products that have reached millions of users across Africa.",
              interests: [
                "Product Strategy",
                "User Experience",
                "Data Analytics",
                "Growth",
              ],
              tags: ["Product Lead", "UX Expert", "Growth Hacker"],
              socialLabel: "amina.okafor@techbuild.com",
            },
          ] as Speaker[],
          description: "Learn how to build scalable SaaS solutions from Africa.",
        },
        {
          id: "3",
          title: "Meet the ASF Startups",
          stage: "Future Stage",
          day: "Day 2",
          startTime: "2:00 PM",
          endTime: "3:00 PM",
          sponsoredBy: {
            name: "ASF",
            color: "purple" as const,
          },
          speakers: [
            {
              id: "5",
              name: "David Kimani",
              affiliation: "Founder · StartupHub",
              bio: "David Kimani is the visionary founder of StartupHub, a platform connecting African entrepreneurs with investors and resources. He has been featured in Forbes Africa and has mentored hundreds of startups. David is passionate about building the next generation of African tech leaders.",
              interests: [
                "Entrepreneurship",
                "Startup Ecosystem",
                "Investor Relations",
                "Mentoring",
              ],
              tags: ["Founder", "Ecosystem Builder", "Mentor"],
              socialLabel: "david.kimani@startuphub.com",
            },
            {
              id: "6",
              name: "Fatima Bello",
              affiliation: "CEO · Innovation Labs",
              bio: "Fatima Bello is the CEO of Innovation Labs, driving innovation in the African tech space. With a background in business strategy and technology, she has transformed multiple companies and led them to successful exits. Fatima is a sought-after speaker at tech conferences worldwide.",
              interests: [
                "Business Strategy",
                "Tech Innovation",
                "Leadership",
                "Public Speaking",
              ],
              tags: ["CEO", "Strategy Expert", "Speaker"],
              socialLabel: "fatima.bello@innovationlabs.com",
            },
            {
              id: "7",
              name: "James Osei",
              affiliation: "Co-founder · TechVenture",
              bio: "James Osei is the co-founder of TechVenture, a venture capital firm focused on African tech startups. He has invested in over 100 companies and has a deep understanding of the African market. James is known for his hands-on approach to supporting portfolio companies.",
              interests: [
                "Venture Capital",
                "Market Analysis",
                "Startup Investing",
                "Portfolio Management",
              ],
              tags: ["Co-founder", "VC", "Investor"],
              socialLabel: "james.osei@techventure.com",
            },
          ] as Speaker[],
          description: "Discover the next generation of African startups.",
        },
      ];

      // Show all mock events (no filtering) while waiting for backend
      setEvents(mockEvents);
      setIsLoading(false);
    }, 500); // Simulate network delay
  }, [selectedStage]);
  */

  const handleAskQuestion = async (event?: EventData) => {
    try {
      // Use event-specific question URL if available in metadata, otherwise use default
      const questionUrl = event?.description?.includes("question") 
        ? event.description 
        : QUESTION_FORM_URL;
      
      const canOpen = await Linking.canOpenURL(questionUrl);
      if (canOpen) {
        await Linking.openURL(questionUrl);
      } else {
        Alert.alert("Error", "Cannot open the question form URL");
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error opening question form URL:", error);
      }
      Alert.alert("Error", "Failed to open question form");
    }
  };

  const handleLeaveFeedback = async (event?: EventData) => {
    try {
      // Use event-specific feedback URL if available in metadata, otherwise use default
      const feedbackUrl = event?.description?.includes("feedback")
        ? event.description
        : FEEDBACK_FORM_URL;
      
      const canOpen = await Linking.canOpenURL(feedbackUrl);
      if (canOpen) {
        await Linking.openURL(feedbackUrl);
      } else {
        Alert.alert("Error", "Cannot open the feedback form URL");
      }
    } catch (error) {
      if (__DEV__) {
        console.error("Error opening feedback form URL:", error);
      }
      Alert.alert("Error", "Failed to open feedback form");
    }
  };

  const stageOptions = [
    { label: "Main Stage", value: "main-stage" },
    { label: "Enterprise Stage", value: "enterprise-stage" },
    { label: "Future Stage", value: "future-stage" },
    { label: "Mentor Hours", value: "mentor-hours" },
    { label: "City Circle", value: "city-circle" },
  ];

  const filterCategories: FilterCategory[] = [
    {
      id: "days",
      title: "Days",
      options: [
        { id: "26th June, 2026", label: "26th June, 2026" },
        { id: "27th June, 2026", label: "27th June, 2026" },
      ],
    },
  ];

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


  return (
    <View className="flex-1 bg-white">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
        hasUnreadNotifications={hasUnreadNotifications}
      />

      {/* Fixed Header Section */}
      <View>
        {/* Time Zone Alert Banner */}
        <TimeZoneAlertBanner />

        {/* Filter Controls */}
        <View className="flex-row items-center justify-center mb-4 px-4 pt-4 gap-3">
          <DropdownButton
            label="Main Stage"
            icon="list"
            options={stageOptions}
            selectedValue={selectedStage}
            onSelect={(value) => {
              setSelectedStage(value);
              // Refetch events when stage changes (handled by useEffect)
            }}
            width="65%"
          />
          <DropdownButton
            label="Filter"
            icon="filter"
            onPress={() => setIsFilterModalVisible(true)}
            width="30%"
          />
        </View>
      </View>

      {/* Scrollable Event Cards */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1BB273"
            colors={["#1BB273"]}
          />
        }
      >
        <View className="px-4">
          {isLoading ? (
            <View className="flex-1 items-center justify-center py-20">
              <LoadingSpinner size="large" />
              <Text className="text-gray-500 mt-4">Loading events...</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center py-20 px-4">
              <Text className="text-red-600 text-center mb-4">{error}</Text>
              <Pressable
                onPress={fetchEventSchedules}
                className="bg-black rounded-md px-6 py-3"
              >
                <Text className="text-white font-medium">Retry</Text>
              </Pressable>
            </View>
          ) : events.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Text className="text-gray-500 text-center">
                Schedule is not yet live, kindly check back.
              </Text>
            </View>
          ) : (
            events.map((event) => (
              <Pressable
                key={event?.id || `event-${Math.random()}`}
                onPress={() => {
                  if (event) {
                    setSelectedEvent(event);
                    setIsEventViewModalVisible(true);
                  }
                }}
                style={({ pressed }) => ({
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <EventCard
                  title={event?.title || ""}
                  stage={event?.stage || ""}
                  day={event?.day || ""}
                  startTime={event?.startTime || ""}
                  endTime={event?.endTime || ""}
                  sponsoredBy={event?.sponsoredBy}
                  onAskQuestion={() => handleAskQuestion(event)}
                  onLeaveFeedback={() => handleLeaveFeedback(event)}
                />
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={(filters) => {
          setSelectedFilters(filters);
          // Refetch events when filters change (handled by useEffect)
        }}
        categories={filterCategories}
        initialSelected={selectedFilters}
      />

      {selectedEvent && (
        <EventViewModal
          visible={isEventViewModalVisible && !isSpeakerDetailVisible}
          onClose={() => {
            setIsEventViewModalVisible(false);
            setSelectedEvent(null);
            // Clear speaker state when closing event modal
            setSelectedSpeaker(null);
            setIsSpeakerDetailVisible(false);
          }}
          title={selectedEvent?.title || ""}
          startTime={selectedEvent?.startTime || ""}
          endTime={selectedEvent?.endTime || ""}
          stage={selectedEvent?.stage || ""}
          sponsoredBy={selectedEvent?.sponsoredBy}
          speakers={(selectedEvent?.speakers || []).map((speaker: Speaker) => {
            return {
              ...speaker,
              onPress: () => {
                if (speaker) {
                  // Hide event modal first, then show speaker modal
                  setIsEventViewModalVisible(false);
                  // Set speaker and show modal
                  setSelectedSpeaker(speaker);
                  setIsSpeakerDetailVisible(true);
                }
              },
            };
          })}
          description={selectedEvent?.description}
          onAskQuestion={() => handleAskQuestion(selectedEvent)}
          onLeaveFeedback={() => {
            handleLeaveFeedback(selectedEvent);
            setIsEventViewModalVisible(false);
          }}
        />
      )}

      {/* Note: LeaveFeedbackModal is kept for UI consistency, but feedback is handled via external link */}
      <LeaveFeedbackModal
        visible={isLeaveFeedbackModalVisible}
        onClose={() => setIsLeaveFeedbackModalVisible(false)}
        onSubmit={(feedback: string) => {
          // Feedback is handled via external link (handleLeaveFeedback)
          // This modal can be used for future backend integration
          setIsLeaveFeedbackModalVisible(false);
          setIsFeedbackSentModalVisible(true);
        }}
        eventTitle={selectedEvent?.title}
      />

      <FeedbackSentModal
        visible={isFeedbackSentModalVisible}
        onClose={() => {
          setIsFeedbackSentModalVisible(false);
        }}
        meetingTitle={selectedEvent?.title}
      />

      <ParticipantDetailModal
        visible={isSpeakerDetailVisible && !!selectedSpeaker}
        onClose={() => {
          setIsSpeakerDetailVisible(false);
          setSelectedSpeaker(null);
          // Restore event modal if event is still selected
          if (selectedEvent) {
            setIsEventViewModalVisible(true);
          }
        }}
        name={selectedSpeaker?.name || ""}
        role={(() => {
          // Parse affiliation to extract role (e.g., "VC Partner · TechVentures Inc" -> "VC Partner")
          const affiliation = selectedSpeaker?.affiliation || "";
          const parts = affiliation.split("·");
          const role = parts[0]?.trim() || "";
          return role;
        })()}
        company={(() => {
          // Parse affiliation to extract company (e.g., "VC Partner · TechVentures Inc" -> "TechVentures Inc")
          const affiliation = selectedSpeaker?.affiliation || "";
          const parts = affiliation.split("·");
          const company = parts.length > 1 ? parts[1]?.trim() : "";
          return company;
        })()}
        bio={selectedSpeaker?.bio}
        interests={selectedSpeaker?.interests}
        tags={selectedSpeaker?.tags}
        socialLabel={selectedSpeaker?.socialLabel}
        linkedInUrl={selectedSpeaker?.socialLabel}
      />

      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Schedule"
          onNavigate={(route) => {
            if (route === "Home") {
              navigateRef("Home");
            } else if (route === "Attendees") {
              navigation.navigate("Attendees");
            } else if (route === "Schedule") {
              // Already on Schedule screen
            } else if (route === "Meetings") {
              navigation.navigate("Meetings");
            } else if (route === "Connections") {
              navigation.navigate("Connections");
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
}
