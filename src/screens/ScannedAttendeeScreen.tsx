/**
 * ScannedAttendeeScreen
 *
 * Full-screen view for a successfully scanned attendee (used on iOS after scan
 * to avoid modal presentation issues; Android can keep using the modal on ScanQR).
 */

import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Linking,
  Alert,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RootStackScreenProps } from "../navigation/types";
import Svg, { Path, Circle } from "react-native-svg";
import { CalendarIcon } from "../components/BottomNavIcons";
import { LinkedInIcon } from "../components/SocialIcons";
import { LoadingSpinner } from "../components";
import RequestMeetingModal, {
  type MeetingFormData,
} from "../components/RequestMeetingModal";
import type { Attendee } from "../services/ticketService";
import { connectionService } from "../services/connectionService";
import { meetingService } from "../services/meetingService";
import { useAuth } from "../context/AuthContext";
import { useChecklist } from "../context/ChecklistContext";
import { useToast } from "../hooks/useToast";
import { EVENT_ID } from "../config/env";
import { getLinkedInDisplayInfo } from "../utils/linkedInUtils";
import {
  getCanUserBookMeetings,
  showExpoCannotBookMeetingAlert,
  getCanUserInitiateConnection,
  showExhibitionCannotInitiateConnectionAlert,
} from "../utils/meetingRestrictions";
import { ApiClientError } from "../services/api";
import Toast from "../components/Toast";

function ConnectIcon({
  size = 24,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 21V19C17 17.9391 16.5786 16.9217 15.8284 16.1716C15.0783 15.4214 14.0609 15 13 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21M23 21V19C22.9993 18.1137 22.7044 17.2528 22.1614 16.5523C21.6184 15.8519 20.8581 15.3516 20 15.13M16 3.13C16.8604 3.35031 17.623 3.85071 18.1676 4.55232C18.7122 5.25392 19.0078 6.11683 19.0078 7.005C19.0078 7.89318 18.7122 8.75608 18.1676 9.45769C17.623 10.1593 16.8604 10.6597 16 10.88M13 7C13 9.20914 11.2091 11 9 11C6.79086 11 5 9.20914 5 7C5 4.79086 6.79086 3 9 3C11.2091 3 13 4.79086 13 7Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BackChevron({
  size = 24,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 18L9 12L15 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CloseXIcon({
  size = 24,
  color = "#000000",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6l12 12"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function ScannedAttendeeScreen() {
  const route = useRoute<RootStackScreenProps<"ScannedAttendee">["route"]>();
  const navigation =
    useNavigation<RootStackScreenProps<"ScannedAttendee">["navigation"]>();
  const { attendee: routeAttendee } = route.params ?? {};
  const { user } = useAuth();
  const { markRequestMeetingComplete, markConnectAttendeesComplete } =
    useChecklist();
  const { toast, showToast, hideToast } = useToast();

  const insets = useSafeAreaInsets();
  const [requestMeetingModalVisible, setRequestMeetingModalVisible] =
    useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const attendee = routeAttendee ?? null;

  const handleRequestMeeting = async () => {
    const canBook = await getCanUserBookMeetings();
    if (canBook) setRequestMeetingModalVisible(true);
    else showExpoCannotBookMeetingAlert(navigation);
  };

  const handleMeetingSubmit = async (formData: MeetingFormData) => {
    if (!attendee) {
      showToast("No attendee data available", "error");
      throw new Error("No attendee");
    }
    await meetingService.submitMeetingRequestFromForm(
      EVENT_ID,
      formData,
      String(attendee.user.id),
    );
    markRequestMeetingComplete();
    showToast("Meeting request sent successfully!", "success");
    setRequestMeetingModalVisible(false);
    navigation.replace("Meetings", {
      primaryTab: "requests",
      secondaryTab: "outbound",
    });
  };

  const handleConnect = async () => {
    if (!attendee || isConnecting) return;
    if (!user?.user_id) {
      showToast("User authentication required", "error");
      return;
    }

    // Limited Pass: no connect + no message features
    const canInitiateConnection = await getCanUserInitiateConnection();
    if (!canInitiateConnection) {
      showExhibitionCannotInitiateConnectionAlert(navigation);
      return;
    }

    setIsConnecting(true);
    try {
      await connectionService.createConnection(user.user_id, attendee.user.id);
      markConnectAttendeesComplete();
      showToast("Connection request sent successfully!", "success");
      navigation.replace("Connections");
    } catch (error: any) {
      const code =
        error?.responseCode ?? error?.response_code ?? error?.statusCode;
      const msg = (error?.message ?? "").toLowerCase();
      const isAlreadyExists =
        msg.includes("connection already exists") ||
        msg.includes("already exists");
      if (code === 409) {
        markConnectAttendeesComplete();
        showToast("Connection request already exists.", "success");
        navigation.replace("Connections");
      } else if (code === 400 && isAlreadyExists) {
        markConnectAttendeesComplete();
        showToast("Connection request already exists.", "success");
        navigation.replace("Connections");
      } else {
        const errMsg =
          error instanceof ApiClientError
            ? error.message
            : "Failed to send connection request. Please try again.";
        showToast(errMsg, "error");
      }
    } finally {
      setIsConnecting(false);
    }
  };

  if (!attendee) {
    return (
      <SafeAreaView edges={["top"]} className="flex-1 bg-white">
        <View className="px-4 pt-2 pb-4 flex-row items-center">
          <Pressable onPress={() => navigation.goBack()} className="p-2">
            <BackChevron size={24} color="#000" />
          </Pressable>
          <Text className="text-lg font-semibold text-black ml-2">
            Scanned attendee
          </Text>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <Text className="text-base text-neutral-500 text-center">
            No attendee data available. Go back and scan again.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const attendeeName =
    `${attendee.user.first_name ?? ""} ${attendee.user.last_name ?? ""}`.trim() ||
    "Unknown";

  const goBack = () => navigation.goBack();

  return (
    <SafeAreaView
      edges={["top"]}
      className="flex-1"
      style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
    >
      {/* White card sheet - starts lower like Android modal (~top 20% dimmed) */}
      <View
        className="flex-1 rounded-t-3xl bg-white overflow-hidden"
        style={{
          marginTop: 250,
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
        }}
      >
        {/* Close (X) - only close control so it's clear and reliable */}
        <Pressable
          onPress={goBack}
          className="absolute top-2 right-4 z-10 w-10 h-10 rounded-full bg-neutral-100 items-center justify-center"
        >
          <CloseXIcon size={20} color="#404040" />
        </Pressable>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            paddingTop: 12,
            paddingHorizontal: 16,
            paddingBottom: 24 + Math.max(insets.bottom, 0),
          }}
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-row items-start mb-4 pt-12">
            <View className="w-20 h-20 rounded-full bg-neutral-200 items-center justify-center mr-4 overflow-hidden">
              {attendee.user.profile_pic ? (
                <Image
                  source={{ uri: attendee.user.profile_pic }}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <Svg width={40} height={40} viewBox="0 0 24 24" fill="none">
                  <Circle cx="12" cy="8" r="4" fill="#000000" />
                  <Path
                    d="M6 21C6 17.134 9.13401 14 13 14C16.866 14 20 17.134 20 21"
                    stroke="#000000"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-black mb-1">
                {attendee.user.first_name ?? ""} {attendee.user.last_name ?? ""}
                {!attendee.user.first_name && !attendee.user.last_name
                  ? " Unknown User"
                  : ""}
              </Text>
              <Text className="text-base text-neutral-600 mb-3">
                {attendee.user.job_title ?? ""}
                {attendee.user.job_title &&
                (attendee.user.organisation ?? attendee.user.company?.name)
                  ? " · "
                  : ""}
                {attendee.user.company?.name ??
                  attendee.user.organisation ??
                  ""}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {attendee.ticket?.type?.name && (
                  <View className="px-3 py-1.5 bg-neutral-100 rounded-full">
                    <Text className="text-sm text-black">
                      {attendee.ticket.type.name}
                    </Text>
                  </View>
                )}
                {attendee.user.country && (
                  <View className="px-3 py-1.5 bg-neutral-100 rounded-full">
                    <Text className="text-sm text-black">
                      {attendee.user.country}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {attendee.user.metadata?.bio && (
            <Text className="text-base text-black leading-6 mb-6">
              {attendee.user.metadata.bio}
            </Text>
          )}

          {attendee.user.metadata?.interests &&
            Array.isArray(attendee.user.metadata.interests) &&
            attendee.user.metadata.interests.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-black mb-3">
                  Interests
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {attendee.user.metadata.interests.map(
                    (interest: string, index: number) => (
                      <View
                        key={index}
                        className="px-3 py-1.5 bg-neutral-100 rounded-full"
                      >
                        <Text className="text-sm text-black">{interest}</Text>
                      </View>
                    ),
                  )}
                </View>
              </View>
            )}

          {/* LinkedIn pill */}
          {(() => {
            const linkedInRaw =
              attendee.user.metadata?.linkedIn ??
              attendee.user.metadata?.linkedin_url;
            const linkedIn = getLinkedInDisplayInfo(linkedInRaw);
            if (!linkedIn) return null;
            return (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-black mb-3">
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
                        } catch {
                          Alert.alert(
                            "Cannot Open LinkedIn",
                            "Please try opening the link in your browser.",
                          );
                        }
                      }
                    } catch (error) {
                      Alert.alert(
                        "Error",
                        "Failed to open LinkedIn profile. Please try again.",
                      );
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

          <Pressable
            onPress={handleRequestMeeting}
            className="w-full flex-row items-center justify-center bg-black rounded-xl py-4 px-4 mb-3"
          >
            <CalendarIcon size={20} color="#FFFFFF" />
            <Text className="text-base font-medium text-white ml-2">
              Request Meeting
            </Text>
          </Pressable>

          <Pressable
            onPress={handleConnect}
            disabled={isConnecting}
            className="w-full flex-row items-center justify-center bg-neutral-100 rounded-xl py-4 px-4 mb-2"
            style={{ opacity: isConnecting ? 0.6 : 1 }}
          >
            {isConnecting ? (
              <LoadingSpinner size="small" color="#000000" />
            ) : (
              <ConnectIcon size={20} color="#000000" />
            )}
            <Text className="text-base font-medium text-black ml-2">
              {isConnecting ? "Connecting..." : "Connect"}
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      <RequestMeetingModal
        visible={requestMeetingModalVisible}
        onClose={() => setRequestMeetingModalVisible(false)}
        onSubmit={handleMeetingSubmit}
        onExpoBlocked={() => showExpoCannotBookMeetingAlert(navigation)}
        attendeeName={attendeeName}
      />

      <Toast
        message={toast.message}
        visible={toast.visible}
        type={toast.type}
        duration={toast.duration}
        onHide={hideToast}
      />
    </SafeAreaView>
  );
}
