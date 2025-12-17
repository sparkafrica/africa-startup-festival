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

export default function ScheduleScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const [selectedStage, setSelectedStage] =
    React.useState<string>("main-stage");
  const [isFilterModalVisible, setIsFilterModalVisible] = React.useState(false);
  const [selectedFilters, setSelectedFilters] = React.useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = React.useState<any>(null);
  const [isEventViewModalVisible, setIsEventViewModalVisible] =
    React.useState(false);
  const [isLeaveFeedbackModalVisible, setIsLeaveFeedbackModalVisible] =
    React.useState(false);
  const [isFeedbackSentModalVisible, setIsFeedbackSentModalVisible] =
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
        },
        {
          id: "2",
          name: "Sarah Johnson",
          affiliation: "Founder · Innovation Labs",
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
      speakers: [] as Speaker[],
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
      speakers: [] as Speaker[],
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
              // TODO: Filter events by stage
              console.log("Selected stage:", value);
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
              key={event.id}
              onPress={() => {
                setSelectedEvent(event);
                setIsEventViewModalVisible(true);
              }}
            >
              <EventCard
                title={event.title}
                stage={event.stage}
                day={event.day}
                startTime={event.startTime}
                endTime={event.endTime}
                sponsoredBy={event.sponsoredBy}
                onAddToSchedule={() => {
                  // TODO: Implement add to schedule functionality
                  console.log("Add to schedule:", event.id);
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
          console.log("Applied filters:", filters);
        }}
        categories={filterCategories}
        initialSelected={selectedFilters}
      />

      {selectedEvent && (
        <EventViewModal
          visible={isEventViewModalVisible}
          onClose={() => {
            setIsEventViewModalVisible(false);
            setSelectedEvent(null);
          }}
          title={selectedEvent.title}
          startTime={selectedEvent.startTime}
          endTime={selectedEvent.endTime}
          stage={selectedEvent.stage}
          sponsoredBy={selectedEvent.sponsoredBy}
          speakers={selectedEvent.speakers || []}
          description={selectedEvent.description}
          onAddToSchedule={() => {
            // TODO: Implement add to schedule functionality
            console.log("Add to schedule:", selectedEvent.id);
            setIsEventViewModalVisible(false);
            setSelectedEvent(null);
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
          console.log("Feedback submitted:", feedback);
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
            } else {
              console.log(`Navigate to ${route}`);
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
}
