import React, { useState, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  PanResponder,
  Animated,
  ScrollView,
  FlatList,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useChecklist } from "../context/ChecklistContext";
import {
  HeaderBar,
  BottomNavigation,
  FilterModal,
  FilterTag,
  RequestMeetingModal,
  ConnectMessageModal,
  MeetingRequestMessageModal,
  type FilterCategory,
  type MeetingFormData,
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
import { ChevronDownIcon, ListIcon, SearchIcon } from "../components/icons";
import { LinkedInIcon } from "../components/SocialIcons";
import Svg, { Path, Circle } from "react-native-svg";

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

// Person Icon Component (for profile placeholder)
function PersonIcon({
  size = 24,
  color = "#A3A3A3",
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
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// X Icon Component (for reject overlay)
function XIcon({
  size = 80,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Checkmark Icon Component (for accept overlay)
function CheckmarkIcon({
  size = 80,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth={3}
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
  bio?: string;
  interests?: string[];
  linkedInUrl?: string;
}

// Attendee Card Component (Tinder-style card)
interface AttendeeCardProps {
  attendee: Attendee;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onRequestMeeting?: (attendee: Attendee) => void;
  onConnect?: (attendee: Attendee) => void;
  index: number;
  totalCards: number;
  hasFilters?: boolean;
}

const SWIPE_THRESHOLD = 120;
const ROTATION_MAX = 15;

function AttendeeCard({
  attendee,
  onSwipeLeft,
  onSwipeRight,
  onRequestMeeting,
  onConnect,
  index,
  totalCards,
  hasFilters = false,
}: AttendeeCardProps) {
  const screenWidth = Dimensions.get("window").width;
  const cardWidth = screenWidth - 32; // 16px padding on each side

  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const leftOverlayOpacity = useRef(new Animated.Value(0)).current;
  const rightOverlayOpacity = useRef(new Animated.Value(0)).current;
  const leftOverlayScale = useRef(new Animated.Value(0)).current;
  const rightOverlayScale = useRef(new Animated.Value(0)).current;

  // Reset position when attendee changes
  React.useEffect(() => {
    translateX.setValue(0);
    translateY.setValue(0);
    rotate.setValue(0);
    leftOverlayOpacity.setValue(0);
    rightOverlayOpacity.setValue(0);
    leftOverlayScale.setValue(0);
    rightOverlayScale.setValue(0);
  }, [attendee.id]);

  const handleSwipeComplete = (direction: "left" | "right") => {
    if (direction === "left" && onSwipeLeft) {
      onSwipeLeft();
    } else if (direction === "right" && onSwipeRight) {
      onSwipeRight();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        // Calculate new position relative to start
        const newX = gestureState.dx;
        const newY = gestureState.dy;

        translateX.setValue(newX);
        translateY.setValue(newY);

        // Calculate rotation
        const rotationValue = (newX / screenWidth) * ROTATION_MAX;
        rotate.setValue(rotationValue);

        // Update overlay opacity and scale
        if (newX < 0) {
          // Swiping left
          const opacity = Math.min(Math.abs(newX) / SWIPE_THRESHOLD, 1);
          const scale = Math.min(Math.abs(newX) / SWIPE_THRESHOLD, 1);
          leftOverlayOpacity.setValue(opacity);
          leftOverlayScale.setValue(scale);
          rightOverlayOpacity.setValue(0);
          rightOverlayScale.setValue(0);
        } else if (newX > 0) {
          // Swiping right
          const opacity = Math.min(newX / SWIPE_THRESHOLD, 1);
          const scale = Math.min(newX / SWIPE_THRESHOLD, 1);
          rightOverlayOpacity.setValue(opacity);
          rightOverlayScale.setValue(scale);
          leftOverlayOpacity.setValue(0);
          leftOverlayScale.setValue(0);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const swipeDistance = gestureState.dx;
        const swipeVelocity = gestureState.vx;
        const currentX = gestureState.dx;
        const currentY = gestureState.dy;

        if (
          Math.abs(swipeDistance) > SWIPE_THRESHOLD ||
          Math.abs(swipeVelocity) > 0.5
        ) {
          if (swipeDistance < -SWIPE_THRESHOLD || swipeVelocity < -0.5) {
            // Swipe left
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: -screenWidth * 1.5,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
              }),
              Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
              }),
            ]).start(() => {
              handleSwipeComplete("left");
            });
          } else if (swipeDistance > SWIPE_THRESHOLD || swipeVelocity > 0.5) {
            // Swipe right
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: screenWidth * 1.5,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
              }),
              Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 50,
                friction: 8,
              }),
            ]).start(() => {
              handleSwipeComplete("right");
            });
          }
        } else {
          // Snap back
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
            Animated.spring(rotate, {
              toValue: 0,
              useNativeDriver: true,
              tension: 50,
              friction: 8,
            }),
            Animated.timing(leftOverlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rightOverlayOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(leftOverlayScale, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(rightOverlayScale, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }),
          ]).start();
        }
      },
    })
  ).current;

  // Calculate scale: top card is 100%, others scale down slightly but consistently
  const getScale = () => {
    if (index === 0) return 1;
    if (index === 1) return 0.97;
    if (index === 2) return 0.95;
    if (index === 3) return 0.93;
    return 0.92; // index 4
  };

  // Calculate opacity: top card is 100%, others fade slightly but stay visible
  const getOpacity = () => {
    if (index === 0) return 1;
    if (index === 1) return 0.92;
    if (index === 2) return 0.88;
    if (index === 3) return 0.84;
    return 0.8; // index 4
  };

  const cardStyle = {
    transform: [
      { translateX },
      { translateY },
      {
        rotate: rotate.interpolate({
          inputRange: [-ROTATION_MAX, 0, ROTATION_MAX],
          outputRange: ["-15deg", "0deg", "15deg"],
        }),
      },
      {
        scale: getScale(),
      },
    ],
    opacity: getOpacity(),
    zIndex: totalCards - index,
  };

  const leftOverlayStyle = {
    opacity: leftOverlayOpacity,
    transform: [{ scale: leftOverlayScale }],
  };

  const rightOverlayStyle = {
    opacity: rightOverlayOpacity,
    transform: [{ scale: rightOverlayScale }],
  };

  if (index > 4) return null; // Only show top 5 cards

  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          width: cardWidth,
          // marginTop: hasFilters ? 16 : 8, // More top spacing when filters applied
          // marginBottom: hasFilters ? 12 : 8, // More bottom spacing when filters applied
        },
        cardStyle,
      ]}
      {...panResponder.panHandlers}
    >
      <View
        className={`bg-white rounded-2xl mb-4 ${hasFilters ? "p-2.5" : "p-4"}`}
        style={{
          width: cardWidth,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        {/* Reject Overlay (Red X - Left) */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 16,
              backgroundColor: "rgba(239, 68, 68, 0.9)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            },
            leftOverlayStyle,
          ]}
        >
          <View className="w-32 h-32 rounded-full bg-red-500 items-center justify-center">
            <XIcon size={80} color="#FFFFFF" />
          </View>
        </Animated.View>

        {/* Accept Overlay (Green Checkmark - Right) */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: 16,
              backgroundColor: "rgba(34, 197, 94, 0.9)",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            },
            rightOverlayStyle,
          ]}
        >
          <View className="w-32 h-32 rounded-full bg-green-500 items-center justify-center">
            <CheckmarkIcon size={80} color="#FFFFFF" />
          </View>
        </Animated.View>
        {/* Profile Header */}
        <View
          className={`flex-row items-start ${
            hasFilters ? "mb-1.5 pt-2" : "mb-3"
          }`}
        >
          {/* Profile Picture Placeholder */}
          <View
            className={`${
              hasFilters ? "w-12 h-12" : "w-16 h-16"
            } rounded-full bg-neutral-100 items-center justify-center ${
              hasFilters ? "mr-3" : "mr-4"
            }`}
          >
            <PersonIcon size={hasFilters ? 24 : 32} color="#A3A3A3" />
          </View>

          {/* Name and Title */}
          <View className="flex-1">
            <Text
              className={`${
                hasFilters ? "text-lg" : "text-2xl"
              } font-bold text-neutral-900 ${
                hasFilters ? "mb-0.5 pt-2" : "mb-1"
              }`}
            >
              {attendee.name}
            </Text>
            <Text
              className={`${
                hasFilters ? "text-xs" : "text-base"
              } text-neutral-600`}
            >
              {attendee.role && attendee.company
                ? `${attendee.role} · ${attendee.company}`
                : attendee.role || attendee.company || ""}
            </Text>
          </View>
        </View>

        {/* Tags */}
        {attendee.tags && attendee.tags.length > 0 && (
          <View
            className={`flex-row flex-wrap ${hasFilters ? "mb-2" : "mb-3"}`}
          >
            {attendee.tags.map((tag, index) => (
              <View
                key={index}
                className={`bg-neutral-200 rounded-full ${
                  hasFilters ? "px-2 py-1" : "px-3 py-1.5"
                } mr-2 ${hasFilters ? "mb-1" : "mb-2"}`}
              >
                <Text
                  className={`${
                    hasFilters ? "text-xs" : "text-sm"
                  } font-medium text-neutral-700`}
                >
                  {tag}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Bio */}
        {attendee.bio && (
          <Text
            className={`${
              hasFilters ? "text-normal font-medium" : "text-base"
            } text-neutral-700 ${hasFilters ? "mb-1" : "mb-3"} ${
              hasFilters ? "leading-4" : "leading-6"
            }`}
            numberOfLines={hasFilters ? 2 : undefined}
          >
            {attendee.bio}
          </Text>
        )}

        {/* Interests Section */}
        {attendee.interests && attendee.interests.length > 0 && (
          <View className={hasFilters ? "py-4 mb-0.5" : "mb-2"}>
            <Text
              className={`${
                hasFilters ? "text-[14px] font-medium" : "text-base"
              } font-semibold text-neutral-900 ${hasFilters ? "mb-1" : "mb-2"}`}
            >
              Interests
            </Text>
            <View className="flex-row flex-wrap">
              {attendee.interests
                .slice(0, hasFilters ? 3 : undefined)
                .map((interest, index) => (
                  <View
                    key={index}
                    className={`bg-neutral-200 rounded-full ${
                      hasFilters ? "px-2 py-1" : "px-3 py-1.5"
                    } mr-2 ${hasFilters ? "mb-1" : "mb-2"}`}
                  >
                    <Text
                      className={`${
                        hasFilters ? "text-xs" : "text-sm"
                      } font-medium text-neutral-700`}
                    >
                      {interest}
                    </Text>
                  </View>
                ))}
              {hasFilters && attendee.interests.length > 3 && (
                <View className="bg-neutral-100 rounded-full px-2 py-0.5 mr-2 mb-1">
                  <Text className="text-xs font-medium text-neutral-700">
                    +{attendee.interests.length - 3}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Action Buttons - Stacked Vertically */}
        <View className={hasFilters ? "pt-2 pb-2" : "mt-1"}>
          <Pressable
            onPress={() => {
              if (onRequestMeeting) {
                onRequestMeeting(attendee);
              }
            }}
            className={`w-full flex-row items-center justify-center bg-black rounded-xl ${
              hasFilters ? "py-4 px-3 mb-1.5" : "py-3 px-4 mb-2"
            }`}
          >
            <CalendarIcon size={hasFilters ? 16 : 20} color="#FFFFFF" />
            <Text
              className={`${
                hasFilters ? "text-normal font-medium" : "text-base"
              } font-medium text-white ${hasFilters ? "ml-1.5" : "ml-2"}`}
            >
              Request Meeting
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              if (onConnect) {
                onConnect(attendee);
              }
            }}
            className={`w-full flex-row items-center justify-center bg-neutral-100 rounded-xl ${
              hasFilters ? "py-4 px-3" : "py-3 px-4"
            }`}
          >
            <PeopleIcon size={hasFilters ? 16 : 20} color="#404040" />
            <Text
              className={`${
                hasFilters ? "text-normal font-medium" : "text-base"
              } font-medium text-neutral-900 ${hasFilters ? "ml-1.5" : "ml-2"}`}
            >
              Connect
            </Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

export default function AttendeesScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const { markConnectAttendeesComplete, markRequestMeetingComplete } = useChecklist();
  const [activeTab, setActiveTab] = useState<"Recommended" | "All">(
    "Recommended"
  );
  const [viewMode, setViewMode] = useState<"card" | "list">("card");
  const [showViewDropdown, setShowViewDropdown] = useState(false);
  const [selectedAttendee, setSelectedAttendee] = useState<Attendee | null>(
    null
  );
  const [showBottomSheet, setShowBottomSheet] = useState(false);

  // Filter state
  const [selectedFilterIds, setSelectedFilterIds] = useState<string[]>([]);
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  // Request Meeting Modal state
  const [isRequestMeetingModalVisible, setIsRequestMeetingModalVisible] =
    useState(false);
  const [meetingAttendee, setMeetingAttendee] = useState<Attendee | null>(null);

  // Connect Message Modal state
  const [isConnectMessageVisible, setIsConnectMessageVisible] = useState(false);
  const [connectedAttendeeName, setConnectedAttendeeName] = useState<string>("");

  // Meeting Request Message Modal state
  const [isMeetingRequestMessageVisible, setIsMeetingRequestMessageVisible] = useState(false);
  const [meetingRequestData, setMeetingRequestData] = useState<{
    attendeeName: string;
    meetingType: "Physical" | "Virtual";
    meetingTitle: string;
  } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Bottom sheet animation values
  const bottomSheetTranslateY = useRef(new Animated.Value(0)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const bottomSheetDragY = useRef(new Animated.Value(0)).current;
  const dragStartY = useRef(0);

  // Filter categories matching Figma design
  const filterCategories: FilterCategory[] = [
    {
      id: "industry",
      title: "Industry / Sector",
      options: [
        { id: "technology", label: "Technology" },
        { id: "fintech", label: "Fintech" },
        { id: "healthcare", label: "Healthcare" },
        { id: "education", label: "Education" },
        { id: "sustainability", label: "Sustainability" },
        { id: "ecommerce", label: "E-commerce" },
        { id: "transportation", label: "Transportation" },
      ],
    },
    {
      id: "interests",
      title: "Interests",
      options: [
        { id: "ai-ml", label: "AI/ML" },
        { id: "saas", label: "SaaS" },
        { id: "product-strategy", label: "Product Strategy" },
        { id: "ecommerce-interest", label: "E-commerce" },
        { id: "fintech-interest", label: "Fintech" },
        { id: "developer-tools", label: "Developer Tools" },
        { id: "infrastructure", label: "Infrastructure" },
        { id: "growth-marketing", label: "Growth Marketing" },
      ],
    },
    {
      id: "job-title",
      title: "Job Title / Role",
      options: [
        { id: "ceo-founder", label: "CEO/Founder" },
        { id: "cto", label: "CTO" },
        { id: "vp-product", label: "VP Product" },
        { id: "sales", label: "Sales" },
        { id: "designer", label: "Designer" },
        { id: "engineer", label: "Engineer" },
        { id: "marketing", label: "Marketing" },
        { id: "product-manager", label: "Product Manager" },
      ],
    },
  ];

  // Filter handlers
  const handleApplyFilters = (filterIds: string[]) => {
    setSelectedFilterIds(filterIds);
    console.log("Applied filters:", filterIds);
    // TODO: Apply filters to displayedAttendees when backend is integrated
  };

  // Helper function to get filter label from ID
  const getFilterLabel = (id: string): string => {
    for (const category of filterCategories) {
      const option = category.options.find((opt) => opt.id === id);
      if (option) return option.label;
    }
    return id;
  };

  const removeFilter = (filterId: string) => {
    setSelectedFilterIds(selectedFilterIds.filter((id) => id !== filterId));
  };

  // Mock data - replace with actual data source
  const allAttendees: Attendee[] = [
    {
      id: "1",
      name: "Ada Okafor",
      role: "VC Partner",
      company: "Skyline Ventures",
      tags: ["Fintech", "Nigeria"],
      bio: "Early-stage investor focused on African fintech and infrastructure.",
      interests: ["Fintech", "Infrastructure", "Developer Tools"],
      linkedInUrl: "https://linkedin.com/in/ada-okafor",
    },
    {
      id: "2",
      name: "John Mensah",
      role: "Founder",
      company: "TechStart Africa",
      tags: ["Startups", "Ghana"],
      bio: "Building the next generation of African tech companies.",
      interests: ["Startups", "Technology", "Innovation"],
      linkedInUrl: "https://linkedin.com/in/john-mensah",
    },
    {
      id: "3",
      name: "Sara Ibrahim",
      role: "Product Manager",
      company: "Innovate Labs",
      tags: ["Product", "Egypt"],
      bio: "Passionate about creating products that make a difference.",
      interests: ["Product Design", "User Experience", "Strategy"],
      linkedInUrl: "https://linkedin.com/in/sara-ibrahim",
    },
    {
      id: "4",
      name: "David Kim",
      role: "Speaker",
      company: "Cloud Solutions",
      tags: ["Cloud", "DevOps"],
      bio: "Cloud architecture expert helping companies scale efficiently.",
      interests: ["Cloud Computing", "DevOps", "Architecture"],
      linkedInUrl: "https://linkedin.com/in/david-kim",
    },
    {
      id: "5",
      name: "Lisa Anderson",
      role: "Attendee",
      company: "Design Studio",
      tags: ["UX/UI", "Product Design"],
      bio: "Designer focused on creating beautiful and functional interfaces.",
      interests: ["UI Design", "UX Research", "Design Systems"],
      linkedInUrl: "https://linkedin.com/in/lisa-anderson",
    },
    {
      id: "6",
      name: "Michael Chen",
      role: "CTO",
      company: "DataFlow Inc",
      tags: ["AI/ML", "Singapore"],
      bio: "Leading AI innovation in Southeast Asia with a focus on machine learning solutions.",
      interests: [
        "Artificial Intelligence",
        "Machine Learning",
        "Data Science",
      ],
      linkedInUrl: "https://linkedin.com/in/michael-chen",
    },
    {
      id: "7",
      name: "Amina Hassan",
      role: "Marketing Director",
      company: "Growth Partners",
      tags: ["Marketing", "Kenya"],
      bio: "Expert in growth marketing and brand strategy for African markets.",
      interests: ["Digital Marketing", "Brand Strategy", "Growth Hacking"],
      linkedInUrl: "https://linkedin.com/in/amina-hassan",
    },
  ];

  // Recommended attendees (could be filtered by algorithm)
  const recommendedAttendees = allAttendees.slice(0, 5);

  // Get displayed attendees based on active tab
  let displayedAttendees =
    activeTab === "Recommended" ? recommendedAttendees : allAttendees;

  // Apply search filter if search query exists and in list view
  if (viewMode === "list" && searchQuery.trim().length > 0) {
    const query = searchQuery.toLowerCase().trim();
    displayedAttendees = displayedAttendees.filter((attendee) => {
      const nameMatch = attendee.name.toLowerCase().includes(query);
      const roleMatch = attendee.role?.toLowerCase().includes(query);
      const companyMatch = attendee.company?.toLowerCase().includes(query);
      const bioMatch = attendee.bio?.toLowerCase().includes(query);
      const tagsMatch = attendee.tags?.some((tag) =>
        tag.toLowerCase().includes(query)
      );
      const interestsMatch = attendee.interests?.some((interest) =>
        interest.toLowerCase().includes(query)
      );
      return (
        nameMatch ||
        roleMatch ||
        companyMatch ||
        bioMatch ||
        tagsMatch ||
        interestsMatch
      );
    });
  }

  // State for current card index
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Reset card index when tab changes
  React.useEffect(() => {
    setCurrentCardIndex(0);
  }, [activeTab]);

  // Handle bottom sheet animation when it opens
  React.useEffect(() => {
    if (showBottomSheet && selectedAttendee) {
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
  }, [showBottomSheet, selectedAttendee]);

  // Handle swipe left (reject/skip)
  const handleReject = () => {
    const attendee = displayedAttendees[currentCardIndex];
    console.log("Rejected/Skipped:", attendee.name);
    // Move to next card
    if (currentCardIndex < displayedAttendees.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  // Handle swipe right (accept/connect)
  const handleAccept = () => {
    const attendee = displayedAttendees[currentCardIndex];
    console.log("Accepted/Connected:", attendee.name);
    // Mark checklist item as completed when user connects
    markConnectAttendeesComplete();
    // Show connect message modal
    setConnectedAttendeeName(attendee.name);
    setIsConnectMessageVisible(true);
    // Move to next card
    if (currentCardIndex < displayedAttendees.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
    }
  };

  // Handle connect button press
  const handleConnect = (attendee: Attendee) => {
    console.log("Connect:", attendee.name);
    // Mark checklist item as completed when user connects
    markConnectAttendeesComplete();
    // Show connect message modal
    setConnectedAttendeeName(attendee.name);
    setIsConnectMessageVisible(true);
  };

  // Open bottom sheet with animation
  const openBottomSheet = (attendee: Attendee) => {
    console.log("Opening bottom sheet for:", attendee.name);
    // Just set the state - animation will be handled by useEffect
    setSelectedAttendee(attendee);
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
      setSelectedAttendee(null);
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

  // List View Item Component - Refactored to match Figma design exactly
  const renderListItem = ({ item }: { item: Attendee }) => (
    <Pressable
      onPress={() => {
        openBottomSheet(item);
      }}
      className="bg-white rounded-xl mb-3 mx-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View className="p-4">
        {/* Top Section: Avatar + Name/Role/Company (left aligned) */}
        <View className="flex-row items-start mb-3">
          {/* Profile Picture - Circular with border */}
          <View className="w-14 h-14 rounded-full bg-white border border-neutral-200 items-center justify-center mr-3 flex-shrink-0">
            <PersonIcon size={28} color="#000000" />
          </View>

          {/* Name and Role/Company - Stacked vertically */}
          <View className="flex-1 pt-2">
            {/* Name - Bold and prominent */}
            <Text
              className="text-base font-bold text-neutral-900 mb-0.5"
              numberOfLines={1}
            >
              {item.name}
            </Text>

            {/* Role and Company - Lighter text */}
            <Text className="text-sm text-neutral-600" numberOfLines={1}>
              {item.role && item.company
                ? `${item.role} · ${item.company}`
                : item.role || item.company || ""}
            </Text>
          </View>
        </View>

        {/* Bottom Section: Tags and Connect Button (spaced between) */}
        <View className="flex-row items-center justify-between">
          {/* Tags with light gray borders */}
          {item.tags && item.tags.length > 0 ? (
            <View className="flex-row flex-wrap flex-1 mr-3">
              {item.tags.map((tag, index) => (
                <View
                  key={index}
                  className="bg-white border border-neutral-200 rounded-full px-2.5 py-1 mr-2 mb-1"
                >
                  <Text className="text-xs font-medium text-neutral-900">
                    {tag}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View className="flex-1" />
          )}

          {/* Connect Button on the Right - Rounded rectangular */}
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              handleConnect(item);
            }}
            className="flex-row items-center justify-center bg-neutral-100 rounded-xl px-3 py-2 flex-shrink-0"
          >
            <PeopleIcon size={16} color="#404040" />
            <Text className="text-sm font-medium text-neutral-900 ml-1.5">
              Connect
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

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

  return (
    <View className="flex-1 bg-white">
      <HeaderBar
        onScanPress={() => navigation.navigate("ScanQR")}
        onNotificationPress={() => navigation.navigate("Notifications")}
        onMenuPress={() => navigation.navigate("Menu")}
      />

      <View className="flex-1">
        {/* Tabs: Recommended and All attendees */}
        <View className="px-4 pt-4 pb-3">
          <View className="flex-row border border-neutral-200 rounded-2xl bg-neutral-100">
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

        {/* View Dropdown and Filter Dropdowns */}
        <View className="px-4 pb-6 flex-row">
          <View className="flex-1 mr-2" style={{ position: "relative" }}>
          <Pressable
              onPress={() => setShowViewDropdown(!showViewDropdown)}
              className="flex-row items-center justify-center bg-white rounded-xl px-4 py-3 border border-neutral-200"
          >
              {viewMode === "card" ? (
            <GridIcon size={16} color="#404040" />
              ) : (
                <ListIcon size={16} color="#404040" />
              )}
            <Text className="text-sm font-medium text-neutral-900 ml-2">
                {viewMode === "card" ? "Card View" : "List View"}
            </Text>
            <View className="ml-2">
              <ChevronDownIcon size={14} color="#A3A3A3" />
            </View>
          </Pressable>
            {/* Dropdown Menu */}
            {showViewDropdown && (
              <View
                className="absolute top-full mt-1 w-full bg-white rounded-xl border border-neutral-200"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 5,
                  zIndex: 50,
                }}
              >
          <Pressable
                  onPress={() => {
                    setViewMode("card");
                    setShowViewDropdown(false);
                  }}
                  className={`px-4 py-3 flex-row items-center ${
                    viewMode === "card" ? "bg-neutral-50" : ""
                  }`}
                >
                  <GridIcon size={16} color="#404040" />
                  <Text className="text-sm font-medium text-neutral-900 ml-2">
                    Card View
                  </Text>
                </Pressable>
                <View className="h-px bg-neutral-200" />
                <Pressable
                  onPress={() => {
                    setViewMode("list");
                    setShowViewDropdown(false);
                  }}
                  className={`px-4 py-3 flex-row items-center rounded-b-xl ${
                    viewMode === "list" ? "bg-neutral-50" : ""
                  }`}
                >
                  <ListIcon size={16} color="#404040" />
                  <Text className="text-sm font-medium text-neutral-900 ml-2">
                    List View
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
          <Pressable
            onPress={() => setIsFilterModalVisible(true)}
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

        {/* Active Filter Tags - Scrollable when many filters */}
        {selectedFilterIds.length > 0 && (
          <View className="px-4 pb-2" style={{ maxHeight: 80 }}>
            <ScrollView showsVerticalScrollIndicator={true} nestedScrollEnabled>
              <View className="flex-row flex-wrap">
                {selectedFilterIds.map((filterId) => (
                  <FilterTag
                    key={filterId}
                    label={getFilterLabel(filterId)}
                    onRemove={() => removeFilter(filterId)}
                  />
                ))}
              </View>
            </ScrollView>
          </View>
        )}

        {/* Search Bar - Only shown in List View */}
        {viewMode === "list" && (
          <View className="px-4 pb-4">
            <View className="flex-row items-center bg-white border border-neutral-200 rounded-xl px-4 py-3">
              <SearchIcon size={18} color="#A3A3A3" />
              <TextInput
                className="flex-1 ml-3 text-base text-neutral-900"
                placeholder="Search attendees, speakers..."
                placeholderTextColor="#A3A3A3"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <Pressable
                  onPress={() => setSearchQuery("")}
                  className="ml-2"
                >
                  <Text className="text-sm font-medium text-neutral-600">
                    Clear
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Card View or List View */}
        {viewMode === "card" ? (
          <View
            className="flex-1 items-center px-4"
            style={{
              minHeight: 0,
              flexShrink: 1,
            }}
          >
            {displayedAttendees.length > 0 &&
            currentCardIndex < displayedAttendees.length ? (
              <>
                <View
                  className="w-full items-center justify-center"
                  style={{
                    position: "relative",
                    flex: selectedFilterIds.length > 0 ? 1 : 1,
                    minHeight: 0,
                    flexGrow: 1,
                    paddingTop: selectedFilterIds.length > 0 ? 4 : 8,
                    paddingBottom: selectedFilterIds.length > 0 ? 0 : 4,
                  }}
                >
                  {/* Render stacked cards (top 5) */}
                  {displayedAttendees
                    .slice(currentCardIndex, currentCardIndex + 5)
                    .map((attendee, index) => (
              <AttendeeCard
                key={attendee.id}
                        attendee={attendee}
                        onSwipeLeft={handleReject}
                        onSwipeRight={handleAccept}
                        onRequestMeeting={(attendee) => {
                          setMeetingAttendee(attendee);
                          setIsRequestMeetingModalVisible(true);
                        }}
                        onConnect={handleConnect}
                        index={index}
                        totalCards={Math.min(
                          5,
                          displayedAttendees.length - currentCardIndex
                        )}
                        hasFilters={selectedFilterIds.length > 0}
                      />
                    ))}
                </View>
                {/* Swipe Instructions with adaptive padding */}
                <Text
                  className={`text-sm text-neutral-400 ${
                    selectedFilterIds.length > 0 ? "mt-2 mb-2" : "mt-4 mb-4"
                  } text-center px-4`}
                >
                  Swiping left skips, swiping right connects.
                </Text>
              </>
          ) : (
            <View className="items-center justify-center py-12">
              <Text className="text-base text-neutral-500 mb-2">
                  {displayedAttendees.length === 0
                    ? "No attendees found"
                    : "No more attendees"}
                </Text>
              </View>
            )}
          </View>
        ) : (
          <View className="flex-1">
            {displayedAttendees.length > 0 ? (
              <FlatList
                data={displayedAttendees}
                renderItem={renderListItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingTop: 8, paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={
                  <View className="items-center justify-center py-12">
                    <Text className="text-base text-neutral-500">
                      No attendees found
                    </Text>
                  </View>
                }
              />
            ) : (
              <View className="items-center justify-center py-12">
                <Text className="text-base text-neutral-500">
                No attendees found
              </Text>
            </View>
          )}
          </View>
        )}
      </View>

      {/* Filter Modal */}
      <FilterModal
        visible={isFilterModalVisible}
        onClose={() => setIsFilterModalVisible(false)}
        onApply={handleApplyFilters}
        categories={filterCategories}
        initialSelected={selectedFilterIds}
      />

      {/* Bottom Sheet Modal */}
      {showBottomSheet && selectedAttendee && (
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
                console.log("Backdrop pressed - closing modal");
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
              maxHeight: "85%",
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
                className="px-4 pb-12"
                showsVerticalScrollIndicator={false}
              >
                {/* Profile Header */}
                <View className="flex-row items-start mb-4">
                  <View className="w-16 h-16 rounded-full bg-neutral-100 items-center justify-center mr-4">
                    <PersonIcon size={32} color="#A3A3A3" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-2xl font-bold text-neutral-900 mb-1">
                      {selectedAttendee.name}
                    </Text>
                    <Text className="text-base text-neutral-600">
                      {selectedAttendee.role && selectedAttendee.company
                        ? `${selectedAttendee.role} · ${selectedAttendee.company}`
                        : selectedAttendee.role ||
                          selectedAttendee.company ||
                          ""}
                    </Text>
                  </View>
                </View>

                {/* Tags */}
                {selectedAttendee.tags && selectedAttendee.tags.length > 0 && (
                  <View className="flex-row flex-wrap mb-4">
                    {selectedAttendee.tags.map((tag, index) => (
                      <View
                        key={index}
                        className="bg-neutral-100 rounded-full px-3 py-1.5 mr-2 mb-2"
                      >
                        <Text className="text-sm font-medium text-neutral-700">
                          {tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Bio */}
                {selectedAttendee.bio && (
                  <Text className="text-base text-neutral-700 mb-4 leading-6">
                    {selectedAttendee.bio}
                  </Text>
                )}

                {/* Interests Section */}
                {selectedAttendee.interests &&
                  selectedAttendee.interests.length > 0 && (
                    <View className="mb-4">
                      <Text className="text-base font-semibold text-neutral-900 mb-2">
                        Interests
                      </Text>
                      <View className="flex-row flex-wrap">
                        {selectedAttendee.interests.map((interest, index) => (
                          <View
                            key={index}
                            className="bg-neutral-100 rounded-full px-3 py-1.5 mr-2 mb-2"
                          >
                            <Text className="text-sm font-medium text-neutral-700">
                              {interest}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                {/* LinkedIn Badge */}
                {selectedAttendee.linkedInUrl && (
                  <View className="mb-4">
                    <Text className="text-base font-semibold text-neutral-900 mb-2">
                      Social Links
                    </Text>
                    <Pressable
                      onPress={() => {
                        // TODO: Open LinkedIn URL
                        console.log("Open LinkedIn:", selectedAttendee.linkedInUrl);
                      }}
                      className="flex-row items-center bg-neutral-100 rounded-full px-4 py-2.5 self-start"
                    >
                      <LinkedInIcon size={18} color="#0A66C2" />
                      <Text className="text-sm font-medium text-neutral-900 ml-2">
                        {selectedAttendee.linkedInUrl.replace(
                          /^https?:\/\/(www\.)?linkedin\.com\/in\//i,
                          ""
                        )}
                      </Text>
                    </Pressable>
                  </View>
                )}

                {/* Action Buttons */}
                <View className="mt-2">
                  <Pressable
                    onPress={() => {
                      setMeetingAttendee(selectedAttendee);
                      closeBottomSheet();
                      setIsRequestMeetingModalVisible(true);
                    }}
                    className="w-full flex-row items-center justify-center bg-black rounded-xl py-3 px-4 mb-2"
                  >
                    <CalendarIcon size={20} color="#FFFFFF" />
                    <Text className="text-base font-medium text-white ml-2">
                      Request Meeting
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => {
                      handleConnect(selectedAttendee);
                      closeBottomSheet();
                    }}
                    className="w-full flex-row items-center justify-center bg-neutral-100 rounded-xl py-3 px-4"
                  >
                    <PeopleIcon size={20} color="#404040" />
                    <Text className="text-base font-medium text-neutral-900 ml-2">
                      Connect
                    </Text>
                  </Pressable>
        </View>
      </ScrollView>
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* Bottom Navigation */}
      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Attendees"
          onNavigate={(route) => {
            if (route === "Home") {
              navigation.navigate("Home");
            } else if (route === "Attendees") {
              // Already on Attendees screen
            } else if (route === "Schedule") {
              navigation.navigate("Schedule");
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

      {/* Request Meeting Modal */}
      <RequestMeetingModal
        visible={isRequestMeetingModalVisible}
        onClose={() => {
          setIsRequestMeetingModalVisible(false);
          setMeetingAttendee(null);
        }}
        onSubmit={(data: MeetingFormData) => {
          console.log("Meeting Request Submitted:", data);
          // Mark checklist item as completed when user requests a meeting
          markRequestMeetingComplete();
          // Show meeting request message modal
          setMeetingRequestData({
            attendeeName: meetingAttendee?.name || "Attendee",
            meetingType: data.meetingType,
            meetingTitle: data.title || "Meeting",
          });
          setIsRequestMeetingModalVisible(false);
          setIsMeetingRequestMessageVisible(true);
          setMeetingAttendee(null);
          // TODO: Send meeting request to backend
        }}
        attendeeName={meetingAttendee?.name}
      />

      {/* Connect Message Modal */}
      <ConnectMessageModal
        visible={isConnectMessageVisible}
        onClose={() => {
          setIsConnectMessageVisible(false);
          setConnectedAttendeeName("");
        }}
        attendeeName={connectedAttendeeName}
      />

      {/* Meeting Request Message Modal */}
      <MeetingRequestMessageModal
        visible={isMeetingRequestMessageVisible}
        onClose={() => {
          setIsMeetingRequestMessageVisible(false);
          setMeetingRequestData(null);
        }}
        attendeeName={meetingRequestData?.attendeeName}
        meetingType={meetingRequestData?.meetingType}
        meetingTitle={meetingRequestData?.meetingTitle}
      />
    </View>
  );
}
