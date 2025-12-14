import React, { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  HeaderBar,
  BottomNavigation,
  MeetingCard,
  TabButton,
  SecondaryTabButton,
  ArrowDownRedIcon,
  ArrowUpGreenIcon,
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

type PrimaryTab = "requests" | "scheduled" | "cancelled";
type SecondaryTab = "inbound" | "outbound";

export default function MeetingsScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("requests");
  const [secondaryTab, setSecondaryTab] = useState<SecondaryTab>("inbound");

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

  // Sample meeting data - replace with actual data from API/state
  const meetings = [
    {
      id: "1",
      title: "Product Discussion",
      participantName: "Sarah Johnson",
      company: "TechVentures Inc",
      date: "2025-03-15",
      startTime: "10:00 AM",
      endTime: "10:20 AM",
      location: "Table T-15",
      status: "pending" as const,
      approvalMessage: "Waiting for their approval.",
      expiresIn: 18,
    },
    {
      id: "2",
      title: "Product Discussion",
      participantName: "Sarah Johnson",
      company: "TechVentures Inc",
      date: "2025-03-15",
      startTime: "10:00 AM",
      endTime: "10:20 AM",
      location: "Table T-15",
      status: "pending" as const,
      approvalMessage: "Waiting for their approval.",
      expiresIn: 12,
    },
  ];

  return (
    <View className="flex-1 bg-white">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Primary Tab Navigation */}
        <View className="px-4 pt-4 pb-3">
          <View className="bg-gray-100 rounded-xl p-1 flex-row">
            <TabButton
              label="Requests"
              count={1}
              isActive={primaryTab === "requests"}
              onPress={() => setPrimaryTab("requests")}
            />
            <TabButton
              label="Scheduled"
              count={1}
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

        {/* Secondary Tab Navigation */}
        <View className="px-4 border-b border-gray-300">
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

        {/* Meeting Cards */}
        <View className="px-4 pt-4">
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              title={meeting.title}
              participantName={meeting.participantName}
              company={meeting.company}
              date={meeting.date}
              startTime={meeting.startTime}
              endTime={meeting.endTime}
              location={meeting.location}
              status={meeting.status}
              approvalMessage={meeting.approvalMessage}
              expiresIn={meeting.expiresIn}
              onPress={() => {
                // TODO: Navigate to meeting details
                console.log("Meeting pressed:", meeting.id);
              }}
            />
          ))}
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
    </View>
  );
}
