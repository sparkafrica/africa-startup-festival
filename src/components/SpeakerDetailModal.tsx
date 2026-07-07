import React, { useState, useEffect, useCallback, useRef } from "react";
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
  Animated,
  PanResponder,
  type LayoutChangeEvent,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import {
  PersonProfileIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "./icons";
import { LinkedInIcon } from "./SocialIcons";
import { Skeleton, SkeletonListRows } from "./Skeleton";
import { eventService, type SpeakerNestedEvent } from "../services/eventService";
import { EVENT_ID } from "../config/env";
import { ApiClientError } from "../services/api";
import { getCachedEventSchedules } from "../utils/scheduleCache";
import {
  buildSpeakingSessionsFromSchedules,
  formatSpeakingSessionTitleLine,
  stageKeyForScheduleId,
  type SpeakingSessionRow,
  venueToStageKey,
} from "../utils/scheduleSpeakingSessions";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");
const SHEET_MAX_WIDTH = Math.min(SCREEN_WIDTH, 420);
const DRAG_TO_CLOSE_THRESHOLD = 100;
const SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.85;
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

/** Clock label from API `time` (ISO) or date-only fallback — matches schedule-derived formatting. */
function formatSessionTimeLabel(
  isoTime?: string | null,
  dateOnly?: string | null
): string {
  const raw =
    (isoTime && isoTime.trim()) ||
    (dateOnly && dateOnly.trim() ? `${dateOnly.trim()}T12:00:00` : "");
  if (!raw) return "—";
  const startDate = new Date(raw);
  if (isNaN(startDate.getTime())) {
    return isoTime?.trim() || dateOnly?.trim() || "—";
  }
  const hours = startDate.getHours();
  const minutes = startDate.getMinutes();
  const period = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const minutesStr = minutes.toString().padStart(2, "0");
  return `${hour12}:${minutesStr} ${period}`;
}

const SPEAKER_BIO_WORD_LIMIT = 80;

/** Returns a prefix of up to `maxWords` words; `truncated` is true if the full text has more. */
function truncateBioByWords(
  full: string,
  maxWords: number
): { preview: string; truncated: boolean } {
  const trimmed = full.trim();
  if (!trimmed) return { preview: "", truncated: false };
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return { preview: trimmed, truncated: false };
  }
  return { preview: words.slice(0, maxWords).join(" "), truncated: true };
}

function speakingSessionsFromSpeakerEvents(
  events: SpeakerNestedEvent[],
): SpeakingSessionRow[] {
  return events.map((ev) => {
    const clock = formatSessionTimeLabel(ev.time ?? null, ev.date ?? null);
    const description = (ev.description && ev.description.trim()) || "";
    const timeRange =
      clock !== "—"
        ? clock
        : (ev.dates?.trim() || ev.date?.trim() || "");
    const title = (ev.name && ev.name.trim()) || "Session";
    return {
      id: String(ev.id),
      scheduleId: ev.id,
      title,
      timeRange,
      titleLine: formatSpeakingSessionTitleLine(title, timeRange),
      description,
      venue: (ev.venue && ev.venue.trim()) || undefined,
    };
  });
}

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
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const sheetTranslateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const sheetHeightRef = useRef(SCREEN_HEIGHT);
  const sheetMeasuredRef = useRef(false);
  const sheetAnimatingRef = useRef(false);

  const [speakerData, setSpeakerData] = useState<any>(null);
  const [speakingSessions, setSpeakingSessions] = useState<SpeakingSessionRow[]>(
    [],
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bioExpanded, setBioExpanded] = useState(false);

  const fetchSpeakerDetails = useCallback(async () => {
    if (!visible || !speakerId) return;
    setIsLoading(true);
    setError(null);
    try {
      const speakerIdNum =
        typeof speakerId === "string" ? parseInt(speakerId, 10) : speakerId;
      if (isNaN(speakerIdNum)) throw new Error("Invalid speaker ID");

      const speaker = await eventService.getSpeakerDetails(eventId, speakerIdNum);

      const cachedSchedules = getCachedEventSchedules();
      let sessions = cachedSchedules?.length
        ? buildSpeakingSessionsFromSchedules(cachedSchedules, speakerIdNum)
        : [];

      if (sessions.length === 0) {
        const nested = speaker.events;
        if (Array.isArray(nested) && nested.length > 0) {
          sessions = speakingSessionsFromSpeakerEvents(nested);
        } else {
          const allSchedules = await eventService.getAllEventSchedules(eventId, {
            ordering: "start_time",
          });
          sessions = buildSpeakingSessionsFromSchedules(
            allSchedules,
            speakerIdNum,
          );
        }
      }

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

  useEffect(() => {
    if (visible) setBioExpanded(false);
  }, [visible, speakerId]);

  const handleSheetLayout = useCallback((e: LayoutChangeEvent) => {
    const h = e.nativeEvent.layout.height;
    if (h > 0 && !sheetMeasuredRef.current) {
      sheetHeightRef.current = Math.min(h, SHEET_MAX_HEIGHT);
      sheetMeasuredRef.current = true;
    }
  }, []);

  useEffect(() => {
    if (visible) {
      sheetTranslateY.stopAnimation();
      sheetAnimatingRef.current = false;
      const initialY = sheetMeasuredRef.current
        ? sheetHeightRef.current
        : SCREEN_HEIGHT;
      sheetTranslateY.setValue(initialY);
      sheetAnimatingRef.current = true;
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        sheetAnimatingRef.current = false;
      });
    } else {
      sheetTranslateY.stopAnimation();
      sheetAnimatingRef.current = false;
      sheetTranslateY.setValue(SCREEN_HEIGHT);
      sheetMeasuredRef.current = false;
    }
  }, [visible, sheetTranslateY]);

  const sheetPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !sheetAnimatingRef.current,
      onMoveShouldSetPanResponder: (_, g) =>
        !sheetAnimatingRef.current &&
        Math.abs(g.dy) > 5 &&
        g.dy > 0,
      onPanResponderGrant: () => {
        if (sheetAnimatingRef.current) return;
        sheetTranslateY.stopAnimation();
        sheetTranslateY.setOffset(
          (sheetTranslateY as unknown as { _value?: number })._value ?? 0
        );
        sheetTranslateY.setValue(0);
      },
      onPanResponderMove: (_, g) => {
        if (sheetAnimatingRef.current) return;
        if (g.dy > 0) sheetTranslateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (sheetAnimatingRef.current) return;
        sheetTranslateY.flattenOffset();
        const y =
          (sheetTranslateY as unknown as { _value?: number })._value ?? 0;
        const dismissDistance =
          sheetHeightRef.current || SCREEN_HEIGHT;
        if (y > DRAG_TO_CLOSE_THRESHOLD || g.vy > 0.5) {
          sheetAnimatingRef.current = true;
          Animated.timing(sheetTranslateY, {
            toValue: dismissDistance,
            duration: 220,
            useNativeDriver: true,
          }).start(() => {
            sheetTranslateY.setValue(0);
            sheetAnimatingRef.current = false;
            onCloseRef.current();
          });
        } else {
          sheetAnimatingRef.current = true;
          Animated.spring(sheetTranslateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start(() => {
            sheetAnimatingRef.current = false;
          });
        }
      },
    })
  ).current;

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
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
            maxHeight: SHEET_MAX_HEIGHT,
          }}
          pointerEvents="box-none"
        >
          <Animated.View
            onLayout={handleSheetLayout}
            style={{
              width: SHEET_MAX_WIDTH,
              maxWidth: "100%",
              maxHeight: SHEET_MAX_HEIGHT,
              backgroundColor: "#FFFFFF",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              overflow: "hidden",
              transform: [{ translateY: sheetTranslateY }],
            }}
          >
            {/* Drag handle — wide touch strip above/below pill (users expect a large drag zone) */}
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingTop: 4,
                paddingBottom: 4,
                minHeight: 50,
              }}
              {...sheetPanResponder.panHandlers}
            >
              <View
                style={{
                  width: 48,
                  height: 6,
                  backgroundColor: "#D4D4D4",
                  borderRadius: 999,
                }}
              />
            </View>

            {isLoading ? (
              <View style={{ padding: 24 }}>
                <Skeleton width={120} height={120} borderRadius={60} style={{ alignSelf: "center", marginBottom: 20 }} />
                <Skeleton width="70%" height={20} style={{ alignSelf: "center", marginBottom: 12 }} />
                <SkeletonListRows count={4} hasAvatar={false} />
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

                {/* Bio — truncated by word count so sessions / LinkedIn stay discoverable */}
                {speakerData.bio && (() => {
                  const fullBio = String(speakerData.bio);
                  const { preview, truncated } = truncateBioByWords(
                    fullBio,
                    SPEAKER_BIO_WORD_LIMIT
                  );
                  const showToggle = truncated;
                  const displayText =
                    bioExpanded || !truncated ? fullBio : preview;
                  return (
                    <View style={{ marginBottom: 16 }}>
                      <Text
                        style={{
                          fontSize: 16,
                          color: "#404040",
                          lineHeight: 24,
                        }}
                      >
                        {displayText}
                        {showToggle && !bioExpanded ? "…" : ""}
                      </Text>
                      {showToggle && (
                        <Pressable
                          onPress={() => setBioExpanded((e) => !e)}
                          hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                          style={{
                            alignSelf: "flex-start",
                            marginTop: 6,
                            flexDirection: "row",
                            alignItems: "center",
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 14,
                              fontWeight: "200",
                              color: "#A3A3A3",
                            }}
                          >
                            {bioExpanded ? "See less" : "See more"}
                          </Text>
                          <View style={{ marginLeft: 4 }}>
                            {bioExpanded ? (
                              <ChevronUpIcon size={14} color="#A3A3A3" />
                            ) : (
                              <ChevronDownIcon size={14} color="#A3A3A3" />
                            )}
                          </View>
                        </Pressable>
                      )}
                    </View>
                  );
                })()}

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
                          const cached = getCachedEventSchedules();
                          const highlightStage =
                            session.venue != null
                              ? venueToStageKey(session.venue)
                              : stageKeyForScheduleId(
                                  session.scheduleId,
                                  cached,
                                );
                          navigation.navigate({
                            name: "Schedule",
                            params: {
                              highlightScheduleId: session.scheduleId,
                              highlightStage,
                            },
                            merge: true,
                          });
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
                            marginBottom: session.description ? 8 : 0,
                          }}
                        >
                          {session.titleLine}
                        </Text>
                        {session.description ? (
                          <Text
                            style={{
                              fontSize: 14,
                              color: "#525252",
                              lineHeight: 20,
                            }}
                          >
                            {session.description}
                          </Text>
                        ) : null}
                      </Pressable>
                    ))}
                  </View>
                )}

                {/* Primary action: LinkedIn only (no speaker meeting requests). */}
                <View style={{ marginTop: 8 }}>
                  {speakerData?.linkedinUrl ? (
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
                  ) : (
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#F5F5F5",
                        borderRadius: 12,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        opacity: 0.65,
                      }}
                    >
                      <LinkedInIcon size={20} color="#9CA3AF" />
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "500",
                          color: "#737373",
                          marginLeft: 8,
                        }}
                      >
                        LinkedIn not available
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
