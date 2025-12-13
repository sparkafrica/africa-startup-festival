import React from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";

interface NotificationDetailModalProps {
  visible: boolean;
  onClose: () => void;
  notification: {
    id: string;
    type: "meeting_time_change" | "meeting_approved" | "connection" | "reminder";
    title: string;
    requester?: {
      name: string;
      role: string;
      company: string;
      avatar?: { uri: string };
    };
    meetingDetails?: {
      title: string;
      originalTime: string;
      newTime: string;
    };
    reason?: string;
    onAccept?: () => void;
    onDecline?: () => void;
  } | null;
}

function CheckIcon({ size = 20, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M16.7071 5.29289C17.0976 5.68342 17.0976 6.31658 16.7071 6.70711L8.70711 14.7071C8.31658 15.0976 7.68342 15.0976 7.29289 14.7071L3.29289 10.7071C2.90237 10.3166 2.90237 9.68342 3.29289 9.29289C3.68342 8.90237 4.31658 8.90237 4.70711 9.29289L8 12.5858L15.2929 5.29289C15.6834 4.90237 16.3166 4.90237 16.7071 5.29289Z"
        fill={color}
      />
    </Svg>
  );
}

function XIcon({ size = 20, color = "#EF4444" }: { size?: number; color?: string }) {
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
  if (!notification) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1">
        {/* Semi-transparent Background */}
        <Pressable
          className="flex-1"
          onPress={onClose}
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
        />

        {/* Modal Content */}
        <View
          className="bg-white rounded-t-3xl"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: "90%",
          }}
        >
          <SafeAreaView edges={["bottom"]}>
            {/* Handle */}
            <View className="items-center pt-3 pb-2">
              <View
                className="w-12 h-1 rounded-full"
                style={{ backgroundColor: "#D1D5DB" }}
              />
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

              {/* Meeting Details Card */}
              {notification.meetingDetails && (
                <View className="px-6 mb-4">
                  <View
                    className="rounded-2xl p-4"
                    style={{ backgroundColor: "#FFF7ED" }}
                  >
                    <Text
                      className="text-lg font-semibold text-neutral-900 mb-3"
                      style={{ fontSize: 18, lineHeight: 24 }}
                    >
                      {notification.meetingDetails.title}
                    </Text>
                    <View className="mb-2">
                      <Text className="text-sm text-neutral-500 line-through">
                        From: {notification.meetingDetails.originalTime}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-sm font-medium" style={{ color: "#EF4444" }}>
                        To: {notification.meetingDetails.newTime}
                      </Text>
                    </View>
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
                        <Text className="text-sm text-neutral-600">
                          {notification.requester.role} • {notification.requester.company}
                        </Text>
                      </View>
                      <View className="w-6 h-6 items-center justify-center">
                        <Svg width={16} height={16} viewBox="0 0 20 20" fill="none">
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

              {/* Reason for Change Card */}
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
                      Reason for Change
                    </Text>
                    <Text className="text-sm text-neutral-600 italic leading-5">
                      "{notification.reason}"
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              {(notification.onAccept || notification.onDecline) && (
                <View className="px-6 flex-row gap-3">
                  {notification.onAccept && (
                    <Pressable
                      onPress={() => {
                        notification.onAccept?.();
                        onClose();
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
                        onClose();
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
              )}
            </ScrollView>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

