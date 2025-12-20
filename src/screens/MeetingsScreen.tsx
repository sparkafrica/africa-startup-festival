import React, { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
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

type PrimaryTab = "requests" | "scheduled" | "cancelled";
type SecondaryTab = "inbound" | "outbound";

type Props = RootStackScreenProps<"Meetings">;

export default function MeetingsScreen({ route }: Props) {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const [primaryTab, setPrimaryTab] = useState<PrimaryTab>("requests");
  const [secondaryTab, setSecondaryTab] = useState<SecondaryTab>("inbound");
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isParticipantModalVisible, setIsParticipantModalVisible] =
    useState(false);

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

  // Scheduled meetings data

  const scheduledInboundMeetings = [
    {
      id: "scheduled-1",
      title: "Investment Opportunity",
      participantName: "Ada Okafor",
      participantRole: "VC Partner",
      company: "Skyline Ventures",
      tags: ["Fintech", "Nigeria"],
      interests: ["Fintech", "Infrastructure", "Developer Tools"],
      socialLabel: "Flutterwave.ng",
      bio: "Empowering innovation across Africa. High-growth tech company showcasing new new products at Spark Summit.",
      date: "2025-03-15",
      startTime: "2:00 PM",
      endTime: "2:20 PM",
      meetingType: "virtual" as const,
      meetingLink: "https://meet.google.com/abc-defg-hij",
      timeUntil: "In 3hrs",
      description: "Discuss investment opportunities in African fintech",
    },
    {
      id: "scheduled-2",
      title: "Product Partnership",
      participantName: "Sarah Williams",
      participantRole: "Product Lead",
      company: "TechFlow Inc",
      tags: ["SaaS", "Enterprise"],
      interests: ["Cloud Computing", "Product Management"],
      socialLabel: "TechFlow.io",
      bio: "Leading product innovation in enterprise SaaS solutions. Building scalable platforms for modern businesses.",
      date: "2025-03-15",
      startTime: "4:00 PM",
      endTime: "4:20 PM",
      meetingType: "physical" as const,
      location: "Table T-15",
      timeUntil: "In 5hrs",
      description: "Explore strategic partnership opportunities",
    },
  ];

  const scheduledOutboundMeetings = [
    {
      id: "scheduled-outbound-1",
      title: "Strategic Partnership Discussion",
      participantName: "James Mitchell",
      participantRole: "CEO",
      company: "InnovateTech Solutions",
      tags: ["AI", "Enterprise"],
      interests: ["Machine Learning", "Cloud Infrastructure", "Data Analytics"],
      socialLabel: "InnovateTech.io",
      bio: "Leading AI innovation in enterprise solutions. Building the future of intelligent automation and scalable cloud platforms.",
      date: "2025-03-15",
      startTime: "11:00 AM",
      endTime: "11:20 AM",
      meetingType: "physical" as const,
      location: "Table T-22",
      timeUntil: "In 2hrs",
      description:
        "Explore strategic partnership opportunities in AI infrastructure",
    },
    {
      id: "scheduled-outbound-2",
      title: "Product Demo & Integration",
      participantName: "Emma Rodriguez",
      participantRole: "CTO",
      company: "CloudScale Inc",
      tags: ["Cloud", "SaaS"],
      interests: ["Cloud Computing", "DevOps", "Microservices"],
      socialLabel: "CloudScale.com",
      bio: "Transforming businesses through scalable cloud solutions. Expert in enterprise architecture and modern DevOps practices.",
      date: "2025-03-15",
      startTime: "3:00 PM",
      endTime: "3:20 PM",
      meetingType: "virtual" as const,
      meetingLink: "https://meet.google.com/xyz-uvwx-rst",
      timeUntil: "In 6hrs",
      description:
        "Showcase product integration capabilities and discuss technical requirements",
    },
    {
      id: "scheduled-outbound-3",
      title: "Investment Pitch Review",
      participantName: "David Kim",
      participantRole: "Product Lead",
      company: "DataFlow Systems",
      tags: ["Data", "Analytics"],
      interests: ["Big Data", "Business Intelligence", "Data Visualization"],
      socialLabel: "DataFlow.io",
      bio: "Revolutionizing data analytics for modern enterprises. Making data-driven decisions easier with intuitive platforms.",
      date: "2025-03-16",
      startTime: "10:30 AM",
      endTime: "10:50 AM",
      meetingType: "physical" as const,
      location: "Table T-31",
      timeUntil: "Tomorrow",
      description:
        "Present investment opportunity and growth potential in data analytics space",
    },
  ];

  // Cancelled meetings data
  const cancelledInboundMeetings = [
    {
      id: "cancelled-inbound-1",
      title: "Investment Opportunity",
      participantName: "Michael Chen",
      company: "GreenTech Solutions",
      date: "2025-03-15",
      startTime: "2:00 PM",
      endTime: "2:20 PM",
      meetingType: "virtual" as const,
    },
    {
      id: "cancelled-inbound-2",
      title: "Product Partnership",
      participantName: "Sarah Williams",
      company: "TechFlow Inc",
      date: "2025-03-15",
      startTime: "4:00 PM",
      endTime: "4:20 PM",
      meetingType: "physical" as const,
    },
  ];

  const cancelledOutboundMeetings = [
    {
      id: "cancelled-outbound-1",
      title: "Strategic Partnership Discussion",
      participantName: "James Mitchell",
      company: "InnovateTech Solutions",
      date: "2025-03-15",
      startTime: "11:00 AM",
      endTime: "11:20 AM",
      meetingType: "physical" as const,
    },
    {
      id: "cancelled-outbound-2",
      title: "Product Demo & Integration",
      participantName: "Emma Rodriguez",
      company: "CloudScale Inc",
      date: "2025-03-15",
      startTime: "3:00 PM",
      endTime: "3:20 PM",
      meetingType: "virtual" as const,
    },
  ];

  // Get meetings based on active primary and secondary tabs
  const getMeetings = () => {
    if (primaryTab === "scheduled") {
      return secondaryTab === "inbound"
        ? scheduledInboundMeetings
        : scheduledOutboundMeetings;
    } else if (primaryTab === "requests") {
      return secondaryTab === "inbound" ? inboundMeetings : outboundMeetings;
    } else if (primaryTab === "cancelled") {
      return secondaryTab === "inbound"
        ? cancelledInboundMeetings
        : cancelledOutboundMeetings;
    } else {
      return [];
    }
  };

  const meetings = getMeetings();

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
        <View className="px-4 pt-4 flex-1">
          {/* TEMPORARY: Force empty state for testing - remove this condition to restore normal behavior meetings.length === 0 && */}
          {meetings.length === 0 && primaryTab === "cancelled" ? (
            <EmptyCancelledMeetings />
          ) : primaryTab === "scheduled" ? (
            meetings.map((meeting: any) => (
              <ScheduledMeetingCard
                key={meeting.id}
                title={meeting.title}
                participantName={meeting.participantName}
                company={meeting.company}
                date={meeting.date}
                startTime={meeting.startTime}
                endTime={meeting.endTime}
                meetingType={meeting.meetingType}
                timeUntil={meeting.timeUntil}
                onPress={() => {
                  setIsParticipantModalVisible(false); // Reset participant modal
                  setSelectedMeeting(meeting);
                  setIsModalVisible(true);
                }}
              />
            ))
          ) : primaryTab === "cancelled" ? (
            meetings.map((meeting: any) => (
              <CancelledMeetingCard
                key={meeting.id}
                title={meeting.title}
                participantName={meeting.participantName}
                company={meeting.company}
                date={meeting.date}
                startTime={meeting.startTime}
                endTime={meeting.endTime}
                meetingType={meeting.meetingType}
                onPress={() => {
                  // TODO: Handle cancelled meeting press (maybe show details?)
                  console.log("Cancelled meeting pressed:", meeting.id);
                }}
              />
            ))
          ) : (
            meetings.map((meeting: any) => (
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
          meetingType={selectedMeeting.meetingType}
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
            // TODO: Handle edit meeting
            console.log("Edit scheduled meeting:", selectedMeeting.id);
          }}
          onCancel={() => {
            // TODO: Handle cancel meeting
            console.log("Cancel scheduled meeting:", selectedMeeting.id);
            setIsModalVisible(false);
            setSelectedMeeting(null);
          }}
          onLeaveFeedback={() => {
            // TODO: Handle leave feedback
            console.log("Leave feedback for:", selectedMeeting.id);
          }}
        />
      )}
    </View>
  );
}
