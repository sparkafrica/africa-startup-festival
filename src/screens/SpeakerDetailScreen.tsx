import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  ScrollView,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Dimensions,
  Linking,
  Alert,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackScreenProps } from "../navigation/types";
import { ChevronLeftIcon } from "../components/HeaderIcons";
import { LinkedInIcon, CalendarIconWhite } from "../components/SocialIcons";
import {
  RequestMeetingModal,
  MeetingRequestMessageModal,
  LoadingSpinner,
  type MeetingFormData,
} from "../components";
import { useChecklist } from "../context/ChecklistContext";
import { eventService } from "../services/eventService";
import { meetingService } from "../services/meetingService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";
import {
  getCanUserBookMeetings,
  showExpoCannotBookMeetingAlert,
} from "../utils/meetingRestrictions";

// ============================================
// MODAL HEIGHT CONFIGURATION
// Change this value to adjust modal height (0.0 to 1.0)
// Example: 0.7 = 70%, 0.8 = 80%, 0.9 = 90%
// ============================================
const MODAL_HEIGHT_PERCENTAGE = 0.85;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MODAL_HEIGHT = SCREEN_HEIGHT * MODAL_HEIGHT_PERCENTAGE;
const DRAG_THRESHOLD = 100;

type Props = RootStackScreenProps<"SpeakerDetail">;

export default function SpeakerDetailScreen({ route }: Props) {
  const navigation = useNavigation<NavigationProp<any>>();
  const { speakerId, name = "Ada Okafor" } = route.params;
  const { markRequestMeetingComplete } = useChecklist();
  const [isRequestMeetingModalVisible, setIsRequestMeetingModalVisible] =
    useState(false);

  // Meeting Request Message Modal state
  const [isMeetingRequestMessageVisible, setIsMeetingRequestMessageVisible] =
    useState(false);
  const [meetingRequestData, setMeetingRequestData] = useState<{
    attendeeName: string;
    meetingType: "Physical" | "Virtual";
    meetingTitle: string;
  } | null>(null);

  // State for speaker data
  const [speakerData, setSpeakerData] = useState<any>(null);
  const [speakingSessions, setSpeakingSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation for drag-to-close
  const translateY = useRef(new Animated.Value(0)).current;
  const isAnimating = useRef(false);

  // PanResponder for drag-to-close functionality
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !isAnimating.current &&
          Math.abs(gestureState.dy) > 5 &&
          gestureState.dy > 0
        );
      },
      onPanResponderGrant: () => {
        if (isAnimating.current) return;
        translateY.stopAnimation();
        translateY.setOffset((translateY as any)._value || 0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAnimating.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating.current) return;
        translateY.flattenOffset();
        const currentValue = (translateY as any)._value || 0;

        if (currentValue > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          isAnimating.current = true;
          Animated.timing(translateY, {
            toValue: MODAL_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            isAnimating.current = false;
            navigation.goBack();
          });
        } else {
          isAnimating.current = true;
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start(() => {
            isAnimating.current = false;
          });
        }
      },
    })
  ).current;

  // Fetch speaker details and speaking sessions
  const fetchSpeakerDetails = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const speakerIdNum = typeof speakerId === "string" ? parseInt(speakerId, 10) : speakerId;
      
      if (isNaN(speakerIdNum)) {
        throw new Error("Invalid speaker ID");
      }

      // Fetch speaker details
      const speaker = await eventService.getSpeakerDetails(EVENT_ID, speakerIdNum);
      
      // Fetch all schedules to find speaking sessions for this speaker
      const schedulesResponse = await eventService.getEventSchedules(EVENT_ID, {});
      const sessions = schedulesResponse.schedules
        .filter((schedule) => {
          // Check if this schedule includes the speaker (speakers array contains IDs)
          if (Array.isArray(schedule.speakers)) {
            return schedule.speakers.some((s: any) => {
              const sId = typeof s === "number" ? s : s?.id;
              return sId === speakerIdNum;
            });
          }
          return false;
        })
        .map((schedule) => {
          // Format time from ISO string
          const startDate = new Date(schedule.start_time);
          const formatTime = (date: Date): string => {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const period = hours >= 12 ? "PM" : "AM";
            const hour12 = hours % 12 || 12;
            const minutesStr = minutes.toString().padStart(2, "0");
            return `${hour12}:${minutesStr} ${period}`;
          };

          return {
            id: schedule.id.toString(),
            title: schedule.name,
            stage: schedule.venue || "Main Stage",
            time: formatTime(startDate),
          };
        });

      // Generate consistent color for avatar
      const colors = ["#2762C7", "#1BB273", "#9333EA", "#F97316", "#DC2626", "#10B981", "#F59E0B", "#8B5CF6"];
      const avatarColor = colors[speaker.id % colors.length];

      // Map backend speaker to UI format
      setSpeakerData({
        id: speaker.id.toString(),
        name: speaker.full_name || name,
        title: speaker.role || "",
        company: speaker.company || "",
        avatar: speaker.profile_pic ? { uri: speaker.profile_pic } : null,
        avatarColor: avatarColor,
        bio: speaker.description || "",
        linkedinUrl: speaker.linkedin_url || null,
        // Tags and interests can be extracted from metadata if available
        tags: [], // TODO: Add tags if available in backend
        interests: [], // TODO: Add interests if available in backend
      });

      setSpeakingSessions(sessions);
    } catch (err: any) {
      const errorMessage =
        err instanceof ApiClientError
          ? err.message
          : "Failed to load speaker details";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [speakerId, name]);

  // Fetch on mount and screen focus
  useEffect(() => {
    fetchSpeakerDetails();
  }, [fetchSpeakerDetails]);

  useFocusEffect(
    useCallback(() => {
      fetchSpeakerDetails();
    }, [fetchSpeakerDetails])
  );

  // Handle LinkedIn button
  const handleLinkedInPress = useCallback(async () => {
    if (!speakerData?.linkedinUrl) {
      Alert.alert("LinkedIn", "LinkedIn profile not available");
      return;
    }

    try {
      const url = speakerData.linkedinUrl;
      // Ensure URL has protocol
      const formattedUrl = url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `https://${url}`;
      
      const supported = await Linking.canOpenURL(formattedUrl);
      if (supported) {
        await Linking.openURL(formattedUrl);
      } else {
        // Still try to open - might work even if canOpenURL returns false
        try {
          await Linking.openURL(formattedUrl);
        } catch (openError) {
          Alert.alert(
            "Cannot Open LinkedIn",
            "Please make sure you have the LinkedIn app installed or try opening the link in your browser.",
            [{ text: "OK" }]
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to open LinkedIn profile");
    }
  }, [speakerData?.linkedinUrl]);

  if (isLoading) {
    return (
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.modalContainer}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          <View className="flex-1 items-center justify-center py-20">
            <LoadingSpinner size="large" />
            <Text className="text-gray-500 mt-4">Loading speaker details...</Text>
          </View>
        </View>
      </View>
    );
  }

  if (error || !speakerData) {
    return (
      <View style={styles.container} pointerEvents="box-none">
        <View style={styles.modalContainer}>
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>
          <View className="flex-1 items-center justify-center py-20 px-4">
            <Text className="text-red-600 text-center mb-4">{error || "Speaker not found"}</Text>
            <Pressable
              onPress={fetchSpeakerDetails}
              className="bg-black rounded-md px-6 py-3"
            >
              <Text className="text-white font-medium">Retry</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Draggable Handle - at the very top */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Speaker Header */}
          <View className="px-4 mb-6" style={{ marginTop: 8 }}>
            <View className="flex-row items-start mt-4">
              {/* Avatar */}
              <View className="w-20 h-20 rounded-full items-center justify-center mr-4 bg-white border border-neutral-300" style={{ backgroundColor: speakerData.avatarColor }}>
                {speakerData.avatar ? (
                  <Image
                    source={speakerData.avatar as ImageSourcePropType}
                    style={{ width: 80, height: 80, borderRadius: 40 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-white font-bold text-3xl">
                    {speakerData.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>

              {/* Name and Title */}
              <View className="flex-1 mt-4">
                <Text className="text-2xl font-bold text-neutral-900 mb-1">
                  {speakerData.name}
                </Text>
                <Text className="text-base text-neutral-600">
                  {speakerData.title && speakerData.company
                    ? `${speakerData.title} • ${speakerData.company}`
                    : speakerData.title || speakerData.company || "Speaker"}
                </Text>
              </View>
            </View>

            {/* Tags - Show if available */}
            {speakerData.tags && speakerData.tags.length > 0 && (
              <View className="flex-row flex-wrap gap-2 mt-6">
                {speakerData.tags.map((tag: any) => (
                  <View
                    key={tag.id}
                    className="px-3 py-1.5 rounded-full border bg-white"
                    style={{
                      borderColor: tag.borderColor || "#E5E7EB",
                    }}
                  >
                    <Text className="text-xs font-medium text-neutral-900">
                      {tag.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Bio */}
            {speakerData.bio && (
              <Text className="text-sm text-neutral-700 leading-5 mt-4">
                {speakerData.bio}
              </Text>
            )}
          </View>

          {/* Interests Section - Show if available */}
          {speakerData.interests && speakerData.interests.length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-sm font-normal text-neutral-900 mb-3">
                Interests
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {speakerData.interests.map((interest: any) => (
                  <View
                    key={interest.id || interest}
                    className="px-3 py-1.5 bg-white border border-neutral-300 rounded-full"
                  >
                    <Text className="text-xs text-neutral-900">
                      {interest.label || interest}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Speaking Sessions Section */}
          {speakingSessions.length > 0 && (
            <View className="px-4 mb-6">
              <Text className="text-sm font-normal text-neutral-900 mb-3">
                Speaking Sessions
              </Text>
              {speakingSessions.map((session) => (
                <Pressable
                  key={session.id}
                  className="bg-neutral-100 rounded-xl p-4 border border-neutral-200 mb-2"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 2,
                    elevation: 1,
                  }}
                  onPress={() => {
                    // Navigate to schedule screen or event detail
                    navigation.navigate("Schedule");
                  }}
                >
                  <Text className="text-base font-bold text-neutral-900 mb-2">
                    {session.title}
                  </Text>
                  <Text className="text-sm text-neutral-600">
                    {session.stage} • {session.time}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <SafeAreaView
          edges={["bottom"]}
          className="bg-white border-t border-neutral-200"
        >
          <View className="px-4 pt-8 pb-6">
            <Pressable
              className="bg-neutral-900 rounded-xl py-4 items-center flex-row justify-center mb-3"
              onPress={async () => {
                const canBook = await getCanUserBookMeetings();
                if (canBook) setIsRequestMeetingModalVisible(true);
                else showExpoCannotBookMeetingAlert(navigation);
              }}
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 2,
              }}
            >
              <CalendarIconWhite size={20} color="#FFFFFF" />
              <Text className="text-base font-semibold text-white ml-2">
                Request Meeting
              </Text>
            </Pressable>

            {speakerData?.linkedinUrl && (
              <Pressable
                className="bg-neutral-100 rounded-xl py-4 items-center flex-row justify-center"
                onPress={handleLinkedInPress}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <LinkedInIcon size={20} color="#0A66C2" />
                <Text className="text-base font-semibold text-neutral-900 ml-2">
                  Connect on Linkedin
                </Text>
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Request Meeting Modal */}
      <RequestMeetingModal
        visible={isRequestMeetingModalVisible}
        onClose={() => setIsRequestMeetingModalVisible(false)}
        onExpoBlocked={() => showExpoCannotBookMeetingAlert(navigation)}
        onSubmit={async (data: MeetingFormData) => {
          if (!speakerData) {
            Alert.alert("Error", "Speaker data not loaded.");
            throw new Error("No speaker");
          }
          // Backend meeting API requires requestee_id (user). Speakers have no user_id.
          // TODO: Wire when backend links speakers to users or adds speaker-based request.
          const speakerUserId = (speakerData as any).userId ?? (speakerData as any).user_id ?? null;
          if (!speakerUserId) {
            Alert.alert(
              "Not supported",
              "Requesting meetings with speakers is not yet supported. Use Attendees or Connections to request meetings."
            );
            throw new Error("No speaker user id");
          }
          try {
            await meetingService.submitMeetingRequestFromForm(
              EVENT_ID,
              data,
              String(speakerUserId)
            );
            markRequestMeetingComplete();
            setMeetingRequestData({
              attendeeName: speakerData.name,
              meetingType: data.meetingType,
              meetingTitle: data.title || "Meeting",
            });
            setIsRequestMeetingModalVisible(false);
            setIsMeetingRequestMessageVisible(true);
          } catch (e: any) {
            const msg =
              e instanceof ApiClientError
                ? e.message
                : e?.message || "Failed to send meeting request. Please try again.";
            Alert.alert("Error", msg);
            throw e;
          }
        }}
        attendeeName={speakerData?.name || name}
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

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
  },
  modalContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: MODAL_HEIGHT,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
});
