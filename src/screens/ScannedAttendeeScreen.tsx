/**
 * ScannedAttendeeScreen
 *
 * Full-screen profile sheet for a scanned attendee (deep links / legacy navigation).
 * Primary scan flow uses AttendeeQRScannerFlow on ScanQRScreen.
 */

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { useRoute, useNavigation, useFocusEffect } from "@react-navigation/native";
import type { RootStackScreenProps } from "../navigation/types";
import Svg, { Path } from "react-native-svg";
import { CalendarIcon } from "../components/BottomNavIcons";
import { LoadingSpinner } from "../components";
import RequestMeetingModal, {
  type MeetingFormData,
} from "../components/RequestMeetingModal";
import { connectionService } from "../services/connectionService";
import { meetingService } from "../services/meetingService";
import { useAuth } from "../context/AuthContext";
import { useChecklist } from "../context/ChecklistContext";
import { trackConnectionEvent, trackMeetingEvent } from "../utils/analytics";
import { useToast } from "../hooks/useToast";
import { EVENT_ID } from "../config/env";
import {
  getCanUserBookMeetings,
  showExpoCannotBookMeetingAlert,
  getCanUserInitiateConnection,
  showExhibitionCannotInitiateConnectionAlert,
} from "../utils/meetingRestrictions";
import { ApiClientError } from "../services/api";
import Toast from "../components/Toast";
import { normalizeAttendee, getAttendeeDisplayFields } from "../utils/normalizeAttendee";
import {
  canRequestMeetingWithAttendee,
  currentUserIsInvestor,
  showInvestorConnectionRequiredAlert,
} from "../utils/asfNetworking";
import { hasPendingMeetingWithPeer } from "../utils/messagingEligibility";
import ScannedAttendeeProfileContent from "../components/ScannedAttendeeProfileContent";
import {
  getScannedAttendeeSheetHeight,
  useScannedAttendeeSheetDismiss,
} from "../utils/scannedAttendeeSheet";
import { useScannedAttendeeEnrich } from "../hooks/useScannedAttendeeEnrich";

type ScreenPhase = "profile" | "requestMeeting";

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

export default function ScannedAttendeeScreen() {
  const route = useRoute<RootStackScreenProps<"ScannedAttendee">["route"]>();
  const navigation =
    useNavigation<RootStackScreenProps<"ScannedAttendee">["navigation"]>();
  const { attendee: routeAttendee } = route.params ?? {};
  const { user } = useAuth();
  const { markRequestMeetingComplete, markConnectAttendeesComplete, markDay2ScanAttendeeComplete } =
    useChecklist();

  useFocusEffect(
    React.useCallback(() => {
      markDay2ScanAttendeeComplete();
    }, [markDay2ScanAttendeeComplete]),
  );
  const { toast, showToast, hideToast } = useToast();

  const insets = useSafeAreaInsets();
  const initial = routeAttendee ? normalizeAttendee(routeAttendee) : null;
  const { attendee, isEnriching } = useScannedAttendeeEnrich(initial);
  const [phase, setPhase] = useState<ScreenPhase>("profile");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isRequestMeetingLoading, setIsRequestMeetingLoading] = useState(false);

  const goBack = () => navigation.goBack();
  const { panGesture, sheetAnimatedStyle, resetSheet } =
    useScannedAttendeeSheetDismiss(goBack);

  React.useEffect(() => {
    resetSheet();
    setPhase("profile");
  }, [routeAttendee, resetSheet]);

  const handleRequestMeetingPress = useCallback(async () => {
    if (!attendee || isRequestMeetingLoading || phase === "requestMeeting") return;
    setIsRequestMeetingLoading(true);
    try {
      const canBook = await getCanUserBookMeetings();
      if (!canBook) {
        showExpoCannotBookMeetingAlert(navigation);
        return;
      }
      const isInvestor = await currentUserIsInvestor();
      if (!isInvestor) {
        const { ticketTypeName } = getAttendeeDisplayFields(attendee);
        const allowed = await canRequestMeetingWithAttendee({
          ticketType: ticketTypeName,
          connectionStatus: null,
        });
        if (!allowed) {
          showInvestorConnectionRequiredAlert();
          return;
        }
      }
      const peerId = String(attendee.user?.id ?? "").trim();
      const me = String(user?.user_id ?? "").trim();
      if (peerId && me) {
        const pending = await hasPendingMeetingWithPeer(peerId, me);
        if (pending) {
          showToast(
            "You already have a pending meeting request with this person. Wait for them to accept or decline before sending another.",
            "info",
          );
          return;
        }
      }
      setPhase("requestMeeting");
    } finally {
      setIsRequestMeetingLoading(false);
    }
  }, [
    attendee,
    isRequestMeetingLoading,
    navigation,
    phase,
    showToast,
    user?.user_id,
  ]);

  const handleMeetingSubmit = async (formData: MeetingFormData) => {
    if (!attendee) {
      throw new Error("No attendee data available");
    }
    await meetingService.submitMeetingRequestFromForm(
      EVENT_ID,
      formData,
      String(attendee.user.id),
    );
    void trackMeetingEvent("request_submitted", {
      source: "scanned_attendee_screen",
    });
    markRequestMeetingComplete();
    setPhase("profile");
    showToast("Meeting request sent successfully!", "success");
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

    setIsConnecting(true);
    try {
      const canInitiateConnection = await getCanUserInitiateConnection();
      if (!canInitiateConnection) {
        showExhibitionCannotInitiateConnectionAlert(navigation);
        return;
      }

      await connectionService.createConnection(user.user_id, attendee.user.id);
      void trackConnectionEvent("sent", { source: "scanned_attendee_screen" });
      markConnectAttendeesComplete();
      showToast("Connection request sent successfully!", "success");
      navigation.replace("Connections");
    } catch (error: unknown) {
      const err = error as {
        responseCode?: number;
        response_code?: number;
        statusCode?: number;
        message?: string;
      };
      const code = err?.responseCode ?? err?.response_code ?? err?.statusCode;
      const msg = (err?.message ?? "").toLowerCase();
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

  const sheetHeight = getScannedAttendeeSheetHeight();
  const footerPaddingBottom = Math.max(insets.bottom, 12);
  const profileVisible = phase === "profile";

  return (
    <View className="flex-1" style={{ backgroundColor: "transparent" }}>
      <View
        className="flex-1"
        style={{ backgroundColor: "rgba(0, 0, 0, 0.3)" }}
      >
        <Pressable
          className="flex-1"
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Close scanned attendee"
        />
        <Animated.View
          className="bg-white overflow-hidden"
          style={[
            {
              height: sheetHeight,
              flexDirection: "column",
              borderTopWidth: 1,
              borderTopColor: "#E5E5E5",
            },
            sheetAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <View className="items-center justify-center py-4" style={{ minHeight: 48 }}>
              <View className="w-12 h-1 bg-neutral-300 rounded-full" />
            </View>
          </GestureDetector>

          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
            bounces
          >
            <ScannedAttendeeProfileContent
              attendee={attendee}
              variant="screen"
              isEnriching={isEnriching}
            />
          </ScrollView>

          {profileVisible ? (
            <View
              className="px-4 pt-3 bg-white border-t border-neutral-100"
              style={{ paddingBottom: footerPaddingBottom }}
            >
              <Pressable
                onPress={() => void handleRequestMeetingPress()}
                disabled={isRequestMeetingLoading || isConnecting}
                className="w-full flex-row items-center justify-center bg-black rounded-xl py-4 px-4 mb-3"
                style={{
                  opacity: isRequestMeetingLoading || isConnecting ? 0.6 : 1,
                }}
              >
                {isRequestMeetingLoading ? (
                  <LoadingSpinner size="small" color="#FFFFFF" />
                ) : (
                  <CalendarIcon size={20} color="#FFFFFF" />
                )}
                <Text className="text-base font-medium text-white ml-2">
                  {isRequestMeetingLoading ? "Checking..." : "Request Meeting"}
                </Text>
              </Pressable>

              <Pressable
                onPress={() => void handleConnect()}
                disabled={isConnecting || isRequestMeetingLoading}
                className="w-full flex-row items-center justify-center bg-neutral-100 rounded-xl py-4 px-4"
                style={{
                  opacity: isConnecting || isRequestMeetingLoading ? 0.6 : 1,
                }}
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
            </View>
          ) : null}
        </Animated.View>
      </View>

      <RequestMeetingModal
        presentation="embedded"
        visible={phase === "requestMeeting"}
        analyticsSource="scanned_attendee_screen"
        onClose={() => setPhase("profile")}
        onSubmit={handleMeetingSubmit}
        onExpoBlocked={() => showExpoCannotBookMeetingAlert(navigation)}
        attendeeName={attendeeName}
        requesteeUserId={String(attendee.user.id)}
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
