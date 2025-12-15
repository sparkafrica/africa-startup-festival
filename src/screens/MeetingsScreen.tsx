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
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isParticipantModalVisible, setIsParticipantModalVisible] =
    useState(false);

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
  const inboundMeetings = [
    {
      id: "1",
      title: "Product Discussion",
      participantName: "Sarah Johnson",
      participantRole: "VC Partner",
      company: "TechVentures Inc",
      tags: ["Fintech", "Nigeria"],
      interests: ["Fintech", "Infrastructure", "Developer Tools"],
      socialLabel: "Flutterwave.ng",
      bio: "Empowering innovation across Africa. High-growth tech company showcasing new products at Spark Summit.",
      date: "2025-03-15",
      startTime: "10:00 AM",
      endTime: "10:20 AM",
      location: "Table T-15",
      status: "pending" as const,
      approvalMessage: "Waiting for their approval.",
      expiresIn: 18,
      description: "Discuss potential partnership opportunities",
    },
    {
      id: "2",
      title: "Product Discussion",
      participantName: "Sarah Johnson",
      participantRole: "VC Partner",
      company: "TechVentures Inc",
      tags: ["Fintech", "Nigeria"],
      interests: ["Fintech", "Infrastructure", "Developer Tools"],
      socialLabel: "Flutterwave.ng",
      bio: "Empowering innovation across Africa. High-growth tech company showcasing new products at Spark Summit.",
      date: "2025-03-15",
      startTime: "10:00 AM",
      endTime: "10:20 AM",
      location: "Table T-15",
      status: "pending" as const,
      approvalMessage: "Waiting for their approval.",
      expiresIn: 12,
      description: "Discuss potential partnership opportunities",
    },
  ];

  const outboundMeetings = [
    {
      id: "3",
      title: "Investment Opportunity",
      participantName: "Michael Chen",
      participantRole: "CEO",
      company: "InnovateTech Solutions",
      tags: ["AI", "Enterprise"],
      interests: ["Machine Learning", "Cloud Infrastructure"],
      socialLabel: "InnovateTech.io",
      bio: "Leading AI innovation in enterprise solutions. Building the future of intelligent automation.",
      date: "2025-03-16",
      startTime: "2:00 PM",
      endTime: "2:20 PM",
      location: "Table T-22",
      status: "pending" as const,
      approvalMessage: "Waiting for their approval.",
      expiresIn: 24,
      description: "Explore investment opportunities in AI infrastructure",
    },
    {
      id: "4",
      title: "Partnership Discussion",
      participantName: "Emily Rodriguez",
      participantRole: "CTO",
      company: "CloudScale Inc",
      tags: ["Cloud", "SaaS"],
      interests: ["Cloud Computing", "DevOps"],
      socialLabel: "CloudScale.com",
      bio: "Transforming businesses through scalable cloud solutions. Expert in enterprise architecture.",
      date: "2025-03-17",
      startTime: "11:00 AM",
      endTime: "11:20 AM",
      location: "Table T-08",
      status: "pending" as const,
      approvalMessage: "Waiting for their approval.",
      expiresIn: 36,
      description: "Discuss potential strategic partnership",
    },
    {
      id: "5",
      title: "Product Demo",
      participantName: "David Kim",
      participantRole: "Product Lead",
      company: "DataFlow Systems",
      tags: ["Data", "Analytics"],
      interests: ["Big Data", "Business Intelligence"],
      socialLabel: "DataFlow.io",
      bio: "Revolutionizing data analytics for modern enterprises. Making data-driven decisions easier.",
      date: "2025-03-18",
      startTime: "3:30 PM",
      endTime: "3:50 PM",
      location: "Table T-31",
      status: "pending" as const,
      approvalMessage: "Waiting for their approval.",
      expiresIn: 48,
      description: "Showcase new analytics platform features",
    },
  ];

  // Get meetings based on active secondary tab
  const meetings =
    secondaryTab === "inbound" ? inboundMeetings : outboundMeetings;

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
      >
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
                setSelectedMeeting(meeting);
                setIsModalVisible(true);
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

      {/* Inbound Meeting Modal */}
      {selectedMeeting && secondaryTab === "inbound" && (
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
          location={selectedMeeting.location}
          participantName={selectedMeeting.participantName}
          participantRole={selectedMeeting.participantRole}
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
          onAccept={() => {
            // TODO: Handle accept meeting
            console.log("Accept meeting:", selectedMeeting.id);
            setIsModalVisible(false);
            setSelectedMeeting(null);
          }}
          onDecline={() => {
            // TODO: Handle decline meeting
            console.log("Decline meeting:", selectedMeeting.id);
            setIsModalVisible(false);
            setSelectedMeeting(null);
          }}
        />
      )}

      {/* Outbound Meeting Modal */}
      {selectedMeeting && secondaryTab === "outbound" && (
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
          location={selectedMeeting.location}
          participantName={selectedMeeting.participantName}
          participantRole={selectedMeeting.participantRole}
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
            // TODO: Handle edit meeting
            console.log("Edit meeting:", selectedMeeting.id);
            setIsModalVisible(false);
            setSelectedMeeting(null);
          }}
          onCancel={() => {
            // TODO: Handle cancel meeting
            console.log("Cancel meeting:", selectedMeeting.id);
            setIsModalVisible(false);
            setSelectedMeeting(null);
          }}
        />
      )}
    </View>
  );
}
