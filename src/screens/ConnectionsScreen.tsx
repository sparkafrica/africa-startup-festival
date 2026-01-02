import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  ScrollView,
  Animated,
  PanResponder,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  HeaderBar,
  BottomNavigation,
  RequestMeetingModal,
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
import { SearchIcon, ChevronRightIcon } from "../components/icons";
import { LinkedInIcon, CalendarIconWhite } from "../components/SocialIcons";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import type { MeetingFormData } from "../components";
import Svg, { Circle, Path } from "react-native-svg";

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

interface Connection {
  id: string;
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
}

// Connection Card Component
interface ConnectionCardProps {
  connection: Connection;
  onPress?: () => void;
}

function ConnectionCard({ connection, onPress }: ConnectionCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl mb-3 mx-4"
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
        <View className="w-14 h-14 rounded-full bg-neutral-100 items-center justify-center mr-3 flex-shrink-0">
          <PersonIcon size={28} color="#000000" />
        </View>

        {/* Name and Title/Company - Stacked vertically */}
        <View className="flex-1">
          {/* Name - Bold and prominent */}
          <Text
            className="text-base font-bold text-neutral-900 mb-0.5"
            numberOfLines={1}
          >
            {connection.name}
          </Text>

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
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const [isRequestMeetingModalVisible, setIsRequestMeetingModalVisible] =
    useState(false);
  const [meetingConnection, setMeetingConnection] = useState<Connection | null>(
    null
  );

  // Bottom sheet animation values
  const bottomSheetTranslateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const bottomSheetDragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);

  // TODO: BACKEND INTEGRATION - Replace mock connections data with API call
  // API Endpoint: GET /api/connections
  // Query Params: ?search={query}&page={page}&limit={limit}
  // Response: { connections: Connection[], total: number, page: number }
  // Real-time: WebSocket for new connections, connection status changes
  // TODO: BACKEND - Fetch connections on component mount
  // TODO: BACKEND - Handle pagination/infinite scroll
  // TODO: BACKEND - Cache connections in state management
  // TODO: BACKEND - Handle loading and error states
  // Mock connections data - replace with actual data source
  const connections: Connection[] = [
    {
      id: "1",
      name: "Ada Okafor",
      title: "VC Partner",
      company: "Skyline Ventures",
      tags: [
        { label: "Fintech", borderColor: "#ADD8E6" },
        { label: "Nigeria", borderColor: "#90EE90" },
      ],
      about:
        "Empowering innovation across Africa. High-growth tech company showcasing new products at Spark Summit.",
      interests: ["Fintech", "Infrastructure", "Developer Tools"],
      speakingSessions: [
        {
          title: "The Future of African Fintech",
          location: "Main Stage",
          time: "10:00 AM",
        },
      ],
      linkedInUrl: "https://linkedin.com/in/ada-okafor",
      isSpeaker: true, // Only speakers have speaking sessions
    },
    {
      id: "2",
      name: "Dr. Jane Smith",
      title: "VC Partner",
      company: "TechVentures Inc",
      tags: [
        { label: "Technology", borderColor: "#ADD8E6" },
        { label: "Healthcare", borderColor: "#FFB6C1" },
      ],
      about:
        "Leading venture capital investments in healthcare technology. Passionate about supporting innovative startups that improve patient outcomes.",
      interests: ["Healthcare", "AI/ML", "SaaS"],
      linkedInUrl: "https://linkedin.com/in/jane-smith",
    },
    {
      id: "3",
      name: "Sarah Johnson",
      title: "Product Manager",
      company: "Innovate Labs",
      tags: [
        { label: "Product", borderColor: "#DDA0DD" },
        { label: "UX/UI", borderColor: "#F0E68C" },
      ],
      about:
        "Product strategist with 10+ years of experience building user-centric products. Specialized in B2B SaaS platforms and mobile applications.",
      interests: ["Product Design", "User Experience", "Strategy"],
      linkedInUrl: "https://linkedin.com/in/sarah-johnson",
    },
    {
      id: "4",
      name: "Michael Chen",
      title: "CTO",
      company: "DataFlow Inc",
      tags: [
        { label: "AI/ML", borderColor: "#ADD8E6" },
        { label: "Singapore", borderColor: "#90EE90" },
      ],
      about:
        "Leading AI innovation in Southeast Asia with a focus on machine learning solutions. Building scalable infrastructure for data-driven companies.",
      interests: [
        "Artificial Intelligence",
        "Machine Learning",
        "Data Science",
      ],
      linkedInUrl: "https://linkedin.com/in/michael-chen",
    },
    {
      id: "5",
      name: "Amina Hassan",
      title: "Marketing Director",
      company: "Growth Partners",
      tags: [
        { label: "Marketing", borderColor: "#FFB6C1" },
        { label: "Kenya", borderColor: "#90EE90" },
      ],
      about:
        "Expert in growth marketing and brand strategy for African markets. Helping startups scale through data-driven marketing campaigns.",
      interests: ["Digital Marketing", "Brand Strategy", "Growth Hacking"],
      linkedInUrl: "https://linkedin.com/in/amina-hassan",
    },
    {
      id: "6",
      name: "David Kim",
      title: "Founder & CEO",
      company: "Cloud Solutions",
      tags: [
        { label: "Cloud", borderColor: "#ADD8E6" },
        { label: "DevOps", borderColor: "#DDA0DD" },
      ],
      about:
        "Cloud architecture expert helping companies scale efficiently. Building the next generation of cloud infrastructure solutions.",
      interests: ["Cloud Computing", "DevOps", "Architecture"],
      linkedInUrl: "https://linkedin.com/in/david-kim",
    },
  ];

  // Filter connections based on search query
  const filteredConnections = connections.filter((connection) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      connection.name.toLowerCase().includes(query) ||
      connection.title?.toLowerCase().includes(query) ||
      connection.company?.toLowerCase().includes(query)
    );
  });

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

  // Open bottom sheet with animation
  const openBottomSheet = (connection: Connection) => {
    setSelectedConnection(connection);
    setShowBottomSheet(true);
  };

  // Close bottom sheet with animation
  const closeBottomSheet = () => {
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
    });
  };

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

  const renderConnectionItem = ({ item }: { item: Connection }) => (
    <ConnectionCard
      connection={item}
      onPress={() => {
        openBottomSheet(item);
      }}
    />
  );

  return (
    <View className="flex-1 bg-white">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
      />

      <View className="flex-1">
        {/* Search Bar */}
        <View className="px-4 pt-4 pb-3">
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
        </View>

        {/* Connections List */}
        <FlatList
          data={filteredConnections}
          renderItem={renderConnectionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-12 px-4">
              <Text className="text-base text-neutral-500">
                {searchQuery.trim()
                  ? "No connections found"
                  : "No connections yet"}
              </Text>
            </View>
          }
        />
      </View>

      {/* Connection Detail Bottom Sheet */}
      {showBottomSheet && selectedConnection && (
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
                  <View className="w-16 h-16 rounded-full bg-neutral-100 items-center justify-center mr-4 flex-shrink-0">
                    <PersonIcon size={32} color="#404040" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-neutral-900 mb-1">
                      {selectedConnection.name}
                    </Text>
                    <Text className="text-base text-neutral-500 mb-3">
                      {selectedConnection.title && selectedConnection.company
                        ? `${selectedConnection.title} · ${selectedConnection.company}`
                        : selectedConnection.title ||
                          selectedConnection.company ||
                          ""}
                    </Text>

                    {/* Tags */}
                    {selectedConnection.tags &&
                      selectedConnection.tags.length > 0 && (
                        <View className="flex-row flex-wrap">
                          {selectedConnection.tags.map((tag, index) => (
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
                {selectedConnection.about && (
                  <Text className="text-[15px] text-neutral-700 mb-5 leading-6">
                    {selectedConnection.about}
                  </Text>
                )}

                {/* Interests Section */}
                {selectedConnection.interests &&
                  selectedConnection.interests.length > 0 && (
                    <View className="mb-5">
                      <Text className="text-lg font-bold text-neutral-900 mb-3">
                        Interests
                      </Text>
                      <View className="flex-row flex-wrap">
                        {selectedConnection.interests.map((interest, index) => (
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
                  <Pressable
                    onPress={() => {
                      setMeetingConnection(selectedConnection);
                      closeBottomSheet();
                      setIsRequestMeetingModalVisible(true);
                    }}
                    className="w-full flex-row items-center justify-center bg-neutral-900 rounded-xl py-3.5 px-4 mb-3"
                  >
                    <CalendarIconWhite size={20} color="#FFFFFF" />
                    <Text className="text-base font-semibold text-white ml-2">
                      Request Meeting
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      if (selectedConnection.linkedInUrl) {
                        // TODO: Open LinkedIn URL
                        console.log(
                          "Connect on LinkedIn:",
                          selectedConnection.linkedInUrl
                        );
                      } else {
                        console.log(
                          "Connect on LinkedIn:",
                          selectedConnection.name
                        );
                      }
                    }}
                    className="w-full flex-row items-center justify-center bg-neutral-200 rounded-xl py-3.5 px-4"
                  >
                    <LinkedInIcon size={20} color="#0A66C2" />
                    <Text className="text-base font-semibold text-neutral-700 ml-2">
                      Connect on LinkedIn
                    </Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Pressable>
          </Animated.View>
        </View>
      )}

      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Connections"
          onNavigate={(route) => {
            if (route === "Home") {
              navigation.navigate("Home");
            } else if (route === "Attendees") {
              navigation.navigate("Attendees");
            } else if (route === "Schedule") {
              navigation.navigate("Schedule");
            } else if (route === "Meetings") {
              navigation.navigate("Meetings");
            } else if (route === "Connections") {
              // Already on Connections screen
            } else {
              console.log(`Navigate to ${route}`);
            }
          }}
        />
      </SafeAreaView>

      {/* Request Meeting Modal */}
      <RequestMeetingModal
        visible={isRequestMeetingModalVisible}
        onClose={() => {
          setIsRequestMeetingModalVisible(false);
          setMeetingConnection(null);
        }}
        onSubmit={(data: MeetingFormData) => {
          console.log("Meeting Request Submitted:", data);
          // TODO: BACKEND INTEGRATION - Send meeting request to backend
          // API Endpoint: POST /api/meetings/request
          // Request Body: { attendeeId: string, title, meetingType, date, time, tableNumber?, meetingLink?, description }
          // TODO: BACKEND - Handle validation errors, conflicts, unavailable slots
          // TODO: BACKEND - Show success/error messages
          // TODO: BACKEND - Refresh meetings list after successful request
        }}
        attendeeName={meetingConnection?.name}
      />
    </View>
  );
}
