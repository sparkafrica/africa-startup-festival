import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Image,
  ImageSourcePropType,
  Dimensions,
  Linking,
  Alert,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { PersonProfileIcon } from "./icons";
import { LinkedInIcon, CalendarIconWhite } from "./SocialIcons";
import RequestMeetingModal from "./RequestMeetingModal";
import MeetingRequestMessageModal from "./MeetingRequestMessageModal";
import LoadingSpinner from "./LoadingSpinner";
import type { MeetingFormData } from "./RequestMeetingModal";
import { useChecklist } from "../context/ChecklistContext";
import { eventService } from "../services/eventService";
import { meetingService } from "../services/meetingService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";
import {
  getCanUserBookMeetings,
  showExpoCannotBookMeetingAlert,
} from "../utils/meetingRestrictions";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const SHEET_MAX_WIDTH = Math.min(SCREEN_WIDTH, 420);
const TAG_COLORS = ["#7DD3FC", "#86EFAC", "#93C5FD", "#A7F3D0"];
const AVATAR_COLORS = [
  "#2762C7",
  "#1BB273",
  "#9333EA",
  "#F97316",
  "#DC2626",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
];

export interface SpeakerDetailModalProps {
  visible: boolean;
  onClose: () => void;
  speakerId: string;
  eventId?: number;
  name?: string;
}

export default function SpeakerDetailModal({
  visible,
  onClose,
  speakerId,
  eventId = EVENT_ID,
  name: fallbackName = "Speaker",
}: SpeakerDetailModalProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { markRequestMeetingComplete } = useChecklist();

  const [speakerData, setSpeakerData] = useState<any>(null);
  const [speakingSessions, setSpeakingSessions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRequestMeetingModalVisible, setIsRequestMeetingModalVisible] =
    useState(false);
  const [isMeetingRequestMessageVisible, setIsMeetingRequestMessageVisible] =
    useState(false);
  const [meetingRequestData, setMeetingRequestData] = useState<{
    attendeeName: string;
    meetingType: "Physical" | "Virtual";
    meetingTitle: string;
  } | null>(null);

  const fetchSpeakerDetails = useCallback(async () => {
    if (!visible || !speakerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const speakerIdNum =
        typeof speakerId === "string" ? parseInt(speakerId, 10) : speakerId;
      if (isNaN(speakerIdNum)) throw new Error("Invalid speaker ID");

      const speaker = await eventService.getSpeakerDetails(eventId, speakerIdNum);
      const schedulesResponse = await eventService.getEventSchedules(eventId, {});
      const sessions = schedulesResponse.schedules
        .filter((schedule) => {
          if (Array.isArray(schedule.speakers)) {
            return schedule.speakers.some((s: any) => {
              const sId = typeof s === "number" ? s : s?.id;
              return sId === speakerIdNum;
            });
          }
          return false;
        })
        .map((schedule) => {
          const startDate = new Date(schedule.start_time);
          const hours = startDate.getHours();
          const minutes = startDate.getMinutes();
          const period = hours >= 12 ? "PM" : "AM";
          const hour12 = hours % 12 || 12;
          const minutesStr = minutes.toString().padStart(2, "0");
          return {
            id: schedule.id.toString(),
            title: schedule.name,
            stage: schedule.venue || "Main Stage",
            time: `${hour12}:${minutesStr} ${period}`,
          };
        });

      const avatarColor = AVATAR_COLORS[speaker.id % AVATAR_COLORS.length];
      const rawTags = (speaker as any).metadata?.tags ?? (speaker as any).tags ?? [];
      const tags = Array.isArray(rawTags)
        ? rawTags.map((t: any, i: number) =>
            typeof t === "string"
              ? { label: t, borderColor: TAG_COLORS[i % TAG_COLORS.length] }
              : {
                  label: t.label || t.name || String(t),
                  borderColor: t.borderColor || TAG_COLORS[i % TAG_COLORS.length],
                }
          )
        : [];

      const rawInterests =
        (speaker as any).metadata?.interests ?? (speaker as any).interests ?? [];
      const interests = Array.isArray(rawInterests)
        ? rawInterests.map((i: any) =>
            typeof i === "string" ? i : i.label || i.name || String(i)
          )
        : [];

      setSpeakerData({
        id: speaker.id.toString(),
        name: speaker.full_name || fallbackName,
        title: speaker.role || "",
        company: speaker.company || "",
        avatar: speaker.profile_pic ? { uri: speaker.profile_pic } : null,
        avatarColor,
        bio: speaker.description || "",
        linkedinUrl: speaker.linkedin_url || null,
        tags,
        interests,
      });
      setSpeakingSessions(sessions);
    } catch (err: any) {
      setError(
        err instanceof ApiClientError
          ? err.message
          : "Failed to load speaker details"
      );
    } finally {
      setIsLoading(false);
    }
  }, [visible, speakerId, eventId, fallbackName]);

  useEffect(() => {
    if (visible && speakerId) fetchSpeakerDetails();
  }, [visible, speakerId, fetchSpeakerDetails]);

  const handleLinkedInPress = useCallback(async () => {
    if (!speakerData?.linkedinUrl) {
      Alert.alert("LinkedIn", "LinkedIn profile not available");
      return;
    }
    try {
      const url =
        speakerData.linkedinUrl.startsWith("http://") ||
        speakerData.linkedinUrl.startsWith("https://")
          ? speakerData.linkedinUrl
          : `https://${speakerData.linkedinUrl}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        try {
          await Linking.openURL(url);
        } catch {
          Alert.alert(
            "Cannot Open LinkedIn",
            "Please install the LinkedIn app or try in your browser.",
            [{ text: "OK" }]
          );
        }
      }
    } catch {
      Alert.alert("Error", "Failed to open LinkedIn profile");
    }
  }, [speakerData?.linkedinUrl]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.45)" }]}
          onPress={onClose}
        />
        <View
          style={{
            width: "100%",
            alignItems: "center",
            maxHeight: SCREEN_HEIGHT * 0.85,
          }}
        >
          {/* Bottom sheet - Figma layout */}
          <View
            style={{
              width: SHEET_MAX_WIDTH,
              maxWidth: "100%",
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden",
            }}
          >
            {/* Drag handle - w-12 h-1.5 bg-neutral-300 rounded-full mt-3 mb-6 */}
            <View
              style={{
                width: 48,
                height: 6,
                backgroundColor: "#D4D4D4",
                borderRadius: 999,
                alignSelf: "center",
                marginTop: 12,
                marginBottom: 24,
              }}
            />

            {isLoading ? (
              <View style={{ padding: 32, alignItems: "center" }}>
                <LoadingSpinner size="large" />
                <Text style={{ color: "#6B7280", marginTop: 16 }}>
                  Loading speaker...
                </Text>
              </View>
            ) : error || !speakerData ? (
              <View style={{ padding: 32, alignItems: "center" }}>
                <Text
                  style={{
                    color: "#DC2626",
                    textAlign: "center",
                    marginBottom: 16,
                  }}
                >
                  {error || "Speaker not found"}
                </Text>
                <Pressable
                  onPress={fetchSpeakerDetails}
                  style={{
                    backgroundColor: "#000",
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "500" }}>Retry</Text>
                </Pressable>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: SCREEN_HEIGHT * 0.75 }}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingBottom: Math.max(48, insets.bottom),
                }}
                showsVerticalScrollIndicator={false}
              >
                {/* Profile header - avatar w-16 h-16, name, title • company */}
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: "#F3F4F6",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                      overflow: "hidden",
                    }}
                  >
                    {speakerData.avatar ? (
                      <Image
                        source={speakerData.avatar as ImageSourcePropType}
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 32,
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <PersonProfileIcon size={32} color="#111827" />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontSize: 24,
                        fontWeight: "700",
                        color: "#171717",
                        marginBottom: 4,
                      }}
                    >
                      {speakerData.name}
                    </Text>
                    <Text
                      style={{
                        fontSize: 16,
                        color: "#525252",
                        lineHeight: 24,
                      }}
                    >
                      {speakerData.title && speakerData.company
                        ? `${speakerData.title} • ${speakerData.company}`
                        : speakerData.title || speakerData.company || "Speaker"}
                    </Text>
                  </View>
                </View>

                {/* Primary tags - white bg, colored border, colored text */}
                {speakerData.tags?.length > 0 && (
                  <View
                    style={{
                      flexDirection: "row",
                      flexWrap: "wrap",
                      marginBottom: 16,
                    }}
                  >
                    {speakerData.tags.map((tag: any, idx: number) => (
                      <View
                        key={tag.label || idx}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 999,
                          backgroundColor: "#FFFFFF",
                          borderWidth: 1,
                          borderColor: tag.borderColor || "#E5E7EB",
                          marginRight: 8,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 14,
                            fontWeight: "500",
                            color: tag.borderColor || "#404040",
                          }}
                        >
                          {tag.label || tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Bio - text-base text-neutral-700 mb-4 leading-6 */}
                {speakerData.bio && (
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#404040",
                      lineHeight: 24,
                      marginBottom: 16,
                    }}
                  >
                    {speakerData.bio}
                  </Text>
                )}

                {/* Interests - bg-neutral-100 pills */}
                {speakerData.interests?.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#171717",
                        marginBottom: 8,
                      }}
                    >
                      Interests
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                      {speakerData.interests.map((interest: any, idx: number) => (
                        <View
                          key={interest.label || idx}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 999,
                            backgroundColor: "#F5F5F5",
                            marginRight: 8,
                            marginBottom: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "500",
                              color: "#404040",
                            }}
                          >
                            {interest.label || interest}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Speaking sessions */}
                {speakingSessions.length > 0 && (
                  <View style={{ marginBottom: 16 }}>
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "600",
                        color: "#171717",
                        marginBottom: 8,
                      }}
                    >
                      Speaking Sessions
                    </Text>
                    {speakingSessions.map((session) => (
                      <Pressable
                        key={session.id}
                        onPress={() => {
                          onClose();
                          navigation.navigate("Schedule");
                        }}
                        style={{
                          backgroundColor: "#F5F5F5",
                          borderRadius: 12,
                          padding: 16,
                          marginBottom: 8,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 16,
                            fontWeight: "700",
                            color: "#171717",
                            marginBottom: 8,
                          }}
                        >
                          {session.title}
                        </Text>
                        <Text
                          style={{
                            fontSize: 14,
                            color: "#525252",
                          }}
                        >
                          {session.stage} · {session.time}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Action buttons - mt-2 */}
                <View style={{ marginTop: 8 }}>
                  <Pressable
                    onPress={async () => {
                      const canBook = await getCanUserBookMeetings();
                      if (canBook) setIsRequestMeetingModalVisible(true);
                      else showExpoCannotBookMeetingAlert(navigation);
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#000",
                      borderRadius: 12,
                      paddingVertical: 12,
                      paddingHorizontal: 16,
                      marginBottom: 8,
                    }}
                  >
                    <CalendarIconWhite size={20} color="#FFFFFF" />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "500",
                        color: "#FFFFFF",
                        marginLeft: 8,
                      }}
                    >
                      Request Meeting
                    </Text>
                  </Pressable>

                  {speakerData?.linkedinUrl && (
                    <Pressable
                      onPress={handleLinkedInPress}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#F5F5F5",
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                      }}
                    >
                      <LinkedInIcon size={20} color="#0A66C2" />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "500",
                          color: "#171717",
                          marginLeft: 8,
                        }}
                      >
                        Connect on LinkedIn
                      </Text>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </View>

      {/* Request Meeting Modal */}
      <RequestMeetingModal
        visible={isRequestMeetingModalVisible}
        onClose={() => setIsRequestMeetingModalVisible(false)}
        onExpoBlocked={() => showExpoCannotBookMeetingAlert(navigation)}
        onSubmit={async (data: MeetingFormData) => {
          if (!speakerData) throw new Error("No speaker");
          const speakerUserId =
            (speakerData as any).userId ?? (speakerData as any).user_id ?? null;
          if (!speakerUserId) {
            Alert.alert(
              "Not supported",
              "Requesting meetings with speakers is not yet supported."
            );
            throw new Error("No speaker user id");
          }
          try {
            await meetingService.submitMeetingRequestFromForm(
              eventId,
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
                : e?.message || "Failed to send meeting request.";
            Alert.alert("Error", msg);
            throw e;
          }
        }}
        attendeeName={speakerData?.name || fallbackName}
      />

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
    </Modal>
  );
}
