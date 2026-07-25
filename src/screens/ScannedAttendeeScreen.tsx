/**
 * ScannedAttendeeScreen
 *
 * Full-screen view for a successfully scanned attendee (used on iOS after scan
 * to avoid modal presentation issues; Android can keep using the modal on ScanQR).
 */

import React, { useState, useEffect } from "react";
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
import type { Attendee } from "../services/ticketService";
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
import { attendeeService } from "../services/attendeeService";
import {
  mergeAttendeeProfiles,
  normalizeAttendee,
  getAttendeeDisplayFields,
  type AttendeeLike,
} from "../utils/normalizeAttendee";
import {
  canRequestMeetingWithAttendee,
  currentUserIsInvestor,
  showInvestorConnectionRequiredAlert,
} from "../utils/asfNetworking";
import ScannedAttendeeProfileContent from "../components/ScannedAttendeeProfileContent";
import {
  getScannedAttendeeSheetHeight,
  logScannedAttendeePayload,
  useScannedAttendeeSheetDismiss,
} from "../utils/scannedAttendeeSheet";

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
  const [attendee, setAttendee] = useState<Attendee | null>(
    routeAttendee ? normalizeAttendee(routeAttendee) : null,
  );
  const [requestMeetingModalVisible, setRequestMeetingModalVisible] =
    useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const goBack = () => navigation.goBack();
  const { panGesture, sheetAnimatedStyle, resetSheet } =
    useScannedAttendeeSheetDismiss(goBack);

  useEffect(() => {
    resetSheet();
  }, [routeAttendee, resetSheet]);

  useEffect(() => {
    const initial = routeAttendee ? normalizeAttendee(routeAttendee) : null;
    if (!initial?.user?.id) return;

    logScannedAttendeePayload("route", initial);

    let cancelled = false;
    void attendeeService
      .getAttendeeByUserId(EVENT_ID, String(initial.user.id))
      .then((enriched) => {
        if (cancelled) return;
        const merged = mergeAttendeeProfiles(initial, enriched as AttendeeLike);
        logScannedAttendeePayload("enriched", merged);
        if (enriched) {
          logScannedAttendeePayload("directory-only", enriched);
        }
        setAttendee(merged);
      })
      .catch(() => {
        if (!cancelled) setAttendee(initial);
      });

    return () => {
      cancelled = true;
    };
  }, [routeAttendee]);

  const handleRequestMeeting = async () => {
    if (!attendee) return;
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
    setRequestMeetingModalVisible(true);
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
    void trackMeetingEvent("request_submitted", {
      source: "scanned_attendee_screen",
    });
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
      void trackConnectionEvent("sent", { source: "scanned_attendee_screen" });
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

  const sheetHeight = getScannedAttendeeSheetHeight();
  const footerPaddingBottom = Math.max(insets.bottom, 12);

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
            <ScannedAttendeeProfileContent attendee={attendee} variant="screen" />
          </ScrollView>

          <View
            className="px-4 pt-3 bg-white border-t border-neutral-100"
            style={{ paddingBottom: footerPaddingBottom }}
          >
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
              className="w-full flex-row items-center justify-center bg-neutral-100 rounded-xl py-4 px-4"
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
          </View>
        </Animated.View>
      </View>

      <RequestMeetingModal
        visible={requestMeetingModalVisible}
        analyticsSource="scanned_attendee_screen"
        onClose={() => setRequestMeetingModalVisible(false)}
        onSubmit={handleMeetingSubmit}
        onExpoBlocked={() => showExpoCannotBookMeetingAlert(navigation)}
        attendeeName={attendeeName}
        requesteeUserId={
          attendee ? String(attendee.user.id) : undefined
        }
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
