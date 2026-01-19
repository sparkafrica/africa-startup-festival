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
      | "meeting_time_change"
      | "meeting_approved"
      | "connection"
      | "reminder"
      | "meeting_cancelled";
    title: string;
    requester?: {
      name: string;
      role: string;
      company: string;
      avatar?: { uri: string };
      tags?: string[];
      interests?: string[];
      socialLabel?: string;
    };
    meetingDetails?: {
      title: string;
      originalTime: string;
      newTime?: string;
      location?: string;
    };
    reason?: string;
    cancelledBy?: "them" | "you";
    onAccept?: () => void;
    onDecline?: () => void;
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
      // Reset toast when modal opens
      setShowToast(false);
    } else {
      translateY.setValue(SCREEN_HEIGHT);
      // Reset toast when modal closes
      setShowToast(false);
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
              {notification.type === "meeting_time_change" && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    {notification.requester?.name} has requested to change this
                    meeting time. Please approve or decline.
                  </Text>
                </View>
              )}
              {notification.type === "meeting_cancelled" && (
                <View className="px-6 pb-4">
                  <Text className="text-base text-neutral-600 leading-6">
                    {notification.cancelledBy === "them"
                      ? `${notification.requester?.name} has cancelled this meeting.`
                      : "You have cancelled this meeting."}
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
                    {notification.type === "meeting_time_change" ? (
                      <>
                        <View className="mb-2">
                          <Text className="text-sm text-neutral-500 line-through">
                            From: {notification.meetingDetails.originalTime}
                          </Text>
                        </View>
                        <View>
                          <Text
                            className="text-sm font-medium"
                            style={{ color: "#EF4444" }}
                          >
                            To: {notification.meetingDetails.newTime}
                          </Text>
                        </View>
                      </>
                    ) : (
                      <>
                        <View className="mb-2">
                          <Text className="text-sm text-neutral-600">
                            {notification.meetingDetails.originalTime}
                          </Text>
                        </View>
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
                          {notification.requester.role} •{" "}
                          {notification.requester.company}
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

                        {/* LinkedIn Badge (Pill style) */}
                        {notification.requester.socialLabel && (
                          <View className="flex-row flex-wrap" style={{ gap: 6 }}>
                            <View className="px-3 py-1 bg-neutral-100 rounded-full flex-row items-center">
                              <LinkedInIcon size={14} color="#0A66C2" />
                              <Text className="text-xs text-neutral-700 ml-1.5 font-medium">
                                {notification.requester.socialLabel}
                              </Text>
                            </View>
                          </View>
                        )}
                      </View>
                      <View className="w-6 h-6 items-center justify-center">
                        <Svg
                          width={16}
                          height={16}
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <Path
                            d="M7.5 15L12.5 10L7.5 5"
                            stroke="#404040"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
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
              {notification.type === "meeting_cancelled" ? (
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
              ) : (
                (notification.onAccept || notification.onDecline) && (
                  <View className="px-6 flex-row gap-3">
                    {notification.onAccept && (
                    <Pressable
                      onPress={() => {
                        notification.onAccept?.();
                        // Show toast
                        setToastAction("accepted");
                        setShowToast(true);
                        // Close modal after a short delay
                        setTimeout(() => {
                          onClose();
                        }, 500);
                      }}
                      className="flex-1 bg-black rounded-2xl py-4 flex-row items-center justify-center"
                      style={{
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                    >
                      <CheckIcon size={20} color="#FFFFFF" />
                      <Text className="text-white font-semibold text-base ml-2">
                        Accept
                      </Text>
                    </Pressable>
                  )}
                  {notification.onDecline && (
                    <Pressable
                      onPress={() => {
                        notification.onDecline?.();
                        // Show toast
                        setToastAction("declined");
                        setShowToast(true);
                        // Close modal after a short delay
                        setTimeout(() => {
                          onClose();
                        }, 500);
                      }}
                      className="flex-1 border-2 rounded-2xl py-4 flex-row items-center justify-center"
                      style={{
                        borderColor: "#EF4444",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                    >
                      <XIcon size={20} color="#EF4444" />
                      <Text
                        className="font-semibold text-base ml-2"
                        style={{ color: "#EF4444" }}
                      >
                        Decline
                      </Text>
                    </Pressable>
                  )}
                  </View>
                )
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
