import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Pressable,
  Dimensions,
  ScrollView,
  FlatList,
  TextInput,
  Platform,
  Animated as RNAnimated,
  PanResponder,
  RefreshControl,
  Image,
  ImageSourcePropType,
  Linking,
  Alert,
} from "react-native";
import { GestureDetector, Gesture, Pressable as GesturePressable } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { navigate as navigateRef } from "../navigation/navigationRef";
import { useChecklist } from "../context/ChecklistContext";
import { useAuth } from "../context/AuthContext";
import { useMeetingsBadgeContext } from "../context/MeetingsBadgeContext";
import { useNotifications } from "../context/NotificationsContext";
import { attendeeService, type Attendee as BackendAttendee, type MatchInfo } from "../services/attendeeService";
import { connectionService } from "../services/connectionService";
import { meetingService } from "../services/meetingService";
import { EVENT_ID } from "../config/env";
import { INDUSTRY_OPTIONS, getInterestFilterOptions } from "../constants/industryAndInterests";
import { ApiClientError } from "../services/api";
import {
  getCanUserBookMeetings,
  showExpoCannotBookMeetingAlert,
} from "../utils/meetingRestrictions";
import { useToast } from "../hooks/useToast";
import { useMeetingsBadgeCount } from "../hooks";
import Toast from "../components/Toast";
import {
  HeaderBar,
  BottomNavigation,
  FilterModal,
  FilterTag,
  LoadingSpinner,
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
import { getLinkedInDisplayInfo } from "../utils/linkedInUtils";
import Svg, { Path, Circle } from "react-native-svg";

/** Page size per API request when loading all attendees (one "load entire event" run). */
const ATTENDEE_PAGE_SIZE = 100;
const LOAD_MORE_THRESHOLD = 3;
/** Minimum match_score (1–10) to show attendee in Recommended tab. Backend returns score 1–10 via match_info. */
const RECOMMENDED_MIN_SCORE = 8;

/**
 * Parse match_info from backend (may be JSON string or object).
 * Backend: AI match returns { match_score: number (1–10), reason?: string }.
 * Returns { match_score, reason } or null.
 */
function parseMatchInfo(raw: string | MatchInfo | null | undefined): MatchInfo | null {
  if (raw == null) return null;
  if (typeof raw === "object" && (raw.match_score != null || raw.reason != null)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as MatchInfo;
      return parsed && (parsed.match_score != null || parsed.reason != null) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** True if attendee has match_score >= 8 (backend uses 1–10 scale for AI match). */
function isRecommendedByMatchInfo(backendAttendee: BackendAttendee | undefined): boolean {
  const info = parseMatchInfo(backendAttendee?.match_info);
  return info != null && typeof info.match_score === "number" && info.match_score >= RECOMMENDED_MIN_SCORE;
}

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
  avatar?: ImageSourcePropType;
  tags?: string[];
  bio?: string;
  interests?: string[];
  linkedInUrl?: string;
  industry?: string;
  connectionStatus?: "pending" | "accepted" | null;
  backendData?: BackendAttendee;
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

  // Use shared values for animations
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotate = useSharedValue(0);
  const leftOverlayOpacity = useSharedValue(0);
  const rightOverlayOpacity = useSharedValue(0);
  const leftOverlayScale = useSharedValue(0);
  const rightOverlayScale = useSharedValue(0);

  // Reset position when attendee changes
  React.useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
    rotate.value = 0;
    leftOverlayOpacity.value = 0;
    rightOverlayOpacity.value = 0;
    leftOverlayScale.value = 0;
    rightOverlayScale.value = 0;
  }, [attendee.id]);

  const handleSwipeComplete = (direction: "left" | "right") => {
    if (direction === "left" && onSwipeLeft) {
      onSwipeLeft();
    } else if (direction === "right" && onSwipeRight) {
      onSwipeRight();
    }
  };

  // Create pan gesture with better button compatibility
  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY;

      // Calculate rotation
      rotate.value = (event.translationX / screenWidth) * ROTATION_MAX;

      // Update overlay opacity and scale
      if (event.translationX < 0) {
        // Swiping left
        const progress = Math.min(Math.abs(event.translationX) / SWIPE_THRESHOLD, 1);
        leftOverlayOpacity.value = progress;
        leftOverlayScale.value = progress;
        rightOverlayOpacity.value = 0;
        rightOverlayScale.value = 0;
      } else if (event.translationX > 0) {
        // Swiping right
        const progress = Math.min(event.translationX / SWIPE_THRESHOLD, 1);
        rightOverlayOpacity.value = progress;
        rightOverlayScale.value = progress;
        leftOverlayOpacity.value = 0;
        leftOverlayScale.value = 0;
      }
    })
    .onEnd((event) => {
      const swipeDistance = event.translationX;
      const swipeVelocity = event.velocityX;

      if (
        Math.abs(swipeDistance) > SWIPE_THRESHOLD ||
        Math.abs(swipeVelocity) > 500
      ) {
        if (swipeDistance < -SWIPE_THRESHOLD || swipeVelocity < -500) {
          // Swipe left
          translateX.value = withSpring(-screenWidth * 1.5, {
            damping: 8,
            stiffness: 50,
          });
          translateY.value = withSpring(0, {
            damping: 8,
            stiffness: 50,
          });
          runOnJS(handleSwipeComplete)("left");
        } else if (swipeDistance > SWIPE_THRESHOLD || swipeVelocity > 500) {
          // Swipe right
          translateX.value = withSpring(screenWidth * 1.5, {
            damping: 8,
            stiffness: 50,
          });
          translateY.value = withSpring(0, {
            damping: 8,
            stiffness: 50,
          });
          runOnJS(handleSwipeComplete)("right");
        }
      } else {
        // Snap back
        translateX.value = withSpring(0, {
          damping: 8,
          stiffness: 50,
        });
        translateY.value = withSpring(0, {
          damping: 8,
          stiffness: 50,
        });
        rotate.value = withSpring(0, {
          damping: 8,
          stiffness: 50,
        });
        leftOverlayOpacity.value = withTiming(0, { duration: 200 });
        rightOverlayOpacity.value = withTiming(0, { duration: 200 });
        leftOverlayScale.value = withTiming(0, { duration: 200 });
        rightOverlayScale.value = withTiming(0, { duration: 200 });
      }
    })
    .activeOffsetX([-15, 15]) // Increased threshold: only activate after 15px horizontal movement
    .failOffsetY([-15, 15]) // Fail if vertical movement is more than 15px (allows button taps)
    .minDistance(10); // Minimum distance before gesture activates

  // Calculate scale and opacity values (static, based on index)
  // These are calculated outside the worklet since index doesn't change during animation
  const cardScale = (() => {
    if (index === 0) return 1;
    if (index === 1) return 0.97;
    if (index === 2) return 0.95;
    if (index === 3) return 0.93;
    return 0.92; // index 4
  })();

  const cardOpacity = (() => {
    if (index === 0) return 1;
    if (index === 1) return 0.92;
    if (index === 2) return 0.88;
    if (index === 3) return 0.84;
    return 0.8; // index 4
  })();

  // Animated styles using useAnimatedStyle
  const cardAnimatedStyle = useAnimatedStyle(() => {
    const rotation = interpolate(
      rotate.value,
      [-ROTATION_MAX, 0, ROTATION_MAX],
      [-15, 0, 15]
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation}deg` },
        { scale: cardScale },
      ],
      opacity: cardOpacity,
      zIndex: totalCards - index,
    };
  });

  const leftOverlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: leftOverlayOpacity.value,
      transform: [{ scale: leftOverlayScale.value }],
    };
  });

  const rightOverlayAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: rightOverlayOpacity.value,
      transform: [{ scale: rightOverlayScale.value }],
    };
  });

  if (index > 4) return null; // Only show top 5 cards

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            width: cardWidth,
          },
          cardAnimatedStyle,
        ]}
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
            leftOverlayAnimatedStyle,
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
            rightOverlayAnimatedStyle,
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
          {/* Profile Picture */}
          <View
            className={`${
              hasFilters ? "w-12 h-12" : "w-16 h-16"
            } rounded-full bg-neutral-100 items-center justify-center overflow-hidden ${
              hasFilters ? "mr-3" : "mr-4"
            }`}
          >
            {attendee.avatar && typeof attendee.avatar === "object" && "uri" in attendee.avatar && attendee.avatar.uri ? (
              <Image
                source={attendee.avatar as ImageSourcePropType}
                style={{
                  width: hasFilters ? 48 : 64,
                  height: hasFilters ? 48 : 64,
                  borderRadius: hasFilters ? 24 : 32,
                }}
                resizeMode="cover"
              />
            ) : (
              <PersonIcon size={hasFilters ? 24 : 32} color="#A3A3A3" />
            )}
          </View>

          {/* Name and Title */}
          <View className="flex-1">
            <View className="flex-row items-center flex-wrap gap-2">
              <Text
                className={`${
                  hasFilters ? "text-lg" : "text-2xl"
                } font-bold text-neutral-900 ${
                  hasFilters ? "mb-0.5 pt-2" : "mb-1"
                }`}
              >
                {attendee.name}
              </Text>
              {attendee.connectionStatus && (
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      attendee.connectionStatus === "accepted"
                        ? "#D1FAE5"
                        : "#FEF3C7",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color:
                        attendee.connectionStatus === "accepted"
                          ? "#10B981"
                          : "#F59E0B",
                    }}
                  >
                    {attendee.connectionStatus === "accepted"
                      ? "Connected"
                      : "Pending"}
                  </Text>
                </View>
              )}
            </View>
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
          <GesturePressable
            onPress={() => {
              if (onRequestMeeting) {
                onRequestMeeting(attendee);
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
          </GesturePressable>

          {attendee.connectionStatus === "accepted" ||
          attendee.connectionStatus === "pending" ? (
            <View
              className={`w-full flex-row items-center justify-center rounded-xl ${
                hasFilters ? "py-4 px-3" : "py-3 px-4"
              }`}
              style={{ backgroundColor: "#E5E7EB" }}
            >
              <PeopleIcon size={hasFilters ? 16 : 20} color="#9CA3AF" />
              <Text
                className={`${
                  hasFilters ? "text-normal font-medium" : "text-base"
                } font-medium text-neutral-500 ${hasFilters ? "ml-1.5" : "ml-2"}`}
              >
                {attendee.connectionStatus === "accepted"
                  ? "Connected"
                  : "Pending"}
              </Text>
            </View>
          ) : (
            <GesturePressable
              onPress={() => {
                if (onConnect) {
                  onConnect(attendee);
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
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
            </GesturePressable>
          )}
        </View>
      </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function AttendeesScreen() {
  const navigation =
    useNavigation<NavigationProp<RootStackParamList, "Home">>();
  const meetingsBadgeCount = useMeetingsBadgeCount();
  const { refresh: refreshMeetingsBadge } = useMeetingsBadgeContext();
  const { hasUnreadNotifications } = useNotifications();
  const { markConnectAttendeesComplete, markRequestMeetingComplete } =
    useChecklist();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"Recommended" | "All">("All");
  const [viewMode, setViewMode] = useState<"card" | "list">("list");
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
  const [connectedAttendeeName, setConnectedAttendeeName] =
    useState<string>("");

  // Meeting Request Message Modal state
  const [isMeetingRequestMessageVisible, setIsMeetingRequestMessageVisible] =
    useState(false);
  const [meetingRequestData, setMeetingRequestData] = useState<{
    attendeeName: string;
    meetingType: "Physical" | "Virtual";
    meetingTitle: string;
  } | null>(null);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");

  // Backend data state
  const [allAttendeesBackend, setAllAttendeesBackend] = useState<Attendee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [skippedAttendeeIds, setSkippedAttendeeIds] = useState<Set<string>>(new Set());
  const [attendeePage, setAttendeePage] = useState(1);
  const [hasMoreAttendees, setHasMoreAttendees] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const { toast, showToast, hideToast } = useToast();

  // Persist connection map for load-more (avoids re-fetching connections)
  const connectionStatusMapRef = useRef<Map<string, "pending" | "accepted">>(new Map());

  // Bottom sheet animation values
  const bottomSheetTranslateY = useRef(new RNAnimated.Value(0)).current;
  const backdropOpacity = useRef(new RNAnimated.Value(0)).current;
  const bottomSheetDragY = useRef(new RNAnimated.Value(0)).current;
  const dragStartY = useRef(0);

  // Filter categories: Industry/Sector and Top Interests (Job Title / Role commented out for now)
  const filterCategories: FilterCategory[] = [
    {
      id: "industry",
      title: "Industry / Sector",
      options: INDUSTRY_OPTIONS,
    },
    {
      id: "interests",
      title: "Interests",
      options: getInterestFilterOptions(),
    },
    // Job Title / Role section commented out for now
    // {
    //   id: "job-title",
    //   title: "Job Title / Role",
    //   options: [
    //     { id: "ceo-founder", label: "CEO/Founder" },
    //     { id: "cto", label: "CTO" },
    //     { id: "vp-product", label: "VP Product" },
    //     { id: "sales", label: "Sales" },
    //     { id: "designer", label: "Designer" },
    //     { id: "engineer", label: "Engineer" },
    //     { id: "marketing", label: "Marketing" },
    //     { id: "product-manager", label: "Product Manager" },
    //   ],
    // },
  ];

  const handleApplyFilters = (filterIds: string[]) => {
    setSelectedFilterIds(filterIds);
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

  /**
   * Client-side filter: match attendee against selected filter options.
   * AND across categories (industry, interests, job-title); each category matches if
   * attendee matches any selected option in that category.
   */
  const attendeeMatchesFilters = useCallback(
    (attendee: Attendee, filterIds: string[]): boolean => {
      if (filterIds.length === 0) return true;
      const byCategory: Record<string, string[]> = {};
      for (const id of filterIds) {
        const cat = filterCategories.find((c) =>
          c.options.some((o) => o.id === id)
        );
        if (!cat) continue;
        if (!byCategory[cat.id]) byCategory[cat.id] = [];
        const opt = cat.options.find((o) => o.id === id);
        if (opt) byCategory[cat.id].push(opt.label);
      }
      const normalize = (s: string) => s.toLowerCase().trim();
      for (const catId of Object.keys(byCategory)) {
        const labels = byCategory[catId];
        const match = (): boolean => {
          if (catId === "industry") {
            const ind = normalize(attendee.industry || "");
            const tagStr = (attendee.tags || []).map(normalize).join(" ");
            return labels.some(
              (l) => ind.includes(normalize(l)) || tagStr.includes(normalize(l))
            );
          }
          if (catId === "interests") {
            const list = (attendee.interests || []).map(normalize);
            return labels.some((l) =>
              list.some((i) => i.includes(normalize(l)) || normalize(l).includes(i))
            );
          }
          if (catId === "job-title") {
            const role = normalize(attendee.role || "");
            return labels.some(
              (l) => role.includes(normalize(l)) || normalize(l).includes(role)
            );
          }
          return true;
        };
        if (!match()) return false;
      }
      return true;
    },
    [filterCategories]
  );

  /**
   * Map backend Attendee to UI Attendee format
   */
  const mapBackendAttendeeToUI = (backendAttendee: BackendAttendee): Attendee => {
    const user = backendAttendee.user;
    
    // Parse metadata (might be string or object)
    let metadata = user.metadata;
    if (typeof metadata === "string") {
      try {
        metadata = JSON.parse(metadata);
      } catch (e) {
        metadata = {};
      }
    }

    // Extract name
    const firstName = user.first_name || "";
    const lastName = user.last_name || "";
    const fullName = `${firstName} ${lastName}`.trim() || user.email;

    // Extract role (job_title or organisation_role)
    const role = user.job_title || user.organisation_role || undefined;

    // Extract company name - check company.name first (like participant cards), then fall back to organisation
    const company = 
      (user as any).company?.name || 
      (user as any).company?.company_name ||
      user.organisation || 
      undefined;

    // Extract avatar
    const avatar = user.profile_pic ? { uri: user.profile_pic } : undefined;

    // Extract tags (country and industry/sector)
    const tags: string[] = [];
    if (user.country) {
      tags.push(user.country);
    }
    const industry = metadata?.industry || metadata?.sector || (user as any).company?.company_sector;
    if (industry) {
      tags.push(industry);
    }

    // Extract interests from metadata
    const interests = metadata?.interests && Array.isArray(metadata.interests)
      ? metadata.interests
      : [];

    // Extract bio from metadata
    const bio = metadata?.bio || "";

    // Extract LinkedIn URL
    const linkedInUrl = metadata?.linkedIn || metadata?.linkedin_url || undefined;

    return {
      id: String(user.id),
      name: fullName,
      role: role,
      company: company,
      avatar: avatar,
      tags: tags.length > 0 ? tags : undefined,
      bio: bio || undefined,
      interests: interests.length > 0 ? interests : undefined,
      linkedInUrl: linkedInUrl,
      industry: industry || undefined,
      backendData: backendAttendee,
    };
  };

  /**
   * Fetch all attendees for the event (load entire event – all pages in one run).
   * Used for All attendees list view so the full list is available without "load more".
   */
  const fetchAttendees = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const currentUserId = user?.user_id;

      const connectionsRes = await (currentUserId
        ? connectionService.getConnections(1, 100).catch(() => ({
            connections: [] as any[],
            pagination: { count: 0, next: null, previous: null },
          }))
        : Promise.resolve({
            connections: [] as any[],
            pagination: { count: 0, next: null, previous: null },
          }));

      const connectionStatusMap = new Map<string, "pending" | "accepted">();
      if (currentUserId && connectionsRes.connections.length > 0) {
        const currentId = String(currentUserId);
        for (const c of connectionsRes.connections) {
          const fromId = String(c.from_user.id);
          const toId = String(c.to_user.id);
          const otherId = fromId === currentId ? toId : fromId;
          if (c.status === "pending" || c.status === "accepted") {
            connectionStatusMap.set(otherId, c.status);
          }
        }
      }
      connectionStatusMapRef.current = connectionStatusMap;

      const allMapped: Attendee[] = [];
      let page = 1;
      let hasNext = true;

      while (hasNext) {
        const res = await attendeeService.getEventAttendees(EVENT_ID, "all", {
          page,
          page_size: ATTENDEE_PAGE_SIZE,
          ordering: "-id",
        });
        const mapped = res.attendees.map((a) => {
          const ui = mapBackendAttendeeToUI(a);
          const status = connectionStatusMap.get(String(ui.id)) ?? null;
          return { ...ui, connectionStatus: status };
        });
        allMapped.push(...mapped);
        hasNext = !!res.pagination?.next;
        page += 1;
      }

      setAllAttendeesBackend(allMapped);
      setAttendeePage(page - 1);
      setHasMoreAttendees(false);
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load attendees";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [user?.user_id]);

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchAttendees();
      setSkippedAttendeeIds(new Set());
    } catch (err) {
      // Error already handled in fetchAttendees
    } finally {
      setRefreshing(false);
    }
  }, [fetchAttendees]);

  /**
   * Load more attendees (infinite scroll / swipe).
   * Appends next page and merges connection status from stored map.
   */
  const loadMoreAttendees = useCallback(async () => {
    if (!hasMoreAttendees || loadingMore || isLoading) return;
    setLoadingMore(true);
    try {
      const nextPage = attendeePage + 1;
      const res = await attendeeService.getEventAttendees(EVENT_ID, "all", {
        page: nextPage,
        page_size: ATTENDEE_PAGE_SIZE,
        ordering: "-id",
      });
      const mapRef = connectionStatusMapRef.current;
      const mapped = res.attendees.map((a) => {
        const ui = mapBackendAttendeeToUI(a);
        const status = mapRef.get(String(ui.id)) ?? null;
        return { ...ui, connectionStatus: status };
      });
      setAllAttendeesBackend((prev) => [...prev, ...mapped]);
      setAttendeePage(nextPage);
      setHasMoreAttendees(!!res.pagination?.next);
    } catch (err) {
      // Optionally set error for load-more; avoid clearing list
    } finally {
      setLoadingMore(false);
    }
  }, [hasMoreAttendees, loadingMore, isLoading, attendeePage]);

  // Fetch on mount
  useEffect(() => {
    fetchAttendees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch on screen focus only if data is empty
  useFocusEffect(
    useCallback(() => {
      refreshMeetingsBadge();
      if (allAttendeesBackend.length === 0 && !isLoading) {
        fetchAttendees();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
  );

  // Mock data - remove after full integration
  const allAttendeesMock: Attendee[] = [
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

  // Use backend data if available, otherwise fall back to mock (for development)
  const allAttendees = allAttendeesBackend.length > 0 ? allAttendeesBackend : allAttendeesMock;

  const currentUserId = user?.user_id ? String(user.user_id) : null;

  // Filter out current user only (do not show own card). Skipped attendees stay visible in list with "Skipped" badge.
  const filteredAttendees = allAttendees.filter((attendee) => {
    if (currentUserId && attendee.id === currentUserId) return false;
    return true;
  });

  // Recommended attendees: those with match_info.match_score >= 5
  const recommendedAttendees = filteredAttendees.filter((attendee) =>
    isRecommendedByMatchInfo(attendee.backendData)
  );

  // Get displayed attendees based on active tab
  let displayedAttendees =
    activeTab === "Recommended" ? recommendedAttendees : filteredAttendees;

  // Apply client-side filters (industry, interests, job title)
  if (selectedFilterIds.length > 0) {
    displayedAttendees = displayedAttendees.filter((a) =>
      attendeeMatchesFilters(a, selectedFilterIds)
    );
  }

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

  // List view: show all (including skipped with "Skipped" badge). Card view: exclude skipped so we don't re-show them.
  const displayedAttendeesForCards = displayedAttendees.filter(
    (a) => !skippedAttendeeIds.has(a.id)
  );

  // State for current card index
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Reset card index when tab or filters change
  React.useEffect(() => {
    setCurrentCardIndex(0);
  }, [activeTab, selectedFilterIds]);

  // Handle bottom sheet animation when it opens
  React.useEffect(() => {
    if (showBottomSheet && selectedAttendee) {
      // Reset animation values
      bottomSheetTranslateY.setValue(1000); // Start off-screen
      backdropOpacity.setValue(0);
      bottomSheetDragY.setValue(0);

      // Animate in after a brief delay
      const timer = setTimeout(() => {
        RNAnimated.parallel([
          RNAnimated.spring(bottomSheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }),
          RNAnimated.timing(backdropOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [showBottomSheet, selectedAttendee]);

  // Handle swipe left (reject/skip). Card stack excludes skipped, so we don't advance index.
  const handleReject = () => {
    const attendee = displayedAttendeesForCards[currentCardIndex];
    if (!attendee) return;
    setSkippedAttendeeIds((prev) => new Set(prev).add(attendee.id));
    if (currentCardIndex >= displayedAttendeesForCards.length - LOAD_MORE_THRESHOLD) {
      loadMoreAttendees();
    }
  };

  // Handle swipe right (accept/connect) — create connection via API so it appears in ConnectionsScreen
  const handleAccept = () => {
    const attendee = displayedAttendeesForCards[currentCardIndex];
    if (!attendee) return;
    handleConnect(attendee, true);
  };

  // Handle connect button press
  // isFromCardView: true if called from card view buttons, false if from list view bottom sheet
  const handleConnect = useCallback(
    async (attendee: Attendee, isFromCardView: boolean = false) => {
      if (isConnecting) return;
      const currentUserId = user?.user_id;
      if (!currentUserId) {
        showToast("Sign in required to connect", "error");
        return;
      }
      setIsConnecting(true);
      try {
        await connectionService.createConnection(
          String(currentUserId),
          attendee.id
        );
      } catch (e: any) {
        const code = e?.response_code ?? e?.responseCode ?? e?.statusCode;
        const msg = (e?.message || "").toLowerCase();
        const alreadyExists =
          msg.includes("connection already exists") || msg.includes("already exists");
        if ((code === 409 || (code === 400 && alreadyExists))) {
          // Treat as success
        } else {
          showToast(e?.message || "Failed to send connection request", "error");
          setIsConnecting(false);
          return;
        }
      } finally {
        setIsConnecting(false);
      }
      connectionStatusMapRef.current.set(attendee.id, "pending");
      setAllAttendeesBackend((prev) =>
        prev.map((a) =>
          a.id === attendee.id ? { ...a, connectionStatus: "pending" as const } : a
        )
      );
      markConnectAttendeesComplete();
      setConnectedAttendeeName(attendee.name);
      setIsConnectMessageVisible(true);
      if (isFromCardView) {
        const nextIndex = currentCardIndex + 1;
        if (nextIndex < displayedAttendeesForCards.length) {
          setCurrentCardIndex(nextIndex);
          if (nextIndex >= displayedAttendeesForCards.length - LOAD_MORE_THRESHOLD) {
            loadMoreAttendees();
          }
        }
      }
    },
    [
      isConnecting,
      user?.user_id,
      showToast,
      currentCardIndex,
      displayedAttendeesForCards.length,
      markConnectAttendeesComplete,
      loadMoreAttendees,
    ]
  );

  const openBottomSheet = (attendee: Attendee) => {
    setSelectedAttendee(attendee);
    setShowBottomSheet(true);
  };

  // Close bottom sheet with animation
  const closeBottomSheet = () => {
    RNAnimated.parallel([
      RNAnimated.spring(bottomSheetTranslateY, {
        toValue: 1000,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }),
      RNAnimated.timing(backdropOpacity, {
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
          RNAnimated.spring(bottomSheetDragY, {
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
          {/* Profile Picture */}
          <View className="w-14 h-14 rounded-full bg-neutral-100 border border-neutral-200 items-center justify-center mr-3 flex-shrink-0 overflow-hidden">
            {item.avatar && typeof item.avatar === "object" && "uri" in item.avatar && item.avatar.uri ? (
              <Image
                source={item.avatar as ImageSourcePropType}
                style={{ width: 56, height: 56, borderRadius: 28 }}
                resizeMode="cover"
              />
            ) : (
              <PersonIcon size={28} color="#A3A3A3" />
            )}
          </View>

          {/* Name and Role/Company - Stacked vertically */}
          <View className="flex-1 pt-2">
            {/* Name - Bold and prominent, with optional status badge */}
            <View className="flex-row items-center flex-wrap gap-2 mb-0.5">
              <Text
                className="text-base font-bold text-neutral-900"
                numberOfLines={1}
              >
                {item.name}
              </Text>
              {item.connectionStatus && (
                <View
                  className="px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor:
                      item.connectionStatus === "accepted"
                        ? "#D1FAE5"
                        : "#FEF3C7",
                  }}
                >
                  <Text
                    className="text-xs font-medium"
                    style={{
                      color:
                        item.connectionStatus === "accepted"
                          ? "#10B981"
                          : "#F59E0B",
                    }}
                  >
                    {item.connectionStatus === "accepted"
                      ? "Connected"
                      : "Pending"}
                  </Text>
                </View>
              )}
            </View>

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

          {/* Connect / Skipped / status */}
          {item.connectionStatus === "accepted" ||
          item.connectionStatus === "pending" ? (
            <View
              className="flex-row items-center justify-center rounded-xl px-3 py-2 flex-shrink-0"
              style={{ backgroundColor: "#E5E7EB" }}
            >
              <PeopleIcon size={16} color="#9CA3AF" />
              <Text className="text-sm font-medium text-neutral-500 ml-1.5">
                {item.connectionStatus === "accepted"
                  ? "Connected"
                  : "Pending"}
              </Text>
            </View>
          ) : skippedAttendeeIds.has(item.id) ? (
            <View
              className="flex-row items-center justify-center rounded-xl px-3 py-2 flex-shrink-0"
              style={{ backgroundColor: "#F3F4F6" }}
            >
              <Text className="text-sm font-medium text-neutral-500">Skipped</Text>
            </View>
          ) : (
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
          )}
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

      <View className="flex-1">
        {/* Tabs: All attendees (left, default) and Recommended (right) */}
        <View className="px-4 pt-4 pb-3">
          <View className="flex-row border border-neutral-200 rounded-2xl bg-neutral-100">
            <Pressable
              onPress={() => setActiveTab("All")}
              className={`flex-1 py-3 px-4 rounded-2xl mr-2 ${
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
            <Pressable
              onPress={() => setActiveTab("Recommended")}
              className={`flex-1 py-3 px-4 rounded-2xl ${
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
                <Pressable onPress={() => setSearchQuery("")} className="ml-2">
                  <Text className="text-sm font-medium text-neutral-600">
                    Clear
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        )}

        {/* Loading State */}
        {isLoading && allAttendeesBackend.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <LoadingSpinner size="large" />
            <Text className="text-gray-500 mt-4">Loading attendees...</Text>
          </View>
        ) : error && allAttendeesBackend.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20 px-4">
            <Text className="text-red-600 text-center mb-4">{error}</Text>
            <Pressable
              onPress={fetchAttendees}
              className="bg-black rounded-md px-6 py-3"
            >
              <Text className="text-white font-medium">Retry</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Card View or List View */}
            {viewMode === "card" ? (
              <View
                className="flex-1 items-center px-4"
                style={{
                  minHeight: 0,
                  flexShrink: 1,
                }}
              >
                {displayedAttendeesForCards.length > 0 &&
                currentCardIndex < displayedAttendeesForCards.length ? (
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
                  {displayedAttendeesForCards
                    .slice(currentCardIndex, currentCardIndex + 5)
                    .map((attendee, index) => (
              <AttendeeCard
                key={attendee.id}
                        attendee={attendee}
                        onSwipeLeft={handleReject}
                        onSwipeRight={handleAccept}
                        onRequestMeeting={async (attendee) => {
                          const canBook = await getCanUserBookMeetings();
                          if (canBook) {
                            setMeetingAttendee(attendee);
                            setIsRequestMeetingModalVisible(true);
                          } else {
                            showExpoCannotBookMeetingAlert(navigation);
                          }
                        }}
                        onConnect={(attendee) => handleConnect(attendee, true)}
                        index={index}
                        totalCards={Math.min(
                          5,
                          displayedAttendeesForCards.length - currentCardIndex
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
                  {displayedAttendeesForCards.length === 0
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
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#1BB273"
                    colors={["#1BB273"]}
                  />
                }
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
          </>
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
          <RNAnimated.View
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
          </RNAnimated.View>

          {/* Bottom Sheet */}
          <RNAnimated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: "85%",
              transform: [
                {
                  translateY: RNAnimated.add(
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
                  <View className="w-16 h-16 rounded-full bg-neutral-100 items-center justify-center mr-4 overflow-hidden">
                    {selectedAttendee.avatar && typeof selectedAttendee.avatar === "object" && "uri" in selectedAttendee.avatar && selectedAttendee.avatar.uri ? (
                      <Image
                        source={selectedAttendee.avatar as ImageSourcePropType}
                        style={{ width: 64, height: 64, borderRadius: 32 }}
                        resizeMode="cover"
                      />
                    ) : (
                      <PersonIcon size={32} color="#A3A3A3" />
                    )}
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center flex-wrap gap-2 mb-1">
                      <Text className="text-2xl font-bold text-neutral-900">
                        {selectedAttendee.name}
                      </Text>
                      {selectedAttendee.connectionStatus && (
                        <View
                          className="px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor:
                              selectedAttendee.connectionStatus === "accepted"
                                ? "#D1FAE5"
                                : "#FEF3C7",
                          }}
                        >
                          <Text
                            className="text-xs font-medium"
                            style={{
                              color:
                                selectedAttendee.connectionStatus === "accepted"
                                  ? "#10B981"
                                  : "#F59E0B",
                            }}
                          >
                            {selectedAttendee.connectionStatus === "accepted"
                              ? "Connected"
                              : "Pending"}
                          </Text>
                        </View>
                      )}
                    </View>
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

                {/* LinkedIn Badge - display label (username), open full URL */}
                {(() => {
                  const linkedIn = getLinkedInDisplayInfo(selectedAttendee.linkedInUrl);
                  if (!linkedIn) return null;
                  return (
                    <View className="mb-4">
                      <Text className="text-base font-semibold text-neutral-900 mb-2">
                        Social Links
                      </Text>
                      <Pressable
                        onPress={async () => {
                          try {
                            const supported = await Linking.canOpenURL(linkedIn.url);
                            if (supported) {
                              await Linking.openURL(linkedIn.url);
                            } else {
                              try {
                                await Linking.openURL(linkedIn.url);
                              } catch (openError) {
                                Alert.alert(
                                  "Cannot Open LinkedIn",
                                  "Please make sure you have the LinkedIn app installed or try opening the link in your browser.",
                                  [{ text: "OK" }]
                                );
                              }
                            }
                          } catch (error) {
                            if (__DEV__) console.error("Error opening LinkedIn URL:", error);
                            Alert.alert("Error", "Failed to open LinkedIn profile. Please try again.", [{ text: "OK" }]);
                          }
                        }}
                        className="flex-row items-center bg-neutral-100 rounded-full px-4 py-2.5 self-start"
                      >
                        <LinkedInIcon size={18} color="#0A66C2" />
                        <Text className="text-sm font-medium text-neutral-900 ml-2">
                          {linkedIn.displayLabel}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })()}

                {/* Action Buttons */}
                <View className="mt-2">
                  <Pressable
                    onPress={async () => {
                      const canBook = await getCanUserBookMeetings();
                      if (canBook) {
                        setMeetingAttendee(selectedAttendee);
                        closeBottomSheet();
                        setIsRequestMeetingModalVisible(true);
                      } else {
                        closeBottomSheet();
                        showExpoCannotBookMeetingAlert(navigation);
                      }
                    }}
                    className="w-full flex-row items-center justify-center bg-black rounded-xl py-3 px-4 mb-2"
                  >
                    <CalendarIcon size={20} color="#FFFFFF" />
                    <Text className="text-base font-medium text-white ml-2">
                      Request Meeting
                    </Text>
                  </Pressable>

                  {selectedAttendee.connectionStatus === "accepted" ||
                  selectedAttendee.connectionStatus === "pending" ? (
                    <View
                      className="w-full flex-row items-center justify-center rounded-xl py-3 px-4"
                      style={{ backgroundColor: "#E5E7EB" }}
                    >
                      <PeopleIcon size={20} color="#9CA3AF" />
                      <Text className="text-base font-medium text-neutral-500 ml-2">
                        {selectedAttendee.connectionStatus === "accepted"
                          ? "Connected"
                          : "Pending"}
                      </Text>
                    </View>
                  ) : (
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
                  )}
        </View>
      </ScrollView>
            </Pressable>
          </RNAnimated.View>
        </View>
      )}

      {/* Bottom Navigation */}
      <SafeAreaView edges={["bottom"]}>
        <BottomNavigation
          items={bottomNavItems}
          activeRoute="Attendees"
          onNavigate={(route) => {
            if (route === "Home") {
              navigateRef("Home");
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
        onSubmit={async (data: MeetingFormData) => {
          if (!meetingAttendee) {
            showToast("No attendee selected", "error");
            throw new Error("No attendee");
          }
          try {
            await meetingService.submitMeetingRequestFromForm(
              EVENT_ID,
              data,
              meetingAttendee.id
            );
            markRequestMeetingComplete();
            setMeetingRequestData({
              attendeeName: meetingAttendee.name || "Attendee",
              meetingType: data.meetingType,
              meetingTitle: data.title || "Meeting",
            });
            setIsRequestMeetingModalVisible(false);
            setIsMeetingRequestMessageVisible(true);
            setMeetingAttendee(null);
          } catch (e: any) {
            const msg =
              e instanceof ApiClientError
                ? e.message
                : e?.message || "Failed to send meeting request. Please try again.";
            showToast(msg, "error");
            throw e;
          }
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

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
    </View>
  );
}
