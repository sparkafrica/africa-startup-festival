import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { HeaderBar, BottomNavigation, AttendeeCard } from "../components";
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
import { ChevronDownIcon } from "../components/icons";
import Svg, { Path } from "react-native-svg";

// Grid Icon Component (for Card View)
function GridIcon({
  size = 16,
  color = "#404040",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 2H6V6H2V2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 2H14V6H10V2Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 10H6V14H2V10Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M10 10H14V14H10V10Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Filter Icon Component
function FilterIcon({
  size = 16,
  color = "#404040",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 4H14M4 8H12M6 12H10"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface Attendee {
  id: string;
  name: string;
  role?: string;
  company?: string;
  avatar?: string | number;
  tags?: string[];
}

export default function AttendeesScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const [activeTab, setActiveTab] = useState<"Recommended" | "All">(
    "Recommended"
  );

  // Mock data - replace with actual data source
  const allAttendees: Attendee[] = [
    {
      id: "1",
      name: "Ada Okafor",
      role: "VC Partner",
      company: "Skyline Ventures",
      tags: ["Fintech", "Nigeria"],
    },
    {
      id: "2",
      name: "John Mensah",
      role: "Founder",
      company: "TechStart Africa",
      tags: ["Startups", "Ghana"],
    },
    {
      id: "3",
      name: "Sara Ibrahim",
      role: "Product Manager",
      company: "Innovate Labs",
      tags: ["Product", "Egypt"],
    },
    {
      id: "4",
      name: "David Kim",
      role: "Speaker",
      company: "Cloud Solutions",
      tags: ["Cloud", "DevOps"],
    },
    {
      id: "5",
      name: "Lisa Anderson",
      role: "Attendee",
      company: "Design Studio",
      tags: ["UX/UI", "Product Design"],
    },
    {
      id: "6",
      name: "James Wilson",
      role: "Partner",
      company: "Enterprise Corp",
      tags: ["Enterprise", "B2B"],
    },
    {
      id: "7",
      name: "Maria Garcia",
      role: "Speaker",
      company: "Data Analytics Co.",
      tags: ["Data Science", "Analytics"],
    },
    {
      id: "8",
      name: "Robert Taylor",
      role: "Attendee",
      company: "Innovation Labs",
      tags: ["Innovation", "Research"],
    },
  ];

  // Recommended attendees (could be filtered by algorithm)
  const recommendedAttendees = allAttendees.slice(0, 5);

  const displayedAttendees =
    activeTab === "Recommended" ? recommendedAttendees : allAttendees;

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
      label: "People",
      route: "People",
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
      label: "History",
      route: "History",
    },
    {
      icon: (active: boolean) =>
        active ? (
          <HeartIconFilled size={24} color="#000000" />
        ) : (
          <HeartIcon size={24} color="#A3A3A3" />
        ),
      label: "Favorites",
      route: "Favorites",
    },
  ];

  return (
    <View className="flex-1 bg-surface">
      <HeaderBar
        onScanPress={() => console.log("Scan pressed")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Tabs: Recommended and All attendees */}
        <View className="px-4 pt-4 pb-3">
          <View className="flex-row">
            <Pressable
              onPress={() => setActiveTab("Recommended")}
              className={`flex-1 py-3 px-4 rounded-2xl mr-2 ${
                activeTab === "Recommended" ? "bg-white" : "bg-neutral-100"
              }`}
              style={
                activeTab === "Recommended"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-sm font-semibold text-center ${
                  activeTab === "Recommended"
                    ? "text-neutral-900"
                    : "text-neutral-400"
                }`}
              >
                Recommended
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("All")}
              className={`flex-1 py-3 px-4 rounded-2xl ${
                activeTab === "All" ? "bg-white" : "bg-neutral-100"
              }`}
              style={
                activeTab === "All"
                  ? {
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }
                  : undefined
              }
            >
              <Text
                className={`text-sm font-semibold text-center ${
                  activeTab === "All" ? "text-neutral-900" : "text-neutral-400"
                }`}
              >
                All attendees
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Card View and Filter Dropdowns */}
        <View className="px-4 pb-3 flex-row">
          <Pressable
            onPress={() => console.log("Card View pressed")}
            className="flex-1 flex-row items-center justify-center bg-white rounded-xl px-4 py-3 border border-neutral-200 mr-2"
          >
            <GridIcon size={16} color="#404040" />
            <Text className="text-sm font-medium text-neutral-900 ml-2">
              Card View
            </Text>
            <View className="ml-2">
              <ChevronDownIcon size={14} color="#A3A3A3" />
            </View>
          </Pressable>
          <Pressable
            onPress={() => console.log("Filter pressed")}
            className="flex-1 flex-row items-center justify-center bg-white rounded-xl px-4 py-3 border border-neutral-200"
          >
            <FilterIcon size={16} color="#404040" />
            <Text className="text-sm font-medium text-neutral-900 ml-2">
              Filter
            </Text>
            <View className="ml-2">
              <ChevronDownIcon size={14} color="#A3A3A3" />
            </View>
          </Pressable>
        </View>

        {/* Attendees List */}
        <View className="px-4">
          {displayedAttendees.length > 0 ? (
            displayedAttendees.map((attendee) => (
              <AttendeeCard
                key={attendee.id}
                name={attendee.name}
                role={attendee.role}
                company={attendee.company}
                avatar={attendee.avatar}
                tags={attendee.tags}
                onConnect={() => console.log(`Connect with ${attendee.name}`)}
              />
            ))
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-base text-neutral-500 mb-2">
                No attendees found
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="People"
          onNavigate={(route) => {
            if (route === "Favorites") {
              navigation.navigate("Favorites");
            } else if (route === "Home") {
              navigation.navigate("Home");
            } else if (route === "People") {
              // Already on People screen
            } else {
              console.log(`Navigate to ${route}`);
            }
          }}
        />
      </SafeAreaView>
    </View>
  );
}
