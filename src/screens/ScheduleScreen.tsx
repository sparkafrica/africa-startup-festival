import React from "react";
import { View, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  HeaderBar,
  BottomNavigation,
  EventCard,
  DropdownButton,
  TimeZoneAlertBanner,
  FilterModal,
  EventViewModal,
  LeaveFeedbackModal,
  FeedbackSentModal,
  ScheduleSuccessToast,
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
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useChecklist } from "../context/ChecklistContext";

export default function ScheduleScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const { markAddSessionsComplete } = useChecklist();
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
  const [showScheduleSuccess, setShowScheduleSuccess] = React.useState(false);
  const [addedEventTitle, setAddedEventTitle] = React.useState<string>("");
  const [selectedSpeaker, setSelectedSpeaker] = React.useState<Speaker | null>(
    null
  );
  const [isSpeakerDetailVisible, setIsSpeakerDetailVisible] =
    React.useState(false);

  const stageOptions = [
    { label: "Main Stage", value: "main-stage" },
    { label: "Enterprise Stage", value: "enterprise-stage" },
    { label: "Future Stage", value: "future-stage" },
    { label: "Mentor Hours", value: "mentor-hours" },
    { label: "City Circle", value: "city-circle" },
  ];

  const filterCategories: FilterCategory[] = [
    {
      id: "time",
      title: "Time",
      options: [
        { id: "10:00 AM", label: "10:00 AM" },
        { id: "10:20 AM", label: "10:20 AM" },
        { id: "11:00 AM", label: "11:00 AM" },
        { id: "11:20 AM", label: "11:20 AM" },
        { id: "12:00 PM", label: "12:00 PM" },
        { id: "12:20 PM", label: "12:20 PM" },
      ],
    },
    {
      id: "days",
      title: "Days",
      options: [
        { id: "26th June, 2025", label: "26th June, 2025" },
        { id: "27th June, 2025", label: "27th June, 2025" },
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

  // TODO: BACKEND INTEGRATION - Replace mock event data with API call
  // API Endpoint: GET /api/events
  // Query Params: ?stage={stage}&day={day}&time={time}&page={page}&limit={limit}
  // Response: { events: Event[], total: number, page: number }
  // Real-time: Consider WebSocket for event updates (time changes, cancellations, new events)
  // TODO: BACKEND - Fetch events on component mount and when stage/filters change
  // TODO: BACKEND - Handle pagination/infinite scroll
  // TODO: BACKEND - Cache events in state management
  // TODO: BACKEND - Handle loading and error states
  // Sample event data - replace with actual data from API/state
  const events = [
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

  return (
    <View className="flex-1 bg-white">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
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
              // TODO: BACKEND INTEGRATION - Filter events by stage via API
              // API Call: await api.get(`/events?stage=${value}`)
              // TODO: BACKEND - Refetch events when stage changes
              // TODO: BACKEND - Update URL params for deep linking
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
      >
        <View className="px-4">
          {events.map((event) => (
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
                onAddToSchedule={() => {
                  // TODO: Implement add to schedule functionality
                  // Mark checklist item as completed when user adds a session
                  markAddSessionsComplete();
                  // Show success toast
                  setAddedEventTitle(event?.title || "");
                  setShowScheduleSuccess(true);
                }}
                onLeaveFeedback={() => {
                  setSelectedEvent(event);
                  setIsLeaveFeedbackModalVisible(true);
                }}
              />
            </Pressable>
          ))}
        </View>
      </ScrollView>

      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={(filters) => {
          setSelectedFilters(filters);
          // TODO: Filter events based on selected filters
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
          onAddToSchedule={() => {
            // TODO: Implement add to schedule functionality
            // Mark checklist item as completed when user adds a session
            markAddSessionsComplete();
            // Show success toast
            setAddedEventTitle(selectedEvent?.title || "");
            setShowScheduleSuccess(true);
            setIsEventViewModalVisible(false);
            setSelectedEvent(null);
            // Clear speaker state
            setSelectedSpeaker(null);
            setIsSpeakerDetailVisible(false);
          }}
          onLeaveFeedback={() => {
            setIsEventViewModalVisible(false);
            setIsLeaveFeedbackModalVisible(true);
          }}
        />
      )}

      <LeaveFeedbackModal
        visible={isLeaveFeedbackModalVisible}
        onClose={() => setIsLeaveFeedbackModalVisible(false)}
        onSubmit={(feedback: string) => {
          // TODO: Submit feedback to API
          setIsLeaveFeedbackModalVisible(false);
          // Show confirmation modal after feedback is sent
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

      <ScheduleSuccessToast
        visible={showScheduleSuccess}
        onHide={() => setShowScheduleSuccess(false)}
        eventTitle={addedEventTitle}
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
      />

      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Schedule"
          onNavigate={(route) => {
            if (route === "Home") {
              navigation.navigate("Home");
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
