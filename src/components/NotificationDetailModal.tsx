import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Image,
  PanResponder,
  Animated,
  Dimensions,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import MeetingActionToast from "./MeetingActionToast";
import { LinkedInIcon } from "./SocialIcons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;

interface NotificationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  notification: {
    id: string;
    type:
      | "meeting_request" // Inbound: Accept/Decline
      | "meeting_time_change" // Info + View meeting
      | "meeting_approved" // Info + View meeting (scheduled)
      | "meeting_request_sent" // Info + View meeting
      | "meeting_cancelled" // Info + OK
      | "connection" // Legacy fallback
      | "connection_request" // Inbound: X wants to connect → View connections
      | "connection_accepted" // X accepted your connection → View connections
      | "ticket_allocation_accepted" // Info + View allocation → My tickets
      | "ticket_allocation_declined" // Info + View allocation → My tickets
      | "reminder" // Info + View meeting
      | "app_update" // Store update: Later + Update
      | "generic"; // Simple info + OK
    title: string;
    description?: string;
    requester?: {
      name: string;
      role: string;
      company: string;
      avatar?: { uri: string };
      tags?: string[];
      interests?: string[];
      socialLabel?: string;
      linkedInUrl?: string;
    };
    meetingDetails?: {
      title: string;
      originalTime?: string;
      newTime?: string;
      location?: string;
    };
    reason?: string;
    cancelledBy?: "them" | "you";
    onAccept?: () => void;
    onDecline?: () => void;
    onViewMeeting?: () => void;
    onViewAllocation?: () => void;
    onViewProfile?: () => void;
    /** App store update CTA (opens Play / App Store). */
    onOpenAppStore?: () => void | Promise<void>;
  } | null;
}

function CheckIcon({
  size = 20,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289C3.68342 8.90237 4.31658 8.90237 4.70711 9.29289L8 12.5858L15.2929 5.29289C15.6834 4.90237 16.3166 4.90237 16.7071 5.29289Z"
        fill={color}
      />
    </Svg>
  );
}

function XIcon({
  size = 20,
  color = "#EF4444",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M15 5L5 15M5 5L15 15"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function NotificationDetailModal({
  visible,
  onClose,
  notification,
}: NotificationDetailModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const [showToast, setShowToast] = useState(false);
  const [toastAction, setToastAction] = useState<"accepted" | "declined">("accepted");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to downward drags with sufficient movement
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value || 0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow dragging down
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();

        if (gestureState.dy > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(SCREEN_HEIGHT);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (visible) {
      // Smooth entrance animation
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
      setShowToast(false);
      setIsSubmitting(false);
    } else {
      translateY.setValue(SCREEN_HEIGHT);
      setShowToast(false);
      setIsSubmitting(false);
    }
  }, [visible, translateY]);

  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        {/* Semi-transparent Background */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Modal Content */}
        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: translateY }],
            },
          ]}
        >
          <SafeAreaView edges={["bottom"]}>
            {/* Draggable Handle Area */}
            <View style={styles.draggableArea} {...panResponder.panHandlers}>
              <View style={styles.handleContainer}>
                <View style={styles.handle} />
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 24 }}
            >
              {/* Title */}
              <View className="px-6 pt-2 pb-4">
                <Text
                  className="text-2xl font-bold text-neutral-900"
                  style={{ fontSize: 24, lineHeight: 32 }}
                >
                  {notification.title}
                </Text>
              </View>

              {/* Intro Text */}
              {notification.type === "meeting_request" && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    {notification.requester?.name
                      ? `${notification.requester.name} has requested a meeting with you.`
                      : "Someone has requested a meeting with you."}
                  </Text>
                </View>
              )}
              {notification.type === "meeting_time_change" && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    The meeting request has been updated with new details.
                  </Text>
                </View>
              )}
              {notification.type === "meeting_approved" && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    Your meeting request has been accepted.
                  </Text>
                </View>
              )}
              {(notification.type === "ticket_allocation_accepted" ||
                notification.type === "ticket_allocation_declined") && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    {notification.type === "ticket_allocation_accepted"
                      ? "Your ticket allocation has been accepted."
                      : "Your ticket allocation has been declined."}
                  </Text>
                </View>
              )}
              {notification.type === "meeting_request_sent" && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    Your meeting request has been sent successfully.
                  </Text>
                </View>
              )}
              {notification.type === "connection_request" && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    {notification.requester?.name
                      ? `${notification.requester.name} wants to connect with you.`
                      : "Someone wants to connect with you."}
                  </Text>
                </View>
              )}
              {(notification.type === "connection" ||
                notification.type === "connection_accepted") && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    {notification.requester?.name
                      ? `${notification.requester.name} accepted your connection request.`
                      : "Your connection request has been accepted."}
                  </Text>
                </View>
              )}
              {notification.type === "meeting_cancelled" && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    This meeting has been cancelled.
                  </Text>
                </View>
              )}
              {/* App update: same single body as push — only backend `description` (no stacked client + server copy). */}
              {notification.type === "app_update" && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    {notification.description?.trim()
                      ? notification.description.trim()
                      : "A new version of the app is available. Update for the latest fixes and features."}
                  </Text>
                </View>
              )}
              {/* Description: generic and other types without cards — not app_update (handled above). */}
              {(notification.type === "generic" ||
                (!notification.meetingDetails &&
                  !notification.requester &&
                  notification.type !== "app_update")) &&
                notification.description && (
                  <View className="px-6 pb-4">
                    <Text className="text-base text-neutral-600 leading-6">
                      {notification.description}
                    </Text>
                  </View>
                )}

              {/* Meeting Details Card */}
              {notification.meetingDetails && (
                <View className="px-6 mb-4">
                  <View
                    className="rounded-2xl p-4"
                    style={{
                      backgroundColor:
                        notification.type === "meeting_cancelled"
                          ? "#FEF2F2"
                          : "#FFF7ED",
                    }}
                  >
                    <Text
                      className="text-lg font-semibold text-neutral-900 mb-3"
                      style={{ fontSize: 18, lineHeight: 24 }}
                    >
                      {notification.meetingDetails.title}
                    </Text>
                    {notification.type === "meeting_time_change" &&
                    notification.meetingDetails.newTime ? (
                      <>
                        {notification.meetingDetails.originalTime && (
                          <View className="mb-2">
                            <Text className="text-sm text-neutral-500 line-through">
                              From: {notification.meetingDetails.originalTime}
                            </Text>
                          </View>
                        )}
                        <View>
                          <Text
                            className="text-sm font-medium"
                            style={{ color: "#EF4444" }}
                          >
                            To: {notification.meetingDetails.newTime}
                          </Text>
                        </View>
                      </>
                    ) : notification.type === "meeting_time_change" ? (
                      <View>
                        <Text className="text-sm text-neutral-600">
                          {notification.meetingDetails.originalTime ?? "Details updated"}
                        </Text>
                        <Text className="text-xs text-neutral-500 mt-1">
                          Details have been updated.
                        </Text>
                      </View>
                    ) : (
                      <>
                        {notification.meetingDetails.originalTime && (
                          <View className="mb-2">
                            <Text className="text-sm text-neutral-600">
                              {notification.meetingDetails.originalTime}
                            </Text>
                          </View>
                        )}
                        {notification.meetingDetails.location && (
                          <View>
                            <Text className="text-sm text-neutral-600">
                              {notification.meetingDetails.location}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                </View>
              )}

              {/* Requester Information Card */}
              {notification.requester && (
                <View className="px-6 mb-4">
                  <View
                    className="bg-white rounded-2xl p-4 border border-neutral-200"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <View className="flex-row items-center">
                      {notification.requester.avatar ? (
                        <Image
                          source={notification.requester.avatar}
                          className="w-12 h-12 rounded-full mr-3"
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          className="w-12 h-12 rounded-full items-center justify-center mr-3"
                          style={{ backgroundColor: "#000000" }}
                        >
                          <Text className="text-white font-bold text-lg">
                            {notification.requester.name.charAt(0)}
                          </Text>
                        </View>
                      )}
                      <View className="flex-1">
                        <Text
                          className="text-base font-semibold text-neutral-900 mb-0.5"
                          style={{ fontSize: 16, lineHeight: 22 }}
                        >
                          {notification.requester.name}
                        </Text>
                        <Text className="text-sm text-neutral-600 mb-2">
                          {[notification.requester.role, notification.requester.company].filter(Boolean).join(" • ") || ""}
                        </Text>
                        
                        {/* Tags (Country, Role, Sector) */}
                        {notification.requester.tags && notification.requester.tags.length > 0 && (
                          <View className="flex-row flex-wrap mb-2" style={{ gap: 6 }}>
                            {notification.requester.tags.map((tag, index) => (
                              <View
                                key={index}
                                className="px-3 py-1 bg-neutral-100 rounded-full border border-neutral-200"
                              >
                                <Text className="text-xs text-neutral-700 font-medium">
                                  {tag}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Interests */}
                        {notification.requester.interests && notification.requester.interests.length > 0 && (
                          <View className="flex-row flex-wrap mb-2" style={{ gap: 6 }}>
                            {notification.requester.interests.map((interest, index) => (
                              <View
                                key={index}
                                className="px-3 py-1 bg-neutral-100 rounded-full"
                              >
                                <Text className="text-xs text-neutral-700">
                                  {interest}
                                </Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* LinkedIn Badge (Pill) - display label, open full URL */}
                        {notification.requester.socialLabel && notification.requester.linkedInUrl && (
                          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                            <Pressable
                              onPress={async () => {
                                try {
                                  await Linking.openURL(notification.requester!.linkedInUrl!);
                                } catch {
                                  Alert.alert(
                                    "Cannot Open LinkedIn",
                                    "Please try opening the link in your browser."
                                  );
                                }
                              }}
                              className="px-3 py-1 bg-neutral-100 rounded-full flex-row items-center"
                            >
                              <LinkedInIcon size={14} color="#0A66C2" />
                              <Text className="text-xs text-neutral-700 ml-1.5 font-medium">
                                in {notification.requester.socialLabel}
                              </Text>
                            </Pressable>
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* Reason for Change/Cancellation Card */}
              {notification.reason && (
                <View className="px-6 mb-6">
                  <View
                    className="bg-white rounded-2xl p-4 border border-neutral-200"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.05,
                      shadowRadius: 2,
                      elevation: 1,
                    }}
                  >
                    <Text
                      className="text-base font-semibold text-neutral-900 mb-2"
                      style={{ fontSize: 16, lineHeight: 22 }}
                    >
                      {notification.type === "meeting_cancelled"
                        ? "Reason for Cancellation"
                        : "Reason for Change"}
                    </Text>
                    <Text className="text-sm text-neutral-600 italic leading-5">
                      "{notification.reason}"
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              {notification.type === "app_update" ? (
                <View className="px-6 flex-row" style={{ gap: 12 }}>
                  <Pressable
                    onPress={onClose}
                    className="flex-1 rounded-2xl py-4 items-center justify-center border border-neutral-300 bg-white"
                  >
                    <Text className="text-neutral-900 font-semibold text-base">
                      Later
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={async () => {
                      try {
                        await notification.onOpenAppStore?.();
                      } finally {
                        onClose();
                      }
                    }}
                    className="flex-1 bg-black rounded-2xl py-4 items-center justify-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text className="text-white font-semibold text-base">
                      Update
                    </Text>
                  </Pressable>
                </View>
              ) : notification.onViewAllocation ? (
                <View className="px-6">
                  <Pressable
                    onPress={() => {
                      notification.onViewAllocation?.();
                      onClose();
                    }}
                    className="bg-black rounded-2xl py-4 flex-row items-center justify-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text className="text-white font-semibold text-base">
                      View allocation
                    </Text>
                  </Pressable>
                </View>
              ) : notification.onViewMeeting ? (
                <View className="px-6">
                  <Pressable
                    onPress={() => {
                      notification.onViewMeeting?.();
                      onClose();
                    }}
                    className="bg-black rounded-2xl py-4 flex-row items-center justify-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text className="text-white font-semibold text-base">
                      View meeting
                    </Text>
                  </Pressable>
                </View>
              ) : notification.onViewProfile ? (
                <View className="px-6">
                  <Pressable
                    onPress={() => {
                      notification.onViewProfile?.();
                      onClose();
                    }}
                    className="bg-black rounded-2xl py-4 flex-row items-center justify-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text className="text-white font-semibold text-base">
                      {notification.type === "connection" ||
                      notification.type === "connection_request" ||
                      notification.type === "connection_accepted"
                        ? "View connections"
                        : "View profile"}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View className="px-6">
                  <Pressable
                    onPress={onClose}
                    className="bg-black rounded-2xl py-4 flex-row items-center justify-center"
                    style={{
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text className="text-white font-semibold text-base">
                      OK
                    </Text>
                  </Pressable>
                </View>
              )}
            </ScrollView>
          </SafeAreaView>
        </Animated.View>
      </View>

      {/* Toast Notification */}
      <MeetingActionToast
        visible={showToast}
        onHide={() => setShowToast(false)}
        action={toastAction}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.9,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  draggableArea: {
    width: "100%",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
});
