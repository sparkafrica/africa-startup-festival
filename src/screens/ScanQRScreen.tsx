import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  Modal,
  PanResponder,
  Animated,
  TextInput,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  StyleSheet,
  Linking,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import type { NavigationProp, RouteProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import type { RootStackScreenProps } from "../navigation/types";
import { StatusBar } from "expo-status-bar";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { ScrollView } from "react-native";
import { CalendarIcon } from "../components/BottomNavIcons";
import { LinkedInIcon } from "../components/SocialIcons";
import { useToast } from "../hooks/useToast";
import Toast from "../components/Toast";
import { ticketService, type Attendee, clearTicketCache } from "../services/ticketService";
import {
  invalidateTicketsFetchedAt,
  markTicketsFetched,
  shouldRefetchTicketsOnFocus,
} from "../utils/ticketsListCache";
import { connectionService } from "../services/connectionService";
import { meetingService } from "../services/meetingService";
import { useAuth } from "../context/AuthContext";
import { useChecklist } from "../context/ChecklistContext";
import { EVENT_ID } from "../config/env";
import { isPostEventMode } from "../config/eventMode";
import { getEventFeatures } from "../config/eventFeatures";
import {
  getTicketBackgroundColor,
  getTicketTypeDisplay,
  getTicketGradientColors,
  isLightTicketCard,
} from "../utils/ticketColors";
import { ApiClientError } from "../services/api";
import {
  trackTicketEvent,
  trackQrEvent,
  trackConnectionEvent,
  trackMeetingEvent,
  trackEvent,
} from "../utils/analytics";
import TicketBenefitsModal from "../components/TicketBenefitsModal";
import { getTicketBenefits } from "../constants/ticketBenefits";
import QRCode from "react-native-qrcode-svg";
import type { MeetingFormData } from "../components/RequestMeetingModal";
import { LoadingSpinner, SkeletonMyTicketView } from "../components";
import {
  getCanUserBookMeetings,
  showExpoCannotBookMeetingAlert,
  getCanUserInitiateConnection,
  showExhibitionCannotInitiateConnectionAlert,
} from "../utils/meetingRestrictions";
import { hasPendingMeetingWithPeer } from "../utils/messagingEligibility";
import {
  canRequestMeetingWithAttendee,
  currentUserIsInvestor,
  showInvestorConnectionRequiredAlert,
} from "../utils/asfNetworking";
import { getAttendeeDisplayFields } from "../utils/normalizeAttendee";
import {
  isTicketTransferBlockedForEvent,
  showTicketTransferDeadlineAlert,
} from "../utils/ticketTransferRestrictions";
import { getLinkedInDisplayInfo } from "../utils/linkedInUtils";
import { logError, ERROR_TAGS } from "../utils/logError";
import AttendeeQRScannerFlow, {
  type ScanFlowHelpers,
} from "../components/scan/AttendeeQRScannerFlow";
import GuidelinePatternOverlay from "../components/GuidelinePatternOverlay";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;

interface IconProps {
  size?: number;
  color?: string;
}

function CloseIcon({ size = 24, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function Header() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  return (
    <View className="flex-row items-center justify-between px-4 pt-6 pb-4">
      <Text className="text-[24px] font-semibold text-black">Scan QR Code</Text>
      <Pressable
        onPress={() => navigation.goBack()}
        className="w-10 h-10 items-center justify-center"
        hitSlop={10}
      >
        <CloseIcon size={20} color="#000000" />
      </Pressable>
    </View>
  );
}

function TicketIcon({ size = 20, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M2 6C2 4.89543 2.89543 4 4 4H16C17.1046 4 18 4.89543 18 6V8C16.8954 8 16 8.89543 16 10C16 11.1046 16.8954 12 18 12V14C18 15.1046 17.1046 16 16 16H4C2.89543 16 2 15.1046 2 14V12C3.10457 12 4 11.1046 4 10C4 8.89543 3.10457 8 2 8V6Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function QRIconSmall({ size = 16, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Rect x="2" y="2" width="4" height="4" fill={color} />
      <Rect x="10" y="2" width="2" height="2" fill={color} />
      <Rect x="14" y="2" width="2" height="2" fill={color} />
      <Rect x="2" y="10" width="2" height="2" fill={color} />
      <Rect x="6" y="10" width="2" height="2" fill={color} />
      <Rect x="10" y="10" width="4" height="4" fill={color} />
      <Rect x="2" y="14" width="2" height="2" fill={color} />
      <Rect x="6" y="14" width="2" height="2" fill={color} />
      <Rect x="14" y="12" width="2" height="2" fill={color} />
      <Rect x="2" y="6" width="2" height="2" fill={color} />
    </Svg>
  );
}

function ThreeDotsIcon({ size = 20, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Circle cx="10" cy="5" r="1.5" fill={color} />
      <Circle cx="10" cy="10" r="1.5" fill={color} />
      <Circle cx="10" cy="15" r="1.5" fill={color} />
    </Svg>
  );
}

function DownloadIcon({ size = 20, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M10 13V3M10 13L6 9M10 13L14 9M3 17H17"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShareIcon({ size = 20, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
      <Path
        d="M15 6.66667C16.3807 6.66667 17.5 5.54738 17.5 4.16667C17.5 2.78595 16.3807 1.66667 15 1.66667C13.6193 1.66667 12.5 2.78595 12.5 4.16667C12.5 5.54738 13.6193 6.66667 15 6.66667Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5 12.5C6.38071 12.5 7.5 11.3807 7.5 10C7.5 8.61929 6.38071 7.5 5 7.5C3.61929 7.5 2.5 8.61929 2.5 10C2.5 11.3807 3.61929 12.5 5 12.5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 18.3333C16.3807 18.3333 17.5 17.214 17.5 15.8333C17.5 14.4526 16.3807 13.3333 15 13.3333C13.6193 13.3333 12.5 14.4526 12.5 15.8333C12.5 17.214 13.6193 18.3333 15 18.3333Z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.15833 11.2583L12.8417 14.575M12.8417 5.425L7.15833 8.74167"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ size = 16, color = "#000000" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 6L8 10L12 6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ConnectIcon({ size = 24, color = "#000000" }: IconProps) {
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

function SegmentedControl({
  activeTab,
  onTabChange,
  hideScanTab = false,
}: {
  activeTab: "My Ticket" | "Scan Ticket";
  onTabChange: (tab: "My Ticket" | "Scan Ticket") => void;
  hideScanTab?: boolean;
}) {
  if (hideScanTab) {
    return null;
  }

  return (
    <View className="px-4 pb-2">
      <View className="flex-row bg-neutral-100 p-1" style={{ borderRadius: 0 }}>
        <Pressable
          onPress={() => onTabChange("My Ticket")}
          className={`flex-1 py-3 px-4 ${
            activeTab === "My Ticket" ? "bg-white" : "bg-transparent"
          }`}
          style={{
            borderRadius: 0,
            ...(activeTab === "My Ticket"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : {}),
          }}
        >
          <Text
            className={`text-sm font-medium text-center ${
              activeTab === "My Ticket" ? "text-black" : "text-neutral-500"
            }`}
          >
            My Ticket
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onTabChange("Scan Ticket")}
          className={`flex-1 py-3 px-4 ${
            activeTab === "Scan Ticket"
              ? "bg-white"
              : "bg-transparent"
          }`}
          style={{
            borderRadius: 0,
            ...(activeTab === "Scan Ticket"
              ? {
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 2,
                  elevation: 1,
                }
              : {}),
          }}
        >
          <Text
            className={`text-sm font-medium text-center ${
              activeTab === "Scan Ticket" ? "text-black" : "text-neutral-500"
            }`}
          >
            Scan Ticket
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function ScanFrame({ onQRCodePress }: { onQRCodePress?: () => void }) {
  const frameSize = 300;
  const cornerLength = 35;
  const cornerWidth = 4;

  return (
    <View className="items-center justify-center m-12 pt-5">
      <View
        className="relative items-center justify-center"
        style={{ width: frameSize, height: frameSize }}
      >
        <View
          className="absolute rounded-2xl"
          style={{ width: frameSize, height: frameSize }}
        />
        <Pressable
          onPress={onQRCodePress}
          className="p-4 rounded-xl border border-neutral-200 bg-white"
        >
          <View
            className="items-center justify-center"
            style={{ width: 180, height: 180 }}
          >
            <View className="items-center justify-center">
              <Text className="text-neutral-400 text-sm">Tap to Scan</Text>
            </View>
          </View>
        </Pressable>
        <View
          className="absolute"
          style={{
            width: frameSize,
            height: frameSize,
            top: 0,
            left: 0,
          }}
        >
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: cornerLength,
              height: cornerWidth,
              backgroundColor: "#000000",
              borderTopLeftRadius: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: cornerWidth,
              height: cornerLength,
              backgroundColor: "#000000",
              borderTopLeftRadius: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: cornerLength,
              height: cornerWidth,
              backgroundColor: "#000000",
              borderTopRightRadius: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: cornerWidth,
              height: cornerLength,
              backgroundColor: "#000000",
              borderTopRightRadius: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: cornerLength,
              height: cornerWidth,
              backgroundColor: "#000000",
              borderBottomLeftRadius: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              width: cornerWidth,
              height: cornerLength,
              backgroundColor: "#000000",
              borderBottomLeftRadius: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: cornerLength,
              height: cornerWidth,
              backgroundColor: "#000000",
              borderBottomRightRadius: 0,
            }}
          />
          <View
            style={{
              position: "absolute",
              bottom: 0,
              right: 0,
              width: cornerWidth,
              height: cornerLength,
              backgroundColor: "#000000",
              borderBottomRightRadius: 0,
            }}
          />
        </View>
      </View>
    </View>
  );
}

function Instructions() {
  return (
    <View className="items-center px-4 pb-8 pt-4">
      <Text className="text-[22px] font-bold text-black mb-2 text-center">
        Scan Attendee Tickets
      </Text>
      <Text className="text-sm text-neutral-600 text-center leading-5">
        Point your camera at an attendee ticket to instantly view their profile
        and send a connection request.
      </Text>
    </View>
  );
}

function EditIcon({ size = 16, color = "#404040" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path
        d="M11.3333 2.00001C11.5084 1.8249 11.7163 1.686 11.9445 1.59123C12.1727 1.49646 12.4169 1.44763 12.6667 1.44763C12.9164 1.44763 13.1606 1.49646 13.3888 1.59123C13.617 1.686 13.8249 1.8249 14 2.00001C14.1751 2.17512 14.314 2.38301 14.4088 2.61123C14.5035 2.83945 14.5524 3.08362 14.5524 3.33334C14.5524 3.58306 14.5035 3.82723 14.4088 4.05545C14.314 4.28367 14.1751 4.49156 14 4.66668L5.00001 13.6667L1.33334 14.6667L2.33334 11L11.3333 2.00001Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function TicketCard({
  title,
  ticketNumber,
  backgroundColor,
  ticketType,
  assignedTo,
  isUnassigned,
  isMyTicket,
  canTransfer,
  totalTickets,
  availableToAssignCount,
  availableCount,
  isAdminBlocked,
  eventId,
  allocationStatus,
  canUpgrade,
  onViewQR,
  onTransfer,
  onUpgrade,
  onAssign,
  onEditAssignment,
  onViewBenefits,
}: {
  title: string;
  ticketNumber: string;
  backgroundColor: string;
  ticketType?: string;
  assignedTo?: string;
  isUnassigned?: boolean;
  isMyTicket?: boolean;
  canTransfer?: boolean;
  totalTickets?: number;
  availableToAssignCount?: number;
  availableCount?: number;
  isAdminBlocked?: boolean;
  eventId?: number;
  allocationStatus?: "pending" | "accepted" | "rejected" | "cancelled";
  canUpgrade?: boolean;
  onViewQR?: () => void;
  onTransfer?: () => void;
  onUpgrade?: () => void;
  onAssign?: () => void;
  onEditAssignment?: () => void;
  /** My Ticket only — when provided, renders an inline "View benefits ↓" link. */
  onViewBenefits?: () => void;
}) {
  const unassignedLabel =
    isUnassigned && availableCount != null
      ? `${availableCount} available`
      : isUnassigned
        ? "Available"
        : null;

  const gradientColors = getTicketGradientColors(ticketType ?? "expo");
  const cardClassName = "p-5 relative overflow-hidden";
  const isLightCard = isLightTicketCard(ticketType ?? title);
  const iconColor = isLightCard ? "#111827" : "#FFFFFF";

  return (
    <View className="mb-4">
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={cardClassName}
        style={{ borderRadius: 16 }}
      >
        <GuidelinePatternOverlay isLightCard={isLightCard} />
        <View className="relative z-10">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-2">
            <Text
              className={`text-2xl font-bold mb-2 ${
                isLightCard ? "text-black" : "text-white"
              }`}
            >
              {title}
            </Text>
            <Text
              className={`text-base mb-10 font-mono ${
                isLightCard ? "text-black/50" : "text-white/50"
              }`}
            >
              {unassignedLabel ?? formatTicketCodeForDisplay(ticketNumber)}
            </Text>
            {assignedTo && (
              <View className="flex-col">
                <Text
                  className={`text-sm ${
                    isLightCard ? "text-black/60" : "text-white/60"
                  }`}
                >
                  Assigned to
                </Text>
                <Text
                  className={`text-[18px] font-semibold py-2 ${
                    isLightCard ? "text-black" : "text-white"
                  }`}
                >
                  {assignedTo}
                </Text>
              </View>
            )}
          </View>
          <View className="flex-row items-center gap-2">
            {isUnassigned && (
              <View
                className={`px-2 py-1 rounded-full flex-row items-center ${
                  isLightCard ? "bg-black/5" : "bg-white/20"
                }`}
              >
                <View
                  className={`w-1.5 h-1.5 rounded-full mr-1 ${
                    isLightCard ? "bg-black/40" : "bg-white"
                  }`}
                />
                <Text
                  className={`text-xs font-medium ${
                    isLightCard ? "text-black/70" : "text-white"
                  }`}
                >
                  Unassigned
                </Text>
              </View>
            )}
            <View className="flex-row items-center gap-1">
              <View className="w-6 h-6 items-center justify-center">
                <TicketIcon size={18} color={iconColor} />
              </View>
            </View>
          </View>
        </View>
        {isMyTicket && onViewBenefits && (
          <Pressable
            onPress={onViewBenefits}
            hitSlop={8}
            className="absolute bottom-3 right-4 flex-row items-center"
          >
            <Text
              className={`text-sm font-semibold  ${
                isLightCard ? "text-black" : "text-white"
              }`}
            >
              View benefits
            </Text>
            <Text
              className={`text-sm font-bold ml-1  ${
                isLightCard ? "text-black" : "text-white"
              }`}
            >
              ↓
            </Text>
          </Pressable>
        )}
        </View>
      </LinearGradient>
      {/* My Ticket buttons - View QR Code / Transfer Ticket */}
      {assignedTo && isMyTicket && (
        <View className="mt-8 gap-3 pr-4 pt-4">
          <Pressable
            onPress={onViewQR}
            className="flex-row items-center justify-center bg-neutral-100 rounded-xl py-3.5 px-4 border border-neutral-300"
            style={{ width: "100%" }}
          >
            <QRIconSmall size={16} color="#404040" />
            <Text className="text-sm font-medium text-black ml-2">
              View QR Code
            </Text>
          </Pressable>

          {/* Upgrade button - only for attendee tiers (Expo/Oasis/Delegate), not exhibitor/partner/chairperson */}
          {canUpgrade && onUpgrade && (
            <Pressable
              onPress={onUpgrade}
              className="flex-row items-center justify-center rounded-xl py-3.5 px-4 border border-neutral-400"
              style={{ width: "100%", backgroundColor: "#f0fdf4" }}
            >
              <Text className="text-sm font-medium text-emerald-700">
                Upgrade ticket
              </Text>
            </Pressable>
          )}

          {/* Transfer button - only shown if transfer is allowed */}
          {canTransfer && onTransfer && (
            <Pressable
              onPress={onTransfer}
              className="items-center justify-center bg-white rounded-xl py-3.5 px-4 border border-red-500"
              style={{ width: "100%" }}
            >
              <Text className="text-sm font-medium text-red-500">
                Transfer This Ticket
              </Text>
            </Pressable>
          )}

          {/* Warning message when transfer is not allowed */}
          {!canTransfer && (
            <View className="bg-orange-50 rounded-xl py-3.5 px-4 border border-orange-200">
              {isAdminBlocked ? (
                <View>
                  <Text className="text-xs font-medium text-orange-800 mb-1">
                    Transfer Not Available
                  </Text>
                  <Text className="text-xs text-orange-700 leading-4">
                    You are a company admin. Personal tickets cannot be
                    transferred.
                  </Text>
                </View>
              ) : eventId === 10 &&
                totalTickets ===
                  1 ? // For ATE (event_id = 10), single ticket users CAN transfer (no warning)
              null : totalTickets === 1 ? (
                // For other events, single ticket users CANNOT transfer
                <View>
                  <Text className="text-xs font-medium text-orange-800 mb-1">
                    Transfer Not Available
                  </Text>
                  <Text className="text-xs text-orange-700 leading-4">
                    You only have one ticket. Transferring it would remove your
                    access to the event.
                  </Text>
                </View>
              ) : availableToAssignCount !== undefined &&
                availableToAssignCount > 0 ? (
                <View>
                  <Text className="text-xs font-medium text-orange-800 mb-1">
                    Transfer Personal Ticket Unavailable
                  </Text>
                  <Text className="text-xs text-orange-700 leading-4">
                    You have {availableToAssignCount} available ticket(s) to
                    assign. Please assign the available ticket
                    {availableToAssignCount !== 1 ? "s" : ""} before
                    transferring your personal ticket.
                  </Text>
                </View>
              ) : null}
            </View>
          )}
        </View>
      )}
      {/* Assigned Ticket buttons - View vs Edit based on allocation status */}
      {assignedTo && !isMyTicket && (
        <Pressable
          onPress={onEditAssignment}
          className="mt-3 flex-row items-center justify-center bg-neutral-100 rounded-xl py-3.5 px-4 border border-neutral-300"
        >
          <EditIcon size={16} color="#404040" />
          <Text className="text-sm font-medium text-black ml-2">
            {allocationStatus === "accepted"
              ? "View Assignment"
              : "Edit Assignment"}
          </Text>
        </Pressable>
      )}
      {/* Available to assign buttons - Assign / Transfer Ticket */}
      {isUnassigned && (
        <Pressable
          onPress={onAssign}
          disabled={!onAssign}
          className="mt-3 flex-row items-center justify-center rounded-xl py-3.5 px-4 border border-neutral-300"
          style={{
            backgroundColor: onAssign ? "#f5f5f5" : "#e5e5e5",
            opacity: onAssign ? 1 : 0.6,
          }}
        >
          <Text
            className="text-sm font-medium"
            style={{ color: onAssign ? "#000" : "#737373" }}
          >
            Assign / Transfer Ticket
          </Text>
        </Pressable>
      )}
    </View>
  );
}

function QRCodeModal({
  visible,
  onClose,
  title,
  ticketNumber,
  assignedTo,
  canTransfer,
  totalTickets,
  availableToAssignCount,
  isAdminBlocked,
  eventId,
  onTransfer,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  ticketNumber: string;
  assignedTo: string;
  canTransfer?: boolean;
  totalTickets?: number;
  availableToAssignCount?: number;
  isAdminBlocked?: boolean;
  eventId?: number;
  onTransfer: (
    title: string,
    ticketNumber: string,
    assignedTo: string,
    backgroundColor?: string,
    isUnassigned?: boolean,
  ) => void;
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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
    }),
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
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          className="w-full bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
          }}
        >
          <View
            className="items-center pt-2 pb-4"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
            <Text className="text-xl font-semibold text-black mb-6">
              Your Ticket QR Code
            </Text>
          </View>

          <View className="w-full self-stretch px-4">
            <View className="items-center mb-6">
              <View className="bg-white rounded-2xl p-6 border border-neutral-200 items-center">
                {ticketNumber ? (
                  <QRCode
                    value={ticketNumber}
                    size={240}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                  />
                ) : (
                  <View
                    style={{
                      width: 240,
                      height: 240,
                      backgroundColor: "#F3F4F6",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text className="text-neutral-400">No QR Code</Text>
                  </View>
                )}
                <Text className="text-xl font-bold text-black mt-4">
                  {title}
                </Text>
                <Text className="text-sm text-neutral-500 mt-1 font-mono">
                  Ticket ID: {formatTicketCodeForDisplay(ticketNumber)}
                </Text>
              </View>
            </View>

            <View className="w-full self-stretch bg-orange-50 rounded-xl p-4 border border-orange-200 mb-8">
              <Text
                className="text-sm text-black leading-5 w-full"
                style={{ flexShrink: 1 }}
              >
                - Show this QR code when checking in.

              </Text>
              <Text
                className="text-sm text-black leading-5 w-full"
                style={{ flexShrink: 1 }}
              >
                - Also, when connecting with other attendees.

              </Text>
            </View>

            {/* TODO: Add download and share buttons */}
            {/* <View className="flex-row gap-3 mb-3">
              <Pressable
                onPress={() => console.log("Download QR Code")}
                className="flex-1 flex-row items-center justify-center bg-neutral-100 rounded-xl py-3.5 px-4 border border-neutral-300"
              >
                <DownloadIcon size={18} color="#000000" />
                <Text className="text-sm font-medium text-black ml-2">
                  Download
                </Text>
              </Pressable>
              <Pressable
                onPress={() => console.log("Share QR Code")}
                className="flex-1 flex-row items-center justify-center bg-white rounded-xl py-3.5 px-4 border border-neutral-300"
              >
                <ShareIcon size={18} color="#000000" />
                <Text className="text-sm font-medium text-black ml-2">
                  Share
                </Text>
              </Pressable>
            </View> */}

            {/* Transfer button - only shown if transfer is allowed */}
            {canTransfer && (
              <Pressable
                onPress={() => {
                  onClose();
                  setTimeout(() => {
                    onTransfer(
                      title,
                      ticketNumber,
                      assignedTo,
                      "#000000",
                      false,
                    );
                  }, 300);
                }}
                className="w-full items-center justify-center bg-white rounded-xl py-3.5 px-4 border border-red-500 mb-8"
              >
                <Text className="text-sm font-medium text-red-500">
                  Transfer This Ticket
                </Text>
              </Pressable>
            )}

            {/* Warning message when transfer is not allowed */}
            {!canTransfer && (
              <View className="bg-orange-50 rounded-xl py-3.5 px-4 border border-orange-200 mb-4">
                {isAdminBlocked ? (
                  <View>
                    <Text className="text-xs font-medium text-orange-800 mb-1">
                      Transfer Not Available
                    </Text>
                    <Text className="text-xs text-orange-700 leading-4">
                      You are a company admin. Personal tickets cannot be
                      transferred.
                    </Text>
                  </View>
                ) : eventId === 10 &&
                  totalTickets ===
                    1 ? // For ATE (event_id = 10), single ticket users CAN transfer (no warning)
                null : totalTickets === 1 ? (
                  // For other events, single ticket users CANNOT transfer
                  <View>
                    <Text className="text-xs font-medium text-orange-800 mb-1">
                      Transfer Not Available
                    </Text>
                    <Text className="text-xs text-orange-700 leading-4">
                      You only have one ticket. Transferring it would remove
                      your access to the event.
                    </Text>
                  </View>
                ) : availableToAssignCount !== undefined &&
                  availableToAssignCount > 0 ? (
                  <View>
                    <Text className="text-xs font-medium text-orange-800 mb-1">
                      Transfer Personal Ticket Unavailable
                    </Text>
                    <Text className="text-xs text-orange-700 leading-4">
                      Please assign all {availableToAssignCount} available
                      ticket{availableToAssignCount !== 1 ? "s" : ""} before
                      transferring your personal ticket.
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>
          <SafeAreaView
            edges={["bottom"]}
            className="bg-white"
            style={{ paddingBottom: 24 }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

function AssigningTicketsModal({
  visible,
  onClose,
  recipientName,
  availableTickets,
  onAssignTicket,
}: {
  visible: boolean;
  onClose: () => void;
  recipientName: string;
  availableTickets: Array<{
    title: string;
    ticketNumber: string;
    backgroundColor: string;
    ticketType?: string;
  }>;
  onAssignTicket: (ticket: {
    title: string;
    ticketNumber: string;
    backgroundColor: string;
    ticketType?: string;
  }) => void;
}) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

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
    }),
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
    } else {
      translateY.setValue(SCREEN_HEIGHT);
    }
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
            <Text className="text-xl font-semibold text-black mb-2">
              Assigning Other Tickets in Quota
            </Text>
            <Text className="text-sm text-neutral-600 mb-6">
              Select a ticket to assign to {recipientName}
            </Text>
          </View>

          <ScrollView
            className="px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {availableTickets.map((ticket, index) => {
              const gradientColors = getTicketGradientColors(
                ticket.ticketType ?? "expo",
              );
              const isLightCard = isLightTicketCard(ticket.ticketType ?? ticket.title);
              const cardBorderColorClass = isLightCard ? "border-black/30" : "border-white/30";
              const iconColor = isLightCard ? "#111827" : "#FFFFFF";
              const cardClassName = "p-5 relative overflow-hidden";
              return (
                <Pressable
                  key={index}
                  onPress={() => onAssignTicket(ticket)}
                  className="mb-4"
                >
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    className={cardClassName}
                    style={{ borderRadius: 16 }}
                  >
                    <View className="absolute top-0 right-0 w-24 h-24 opacity-20">
                      <View
                        className={`absolute top-3 right-3 w-10 h-10 border-2 ${cardBorderColorClass} rounded-lg`}
                      />
                      <View
                        className={`absolute top-8 right-8 w-5 h-5 border-2 ${cardBorderColorClass} rounded`}
                      />
                      <View
                        className={`absolute top-14 right-14 w-3 h-3 border ${cardBorderColorClass} rounded`}
                      />
                    </View>
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1 pr-3">
                        <Text
                          className={`text-2xl font-bold mb-2 ${
                            isLightCard ? "text-black" : "text-white"
                          }`}
                        >
                          {ticket.title}
                        </Text>
                        <Text
                          className={`text-base ${isLightCard ? "text-black/50" : "text-white/50"}`}
                        >
                          {ticket.ticketNumber}
                        </Text>
                      </View>
                      <View className="flex-row items-center gap-2">
                        <View
                          className={`px-2 py-1 rounded-full flex-row items-center ${
                            isLightCard ? "bg-black/5" : "bg-white/20"
                          }`}
                        >
                          <View
                            className={`w-1.5 h-1.5 rounded-full mr-1 ${
                              isLightCard ? "bg-black/40" : "bg-white"
                            }`}
                          />
                          <Text
                            className={`text-xs font-medium ${
                              isLightCard ? "text-black/70" : "text-white"
                            }`}
                          >
                            Unassigned
                          </Text>
                        </View>
                        <View className="w-6 h-6 items-center justify-center">
                          <TicketIcon size={18} color={iconColor} />
                        </View>
                      </View>
                    </View>
                  </LinearGradient>
                </Pressable>
              );
            })}
          </ScrollView>
          <SafeAreaView
            edges={["bottom"]}
            className="bg-white"
            style={{ paddingBottom: 24 }}
          />
        </Animated.View>
      </View>
    </Modal>
  );
}

const COUNTRIES = [
  { code: "+1", flag: "🇺🇸", name: "United States" },
  { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
  { code: "+234", flag: "🇳🇬", name: "Nigeria" },
  { code: "+27", flag: "🇿🇦", name: "South Africa" },
  { code: "+233", flag: "🇬🇭", name: "Ghana" },
  { code: "+254", flag: "🇰🇪", name: "Kenya" },
  { code: "+91", flag: "🇮🇳", name: "India" },
  { code: "+86", flag: "🇨🇳", name: "China" },
  { code: "+81", flag: "🇯🇵", name: "Japan" },
  { code: "+82", flag: "🇰🇷", name: "South Korea" },
  { code: "+33", flag: "🇫🇷", name: "France" },
  { code: "+49", flag: "🇩🇪", name: "Germany" },
  { code: "+39", flag: "🇮🇹", name: "Italy" },
  { code: "+34", flag: "🇪🇸", name: "Spain" },
  { code: "+31", flag: "🇳🇱", name: "Netherlands" },
  { code: "+32", flag: "🇧🇪", name: "Belgium" },
  { code: "+41", flag: "🇨🇭", name: "Switzerland" },
  { code: "+46", flag: "🇸🇪", name: "Sweden" },
  { code: "+47", flag: "🇳🇴", name: "Norway" },
  { code: "+45", flag: "🇩🇰", name: "Denmark" },
  { code: "+61", flag: "🇦🇺", name: "Australia" },
  { code: "+64", flag: "🇳🇿", name: "New Zealand" },
  { code: "+55", flag: "🇧🇷", name: "Brazil" },
  { code: "+52", flag: "🇲🇽", name: "Mexico" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+966", flag: "🇸🇦", name: "Saudi Arabia" },
  { code: "+20", flag: "🇪🇬", name: "Egypt" },
  { code: "+212", flag: "🇲🇦", name: "Morocco" },
  { code: "+256", flag: "🇺🇬", name: "Uganda" },
  { code: "+255", flag: "🇹🇿", name: "Tanzania" },
];

function RecipientDetailsModal({
  visible,
  onClose,
  onBack,
  onTransfer,
  isSubmitting,
}: {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onTransfer: (data: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  }) => void | Promise<void>;
  isSubmitting?: boolean;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [countryCode, setCountryCode] = useState("+234");
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === "+234") || COUNTRIES[2],
  );
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const translateY = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const isClosingRef = useRef(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const fullNameFieldRef = useRef<View>(null);
  const emailFieldRef = useRef<View>(null);
  const phoneFieldRef = useRef<View>(null);
  const fullNameFieldY = useRef(0);
  const emailFieldY = useRef(0);
  const phoneFieldY = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
        offset.current = 0;
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        translateY.flattenOffset();
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            translateY.setOffset(0);
            offset.current = 0;
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
        offset.current = 0;
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.stopAnimation(() => {
        translateY.setValue(0);
        translateY.setOffset(0);
        offset.current = 0;
      });
      // Reset form when modal opens
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhoneNumber("");
      setShowCountryPicker(false);
      setKeyboardHeight(0);
    } else {
      translateY.setValue(0);
      translateY.setOffset(0);
      offset.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

  // Handle keyboard show/hide
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      },
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => {
        setKeyboardHeight(0);
      },
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const handleTransfer = () => {
    const first = firstName.trim();
    const last = lastName.trim();
    onTransfer({
      firstName: first,
      lastName: last,
      fullName: [first, last].filter(Boolean).join(" "),
      email,
      phoneNumber,
      countryCode,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable
          className="flex-1"
          onPress={() => {
            onClose();
            setShowCountryPicker(false);
          }}
        />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
            maxHeight: Dimensions.get("window").height * 0.9,
            height: Dimensions.get("window").height * 0.85,
            flexDirection: "column",
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
            <Text className="text-xl font-semibold text-black mb-6">
              Recipient Details
            </Text>
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1, minHeight: 0 }}
            keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
          >
            <ScrollView
              ref={scrollViewRef}
              className="px-4"
              style={{ flex: 1, minHeight: 0, backgroundColor: "#FFFFFF" }}
              contentContainerStyle={{
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 50 : 20,
                flexGrow: 1,
              }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              bounces={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="interactive"
            >
              <View className="bg-orange-50 rounded-xl p-4 border border-orange-200 mb-6">
                <Text className="text-sm text-black leading-5">
                  Recipient will receive an email for their assigned pass and
                  must accept the allocation.
                </Text>
              </View>

              <View
                className="mb-4"
                ref={fullNameFieldRef}
                onLayout={(e) => {
                  fullNameFieldY.current = e.nativeEvent.layout.y;
                }}
              >
                <Text className="text-sm font-medium text-black mb-2">
                  First Name
                </Text>
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                  placeholder="Jane"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                  onFocus={() => {
                    setTimeout(() => {
                      if (keyboardHeight > 0 && fullNameFieldY.current > 0) {
                        const buttonAreaHeight = 100;
                        const paddingAboveKeyboard = 20;
                        const fieldHeight = 60;
                        const availableSpace =
                          Dimensions.get("window").height -
                          keyboardHeight -
                          buttonAreaHeight -
                          paddingAboveKeyboard;
                        const targetFieldY = availableSpace - fieldHeight;
                        if (fullNameFieldY.current > targetFieldY) {
                          const scrollAmount =
                            fullNameFieldY.current - targetFieldY;
                          scrollViewRef.current?.scrollTo({
                            y: Math.max(0, scrollAmount),
                            animated: true,
                          });
                        }
                      }
                    }, 300);
                  }}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  Last Name
                </Text>
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                  placeholder="Doe"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View
                className="mb-4"
                ref={emailFieldRef}
                onLayout={(e) => {
                  emailFieldY.current = e.nativeEvent.layout.y;
                }}
              >
                <Text className="text-sm font-medium text-black mb-2">
                  Email
                </Text>
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                  placeholder="janedoe@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => {
                    setTimeout(() => {
                      if (keyboardHeight > 0 && emailFieldY.current > 0) {
                        const buttonAreaHeight = 100;
                        const paddingAboveKeyboard = 20;
                        const fieldHeight = 60;
                        const availableSpace =
                          Dimensions.get("window").height -
                          keyboardHeight -
                          buttonAreaHeight -
                          paddingAboveKeyboard;
                        const targetFieldY = availableSpace - fieldHeight;
                        if (emailFieldY.current > targetFieldY) {
                          const scrollAmount =
                            emailFieldY.current - targetFieldY;
                          scrollViewRef.current?.scrollTo({
                            y: Math.max(0, scrollAmount),
                            animated: true,
                          });
                        }
                      }
                    }, 300);
                  }}
                />
              </View>

              <View
                className="mb-6"
                ref={phoneFieldRef}
                onLayout={(e) => {
                  phoneFieldY.current = e.nativeEvent.layout.y;
                }}
              >
                <Text className="text-sm font-medium text-black mb-2">
                  Phone Number
                </Text>
                <View className="flex-row gap-2">
                  <View className="relative">
                    <Pressable
                      onPress={() => setShowCountryPicker(!showCountryPicker)}
                      className="flex-row items-center bg-white border border-neutral-300 rounded-xl px-3 py-3.5"
                    >
                      <Text className="text-lg mr-1">
                        {selectedCountry.flag}
                      </Text>
                      <Text className="text-base font-medium text-black mr-1">
                        {selectedCountry.code}
                      </Text>
                      <ChevronDownIcon size={14} color="#000000" />
                    </Pressable>
                    {showCountryPicker && (
                      <View
                        className="absolute top-full left-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-lg z-50 max-h-64"
                        style={{ width: 280 }}
                      >
                        <ScrollView
                          className="max-h-64"
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="handled"
                        >
                          {COUNTRIES.map((country) => (
                            <Pressable
                              key={country.code}
                              onPress={() => {
                                setSelectedCountry(country);
                                setCountryCode(country.code);
                                setShowCountryPicker(false);
                              }}
                              className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-100"
                            >
                              <View className="flex-row items-center">
                                <Text className="text-base mr-2">
                                  {country.flag}
                                </Text>
                                <Text className="text-base text-black">
                                  {country.code}
                                </Text>
                              </View>
                              <Text className="text-sm text-neutral-600 flex-1 text-right ml-2">
                                {country.name}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  <TextInput
                    className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                    placeholder="(000) 000-0000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    onFocus={() => {
                      setTimeout(() => {
                        if (keyboardHeight > 0 && phoneFieldY.current > 0) {
                          const buttonAreaHeight = 100;
                          const paddingAboveKeyboard = 20;
                          const fieldHeight = 60;
                          const availableSpace =
                            Dimensions.get("window").height -
                            keyboardHeight -
                            buttonAreaHeight -
                            paddingAboveKeyboard;
                          const targetFieldY = availableSpace - fieldHeight;
                          if (phoneFieldY.current > targetFieldY) {
                            const scrollAmount =
                              phoneFieldY.current - targetFieldY;
                            scrollViewRef.current?.scrollTo({
                              y: Math.max(0, scrollAmount),
                              animated: true,
                            });
                          }
                        }
                      }, 300);
                    }}
                  />
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>

          <SafeAreaView
            edges={["bottom"]}
            className="bg-white"
            style={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 20,
              borderTopWidth: 1,
              borderTopColor: "#F5F5F5",
            }}
          >
            <Pressable
              onPress={handleTransfer}
              disabled={isSubmitting}
              className="w-full items-center justify-center bg-black rounded-xl py-4 px-4 mb-3"
              style={{ opacity: isSubmitting ? 0.6 : 1 }}
            >
              {isSubmitting ? (
                <LoadingSpinner size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-base font-medium text-white">
                  Transfer
                </Text>
              )}
            </Pressable>

            <Pressable
              onPress={onBack}
              disabled={isSubmitting}
              className="w-full items-center justify-center bg-white border border-neutral-300 rounded-xl py-4 px-4"
            >
              <Text className="text-base font-medium text-black">Back</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function CheckmarkIcon({ size = 24, color = "#10B981" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 6L9 17L4 12"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ExclamationIcon({ size = 24, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 8V12M12 16H12.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={2} />
    </Svg>
  );
}

function TicketTransferConfirmationModal({
  visible,
  onClose,
  ticketTitle,
  recipientName,
  onBackToHome,
}: {
  visible: boolean;
  onClose: () => void;
  ticketTitle: string;
  recipientName: string;
  onBackToHome: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
        offset.current = 0;
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        translateY.flattenOffset();
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            translateY.setOffset(0);
            offset.current = 0;
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
        offset.current = 0;
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.stopAnimation(() => {
        translateY.setValue(0);
        translateY.setOffset(0);
        offset.current = 0;
      });
    } else {
      translateY.setValue(0);
      translateY.setOffset(0);
      offset.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-6" />
          </View>

          <View className="px-4 pb-6">
            <View className="items-center mb-6">
              <View
                className="w-20 h-20 rounded-full items-center justify-center"
                style={{ backgroundColor: "#D1FAE5" }}
              >
                <CheckmarkIcon size={48} color="#10B981" />
              </View>
            </View>

            <View className="items-center mb-2">
              <Text className="text-2xl font-bold text-black text-center">
                Ticket Transferred!
              </Text>
            </View>

            <View className="items-center mb-8">
              <Text className="text-base text-neutral-500 text-center">
                {ticketTitle} transferred to {recipientName}
              </Text>
            </View>

            <Pressable
              onPress={onBackToHome}
              className="w-full items-center justify-center bg-black rounded-xl py-4 px-4"
            >
              <Text className="text-base font-medium text-white">Done</Text>
            </Pressable>
          </View>
          <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
        </Animated.View>
      </View>
    </Modal>
  );
}

function XIcon({ size = 24, color = "#FFFFFF" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 6L6 18M6 6L18 18"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckboxIcon({
  checked = false,
  size = 20,
}: {
  checked?: boolean;
  size?: number;
}) {
  if (checked) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="3"
          y="3"
          width={18}
          height={18}
          rx="4"
          fill="#10B981"
          stroke="#10B981"
          strokeWidth={2}
        />
        <Path
          d="M9 12L11 14L15 10"
          stroke="#FFFFFF"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width={18}
        height={18}
        rx="4"
        stroke="#D1D5DB"
        strokeWidth={2}
      />
    </Svg>
  );
}

function UpdateAssignmentDetailsModal({
  visible,
  onClose,
  onBack,
  onUpdate,
  assigneeName,
  assigneeEmail,
  assigneePhone,
  isLoading = false,
}: {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onUpdate: (data: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  }) => void;
  assigneeName: string;
  assigneeEmail: string;
  assigneePhone: string;
  isLoading?: boolean;
}) {
  const parseName = (name: string) => {
    const parts = (name || "").trim().split(/\s+/);
    return {
      firstName: parts[0] || "",
      lastName: parts.slice(1).join(" ") || "",
    };
  };
  const initial = parseName(assigneeName);
  const [firstName, setFirstName] = useState(initial.firstName);
  const [lastName, setLastName] = useState(initial.lastName);
  const [email, setEmail] = useState(assigneeEmail);
  const phoneWithoutCode = assigneePhone.replace(/^\+\d+\s*/, "");
  const initialCountryCode = assigneePhone.match(/^\+\d+/)?.[0] || "+234";
  const [phoneNumber, setPhoneNumber] = useState(phoneWithoutCode);
  const [countryCode, setCountryCode] = useState(initialCountryCode);
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(
    COUNTRIES.find((c) => c.code === initialCountryCode) || COUNTRIES[2],
  );

  useEffect(() => {
    if (visible) {
      const { firstName: f, lastName: l } = parseName(assigneeName);
      setFirstName(f);
      setLastName(l);
      setEmail(assigneeEmail);
      const phoneWithoutCode = assigneePhone.replace(/^\+\d+\s*/, "");
      const extractedCode = assigneePhone.match(/^\+\d+/)?.[0] || "+234";
      setPhoneNumber(phoneWithoutCode);
      setCountryCode(extractedCode);
      const country =
        COUNTRIES.find((c) => c.code === extractedCode) || COUNTRIES[2];
      setSelectedCountry(country);
      setShowCountryPicker(false);
    }
  }, [visible, assigneeName, assigneeEmail, assigneePhone]);

  const translateY = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
        offset.current = 0;
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        translateY.flattenOffset();
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            translateY.setOffset(0);
            offset.current = 0;
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
        offset.current = 0;
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.stopAnimation(() => {
        translateY.setValue(0);
        translateY.setOffset(0);
        offset.current = 0;
      });
      setShowCountryPicker(false);
    } else {
      translateY.setValue(0);
      translateY.setOffset(0);
      offset.current = 0;
      isClosingRef.current = false;
      setShowCountryPicker(false);
    }
  }, [visible, translateY]);

  const handleUpdate = () => {
    const first = firstName.trim();
    const last = lastName.trim();
    onUpdate({
      firstName: first,
      lastName: last,
      fullName: [first, last].filter(Boolean).join(" "),
      email,
      phoneNumber,
      countryCode,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="flex-1 bg-black/50">
          <Pressable
            className="flex-1"
            onPress={() => {
              onClose();
              setShowCountryPicker(false);
            }}
          />
          <Animated.View
            className="bg-white rounded-t-3xl"
            style={{
              transform: [{ translateY }],
              maxHeight: Dimensions.get("window").height * 0.9,
            }}
          >
            <View
              className="items-center pt-2 pb-2"
              {...panResponder.panHandlers}
            >
              <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
              <Text className="text-xl font-semibold text-black mb-6">
                Update Assignment Details
              </Text>
            </View>

            <ScrollView
              className="px-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              <View className="bg-orange-50 rounded-xl p-4 border border-orange-200 mb-6">
                <Text className="text-sm text-black leading-5">
                  Recipient will need to accept allocation for ticket to be
                  usable.
                </Text>
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  First Name
                </Text>
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                  placeholder="Jane"
                  placeholderTextColor="#9CA3AF"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  Last Name
                </Text>
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                  placeholder="Doe"
                  placeholderTextColor="#9CA3AF"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>

              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  Email
                </Text>
                <TextInput
                  className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                  placeholder="janedoe@gmail.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View className="mb-6">
                <Text className="text-sm font-medium text-black mb-2">
                  Phone Number
                </Text>
                <View className="flex-row gap-2">
                  <View className="relative">
                    <Pressable
                      onPress={() => setShowCountryPicker(!showCountryPicker)}
                      className="flex-row items-center bg-white border border-neutral-300 rounded-xl px-3 py-3.5"
                    >
                      <Text className="text-lg mr-1">
                        {selectedCountry.flag}
                      </Text>
                      <Text className="text-base font-medium text-black mr-1">
                        {selectedCountry.code}
                      </Text>
                      <ChevronDownIcon size={14} color="#000000" />
                    </Pressable>
                    {showCountryPicker && (
                      <View
                        className="absolute top-full left-0 mt-1 bg-white border border-neutral-300 rounded-xl shadow-lg z-50 max-h-64"
                        style={{ width: 280 }}
                      >
                        <ScrollView
                          className="max-h-64"
                          nestedScrollEnabled={true}
                          keyboardShouldPersistTaps="handled"
                        >
                          {COUNTRIES.map((country) => (
                            <Pressable
                              key={country.code}
                              onPress={() => {
                                setSelectedCountry(country);
                                setCountryCode(country.code);
                                setShowCountryPicker(false);
                              }}
                              className="flex-row items-center justify-between px-4 py-3 border-b border-neutral-100"
                            >
                              <View className="flex-row items-center">
                                <Text className="text-base mr-2">
                                  {country.flag}
                                </Text>
                                <Text className="text-base text-black">
                                  {country.code}
                                </Text>
                              </View>
                              <Text className="text-sm text-neutral-600 flex-1 text-right ml-2">
                                {country.name}
                              </Text>
                            </Pressable>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                  <TextInput
                    className="flex-1 bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base"
                    placeholder="(000) 000-0000"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>
              </View>

              <Pressable
                onPress={handleUpdate}
                disabled={isLoading}
                className="w-full items-center justify-center bg-black rounded-xl py-4 px-4 mb-3"
                style={{ opacity: isLoading ? 0.6 : 1 }}
              >
                <Text className="text-base font-medium text-white">
                  {isLoading ? "Updating..." : "Update Assignment"}
                </Text>
              </Pressable>

              <Pressable
                onPress={onBack}
                disabled={isLoading}
                className="w-full items-center justify-center bg-white border border-neutral-300 rounded-xl py-4 px-4 mb-2"
              >
                <Text className="text-base font-medium text-black">Back</Text>
              </Pressable>
            </ScrollView>
            <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function RevokeTicketAccessModal({
  visible,
  onClose,
  onBack,
  onConfirm,
  assigneeName,
  isLoading = false,
}: {
  visible: boolean;
  onClose: () => void;
  onBack: () => void;
  onConfirm: (reason: string) => void;
  assigneeName: string;
  isLoading?: boolean;
}) {
  const [reason, setReason] = useState("");
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    if (visible) {
      setReason("");
      setIsConfirmed(false);
    }
  }, [visible]);

  const translateY = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
        offset.current = 0;
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        translateY.flattenOffset();
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            translateY.setOffset(0);
            offset.current = 0;
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
        offset.current = 0;
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.stopAnimation(() => {
        translateY.setValue(0);
        translateY.setOffset(0);
        offset.current = 0;
      });
    } else {
      translateY.setValue(0);
      translateY.setOffset(0);
      offset.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

  const handleConfirm = () => {
    if (isConfirmed && reason.trim().length > 0) {
      onConfirm(reason);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="flex-1 bg-black/50">
          <Pressable className="flex-1" onPress={onClose} />
          <Animated.View
            className="bg-white rounded-t-3xl"
            style={{
              transform: [{ translateY }],
              maxHeight: Dimensions.get("window").height * 0.8,
            }}
          >
            <View
              className="items-center pt-2 pb-2"
              {...panResponder.panHandlers}
            >
              <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
              <Text className="text-xl font-semibold text-black mb-6">
                Revoke Ticket Access
              </Text>
            </View>

            <ScrollView
              className="px-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 100 }}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled={true}
            >
              {/* Warning Box */}
              <View className="bg-red-50 rounded-xl p-4 border border-red-200 mb-6">
                <View className="mb-2">
                  <Text className="text-sm text-black leading-5">
                    • Assignee will immediately lose access
                  </Text>
                </View>
                <View className="mb-2">
                  <Text className="text-sm text-black leading-5">
                    • Ticket will be returned to your quota
                  </Text>
                </View>
                <View className="mb-2">
                  <Text className="text-sm text-black leading-5">
                    • Assignee will be notified via email
                  </Text>
                </View>
                <View>
                  <Text className="text-sm text-black leading-5">
                    • This cannot be undone
                  </Text>
                </View>
              </View>

              {/* Reason for Revocation */}
              <View className="mb-4">
                <Text className="text-sm font-medium text-black mb-2">
                  Reason for Revocation *
                </Text>
                <View className="relative">
                  <TextInput
                    className="bg-white border border-neutral-300 rounded-xl px-4 py-3.5 text-base min-h-[120]"
                    placeholder="Please, provide a reason for revoking this ticket..."
                    placeholderTextColor="#9CA3AF"
                    value={reason}
                    onChangeText={setReason}
                    multiline
                    maxLength={200}
                    textAlignVertical="top"
                  />
                  <View className="absolute bottom-3 right-3 flex-row items-center">
                    <Text className="text-xs text-neutral-400">
                      {reason.length}/200
                    </Text>
                  </View>
                </View>
                <Text className="text-xs text-neutral-400 mt-2">
                  Assignee will be notified with this reason.
                </Text>
              </View>

              {/* Confirmation Checkbox */}
              <View className="bg-orange-50 rounded-xl p-4 border border-orange-200 mb-6">
                <Pressable
                  onPress={() => setIsConfirmed(!isConfirmed)}
                  className="flex-row items-start"
                >
                  <View className="mr-3 mt-0.5">
                    <CheckboxIcon checked={isConfirmed} size={20} />
                  </View>
                  <Text className="text-sm text-black flex-1 leading-5">
                    I understand that {assigneeName} will immediately lose
                    access to this ticket and will be notified via email.
                  </Text>
                </Pressable>
              </View>

              <Pressable
                onPress={handleConfirm}
                disabled={
                  !isConfirmed || reason.trim().length === 0 || isLoading
                }
                className="w-full items-center justify-center rounded-xl py-4 px-4 mb-3 bg-red-50 border border-red-500"
                style={{
                  opacity:
                    isConfirmed && reason.trim().length > 0 && !isLoading
                      ? 1
                      : 0.5,
                }}
              >
                <Text className="text-base font-medium text-red-500">
                  {isLoading ? "Revoking..." : "Confirm Revoke Access"}
                </Text>
              </Pressable>

              <Pressable
                onPress={onBack}
                className="w-full items-center justify-center bg-white border border-neutral-300 rounded-xl py-4 px-4 mb-2"
              >
                <Text className="text-base font-medium text-black">Back</Text>
              </Pressable>
            </ScrollView>
            <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function TicketReassignedConfirmationModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
        offset.current = 0;
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        translateY.flattenOffset();
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            translateY.setOffset(0);
            offset.current = 0;
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
        offset.current = 0;
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.stopAnimation(() => {
        translateY.setValue(0);
        translateY.setOffset(0);
        offset.current = 0;
      });
    } else {
      translateY.setValue(0);
      translateY.setOffset(0);
      offset.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
            maxHeight: Dimensions.get("window").height * 0.6,
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-6" />
          </View>

          <View className="px-4 pb-6">
            <View className="items-center mb-6">
              <View className="relative">
                <View
                  className="w-24 h-24 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#D1FAE5" }}
                >
                  <CheckmarkIcon size={56} color="#10B981" />
                </View>
                <View
                  className="absolute rounded-full opacity-30"
                  style={{
                    backgroundColor: "#10B981",
                    top: -8,
                    left: -8,
                    right: -8,
                    bottom: -8,
                  }}
                />
              </View>
            </View>

            <View className="items-center mb-2">
              <Text className="text-2xl font-bold text-black text-center">
                Ticket has been reassigned!
              </Text>
            </View>

            <View className="items-center mb-8">
              <Text className="text-base text-black text-center">
                A notification has been sent to the assignee with updated ticket
                information.
              </Text>
            </View>

            <Pressable
              onPress={onConfirm}
              className="w-full items-center justify-center bg-black rounded-xl py-4 px-4"
            >
              <Text className="text-base font-medium text-white">
                Okay, nice
              </Text>
            </Pressable>
          </View>
          <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
        </Animated.View>
      </View>
    </Modal>
  );
}

function TicketRevokedConfirmationModal({
  visible,
  onClose,
  onConfirm,
}: {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
        offset.current = 0;
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        translateY.flattenOffset();
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            translateY.setOffset(0);
            offset.current = 0;
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
        offset.current = 0;
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.stopAnimation(() => {
        translateY.setValue(0);
        translateY.setOffset(0);
        offset.current = 0;
      });
    } else {
      translateY.setValue(0);
      translateY.setOffset(0);
      offset.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
            maxHeight: Dimensions.get("window").height * 0.6,
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-6" />
          </View>

          <View className="px-4 pb-6">
            <View className="items-center mb-6">
              <View className="relative">
                <View
                  className="w-24 h-24 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#FEE2E2" }}
                >
                  <View
                    className="w-20 h-20 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#EF4444" }}
                  >
                    <ExclamationIcon size={48} color="#FFFFFF" />
                  </View>
                </View>
                <View
                  className="absolute rounded-full opacity-20"
                  style={{
                    backgroundColor: "#EF4444",
                    top: -8,
                    left: -8,
                    right: -8,
                    bottom: -8,
                  }}
                />
                <View
                  className="absolute rounded-full opacity-10"
                  style={{
                    backgroundColor: "#EF4444",
                    top: -16,
                    left: -16,
                    right: -16,
                    bottom: -16,
                  }}
                />
              </View>
            </View>

            <View className="items-center mb-2">
              <Text className="text-2xl font-bold text-black text-center">
                Ticket has been revoked!
              </Text>
            </View>

            <View className="items-center mb-8">
              <Text className="text-base text-neutral-500 text-center">
                Your ticket will return to "Available" status
              </Text>
            </View>

            <Pressable
              onPress={onConfirm}
              className="w-full items-center justify-center bg-black rounded-xl py-4 px-4"
            >
              <Text className="text-base font-medium text-white">Alright</Text>
            </Pressable>
          </View>
          <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
        </Animated.View>
      </View>
    </Modal>
  );
}

function EditAssignedTicketModal({
  visible,
  onClose,
  title,
  ticketNumber,
  backgroundColor,
  assignedTo,
  assigneeEmail,
  assigneePhone,
  assignedDate,
  allocationStatus,
  onUpdateAssignment,
  onRevokeAccess,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  ticketNumber: string;
  backgroundColor: string;
  assignedTo: string;
  assigneeEmail: string;
  assigneePhone: string;
  assignedDate: string;
  allocationStatus?: "pending" | "accepted" | "rejected" | "cancelled";
  onUpdateAssignment: () => void;
  onRevokeAccess: () => void;
}) {
  const isAccepted = allocationStatus === "accepted";
  const isLightCard = isLightTicketCard(title);
  const translateY = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
        offset.current = 0;
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        translateY.flattenOffset();
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            translateY.setOffset(0);
            offset.current = 0;
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
        offset.current = 0;
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.stopAnimation(() => {
        translateY.setValue(0);
        translateY.setOffset(0);
        offset.current = 0;
      });
    } else {
      translateY.setValue(0);
      translateY.setOffset(0);
      offset.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 ">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
            maxHeight: Dimensions.get("window").height * 0.8,
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
            <Text className="text-xl font-semibold text-black mb-6">
              {isAccepted ? "Assigned Ticket" : "Edit Assigned Ticket"}
            </Text>
          </View>

          <ScrollView
            className="px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Information Banner - status-dependent */}
            {isAccepted ? (
              <>
                <View className="bg-neutral-100 rounded-xl p-4 border border-neutral-200 mb-4">
                  <Text className="text-sm text-black leading-5">
                    This ticket has been accepted by the assignee. No further
                    actions are available. Revoking and updating are only possible
                    before the assignee accepts the invitation.
                  </Text>
                </View>
                <View className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6">
                  <Text className="text-sm font-semibold text-black leading-5">
                    If you plan to revoke and reassign this ticket, please contact
                    the recipient directly to complete the process.
                  </Text>
                </View>
              </>
            ) : (
              <View className="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-6">
                <Text className="text-sm text-black leading-5">
                  Updating assignment details is not supported. To change
                  recipient details, revoke this ticket and reassign to someone
                  else—before they accept.
                </Text>
              </View>
            )}

            {/* Ticket Card */}
            <View className="mb-6">
              <View
                className="rounded-2xl p-3 relative overflow-hidden"
                style={{ backgroundColor }}
              >
                <View className="absolute top-0 right-0 w-24 h-24 opacity-20">
                  <View
                    className={`absolute top-3 right-3 w-10 h-10 border-2 ${
                      isLightCard ? "border-black/30" : "border-white/30"
                    } rounded-lg`}
                  />
                  <View
                    className={`absolute top-8 right-8 w-5 h-5 border-2 ${
                      isLightCard ? "border-black/30" : "border-white/30"
                    } rounded`}
                  />
                  <View
                    className={`absolute top-14 right-14 w-3 h-3 border ${
                      isLightCard ? "border-black/30" : "border-white/30"
                    } rounded`}
                  />
                </View>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text
                      className={`text-2xl font-bold mb-2 ${
                        isLightCard ? "text-black" : "text-white"
                      }`}
                    >
                      {title}
                    </Text>
                    <Text
                      className={`text-base mb-10 ${
                        isLightCard ? "text-black/50" : "text-white/50"
                      }`}
                    >
                      {ticketNumber || "—"}
                    </Text>
                    <View className="flex-col">
                      <Text
                        className={`text-sm ${
                          isLightCard ? "text-black/60" : "text-white/60"
                        }`}
                      >
                        Assigned to
                      </Text>
                      <Text
                        className={`font-semibold py-2 text-[18px] ${
                          isLightCard ? "text-black" : "text-white"
                        }`}
                      >
                        {assignedTo}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <View
                      className={`px-2 py-1 rounded-full flex-row items-center ${
                        isLightCard ? "bg-black/5" : "bg-white/20"
                      }`}
                    >
                      <View
                        className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          isLightCard ? "bg-black/40" : "bg-white"
                        }`}
                      />
                      <Text
                        className={`text-xs font-medium ${
                          isLightCard ? "text-black/70" : "text-white"
                        }`}
                      >
                        {isAccepted ? "Accepted" : "Pending"}
                      </Text>
                    </View>
                    <View className="flex-row items-center gap-1">
                      <View className="w-6 h-6 items-center justify-center">
                        <TicketIcon
                          size={18}
                          color={isLightCard ? "#111827" : "#FFFFFF"}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Currently Assigned To Section */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-black mb-3">
                Currently Assigned To:
              </Text>
              <View className="bg-white rounded-xl p-4 border border-neutral-200">
                <Text className="text-lg font-semibold text-black mb-2">
                  {assignedTo}
                </Text>
                {assigneeEmail ? (
                  <Text className="text-sm text-neutral-500 mb-1">
                    {assigneeEmail}
                  </Text>
                ) : null}
                {assigneePhone ? (
                  <Text className="text-sm text-neutral-500 mb-1">
                    {assigneePhone}
                  </Text>
                ) : null}
                <Text className="text-xs text-neutral-400">
                  Assigned on {assignedDate || "—"}
                </Text>
              </View>
            </View>

            {/* Action Buttons - Update not supported; Revoke only when pending */}
            {!isAccepted && (
              <>
                <Pressable
                  onPress={onRevokeAccess}
                  className="w-full flex-row items-center justify-center bg-white rounded-xl py-4 px-4 border border-red-500 mb-2"
                >
                  <View className="w-5 h-5 rounded-full bg-red-500 items-center justify-center mr-2">
                    <XIcon size={12} color="#FFFFFF" />
                  </View>
                  <Text className="text-base font-medium text-red-500">
                    Revoke Ticket Access
                  </Text>
                </Pressable>
                <Text className="text-xs text-neutral-400 text-center mb-4">
                  Revoking will return this ticket to "Available" status. Do
                  this before the assignee accepts if you need to change
                  details.
                </Text>
              </>
            )}
          </ScrollView>
          <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
        </Animated.View>
      </View>
    </Modal>
  );
}

function TransferTicketModal({
  visible,
  onClose,
  title,
  ticketNumber,
  backgroundColor,
  isUnassigned,
  onContinue,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  ticketNumber: string;
  backgroundColor: string;
  isUnassigned?: boolean;
  onContinue: () => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const offset = useRef(0);
  const isLightCard = isLightTicketCard(title);
  const isClosingRef = useRef(false);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isClosingRef.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !isClosingRef.current && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        if (isClosingRef.current) return;
        translateY.stopAnimation();
        offset.current = 0;
        translateY.setOffset(0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isClosingRef.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isClosingRef.current) return;
        translateY.flattenOffset();
        if (gestureState.dy > 100 || gestureState.vy > 0.5) {
          isClosingRef.current = true;
          Animated.timing(translateY, {
            toValue: 1000,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            translateY.setOffset(0);
            offset.current = 0;
            isClosingRef.current = false;
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 8,
          }).start();
        }
        offset.current = 0;
      },
    }),
  ).current;

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      translateY.stopAnimation(() => {
        translateY.setValue(0);
        translateY.setOffset(0);
        offset.current = 0;
      });
    } else {
      translateY.setValue(0);
      translateY.setOffset(0);
      offset.current = 0;
      isClosingRef.current = false;
    }
  }, [visible, translateY]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <Animated.View
          className="bg-white rounded-t-3xl"
          style={{
            transform: [{ translateY }],
          }}
        >
          <View
            className="items-center pt-2 pb-2"
            {...panResponder.panHandlers}
          >
            <View className="w-12 h-1 bg-neutral-300 rounded-full mb-4" />
            <Text className="text-xl font-semibold text-black mb-6">
              {isUnassigned ? "Transfer Unassigned Ticket" : "Transfer Ticket"}
            </Text>
          </View>

          <ScrollView
            className="px-4"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          >
            {/* Transfer Ticket Modal Instructions */}
            <View className="bg-orange-50 rounded-xl p-4 border border-orange-200 mb-6">
              {isUnassigned ? (
                // Unassigned ticket instructions (4 bullet points)
                <>
                  <Text className="text-sm text-black leading-5 mb-1">
                    • Assignee will have access to the event with this ticket
                    type
                  </Text>
                  <Text className="text-sm text-black leading-5 mb-1">
                    • You can revoke access anytime before the event
                  </Text>
                  <Text className="text-sm text-black leading-5 mb-1">
                    • Verify contact details carefully
                  </Text>
                  <Text className="text-sm text-black leading-5 mb-1">
                    • Recipient will need to accept allocation for ticket to be
                    usable at the event.
                  </Text>
                </>
              ) : (
                // Personal ticket instructions (4 bullet points - warning style)
                <>
                  <Text className="text-sm text-black leading-5 mb-1">
                    • Once transferred, you will lose total access to the event
                  </Text>
                  <Text className="text-sm text-black leading-5 mb-1">
                    • This action cannot be undone
                  </Text>
                  <Text className="text-sm text-black leading-5 mb-1">
                    • Verify contact details carefully
                  </Text>
                  <Text className="text-sm text-black leading-5 mb-1">
                    • Recipient will need to accept allocation for ticket to be
                    usable at the event.
                  </Text>
                </>
              )}
            </View>

            {/* Transfer Ticket Card */}
            <View className="mb-6">
              <View
                className="rounded-2xl p-5 relative overflow-hidden"
                style={{ backgroundColor }}
              >
                <View className="absolute top-0 right-0 w-24 h-24 opacity-20">
                  <View
                    className={`absolute top-3 right-3 w-10 h-10 border-2 ${
                      isLightCard ? "border-black/30" : "border-white/30"
                    } rounded-lg`}
                  />
                  <View
                    className={`absolute top-8 right-8 w-5 h-5 border-2 ${
                      isLightCard ? "border-black/30" : "border-white/30"
                    } rounded`}
                  />
                  <View
                    className={`absolute top-14 right-14 w-3 h-3 border ${
                      isLightCard ? "border-black/30" : "border-white/30"
                    } rounded`}
                  />
                </View>
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <Text
                      className={`text-2xl font-bold mb-2 ${
                        isLightCard ? "text-black" : "text-white"
                      }`}
                    >
                      {title}
                    </Text>
                    <Text
                      className={`text-base ${
                        isLightCard ? "text-black/50" : "text-white/50"
                      }`}
                    >
                      {ticketNumber}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    {isUnassigned && (
                      <View
                        className={`px-2 py-1 rounded-full flex-row items-center ${
                          isLightCard ? "bg-black/5" : "bg-white/20"
                        }`}
                      >
                        <View
                          className={`w-1.5 h-1.5 rounded-full mr-1 ${
                            isLightCard ? "bg-black/40" : "bg-white"
                          }`}
                        />
                        <Text
                          className={`text-xs font-medium ${
                            isLightCard ? "text-black/70" : "text-white"
                          }`}
                        >
                          Unassigned
                        </Text>
                      </View>
                    )}
                    <View className="flex-row items-center gap-1">
                      <View className="w-6 h-6 items-center justify-center">
                        <TicketIcon
                          size={18}
                          color={isLightCard ? "#111827" : "#FFFFFF"}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            <Pressable
              onPress={onContinue}
              className="w-full items-center justify-center bg-black rounded-xl py-4 px-4 mb-1"
            >
              <Text className="text-base font-medium text-white">Continue</Text>
            </Pressable>
          </ScrollView>
          <SafeAreaView edges={["bottom"]} className="bg-white pb-4" />
        </Animated.View>
      </View>
    </Modal>
  );
}

// Ticket data structure
interface Ticket {
  id: string;
  title: string;
  ticketNumber: string;
  backgroundColor: string;
  assignedTo?: string;
  assigneeEmail?: string;
  assigneePhone?: string;
  assignedDate?: string;
  isPersonal: boolean; // true for personal ticket, false for available to assign
  isUnassigned: boolean; // true if ticket hasn't been assigned yet
  quotaId?: number; // For unassigned: quota allocation uses this
  ticketClassId?: number; // For unassigned: quota allocation uses this
  availableCount?: number; // For unassigned: one card per quota, count shown on card
  allocationStatus?: "pending" | "accepted" | "rejected" | "cancelled";
  /** Personal ticket only: backend ticket id for upgrade API */
  backendTicketId?: number;
  /** Personal ticket only: type name/user_type for tier (Expo/Oasis/Delegate/Chairperson) */
  ticketType?: string;
}

// Helper function to check if user is exhibitor/partner admin
function isExhibitorPartnerAdmin(
  user: {
    user_id: string;
    company?: { admin_user?: string | null } | null;
  } | null,
): boolean {
  if (!user || !user.company) {
    return false;
  }
  return user.company.admin_user === user.user_id;
}

// Only exhibitor/partner admins are blocked from transferring; chairperson/delegate/etc are not
function isExhibitorOrPartnerType(typeOrCompany?: string | null): boolean {
  if (!typeOrCompany || typeof typeOrCompany !== "string") return false;
  const t = typeOrCompany.toLowerCase();
  return t.includes("exhibitor") || t.includes("partner");
}

// Event-scoped transfer rules for the active ASF event.
function isCurrentSparkEvent(eventId: number): boolean {
  return eventId === EVENT_ID;
}

// Helper function to determine if personal ticket can be transferred
// Returns object with canTransfer flag and optional reason
function canTransferPersonalTicket(
  eventId: number,
  user: {
    user_id: string;
    company?: { admin_user?: string | null } | null;
  } | null,
  tickets: Ticket[],
): { canTransfer: boolean; reason?: string; isAdminBlocked?: boolean } {
  if (isCurrentSparkEvent(eventId)) {
    // Rule 1: Block only when user is company admin AND their pass/company is exhibitor or partner
    // (Chairperson/delegate/etc with admin_user still set can transfer — backend may not have cleared admin)
    const personalTicket = tickets.find((t) => t.isPersonal);
    const personalType =
      personalTicket?.ticketType ?? personalTicket?.title ?? "";
    const companyType = (user as any)?.company?.company_type ?? "";
    const isExhibitorOrPartner =
      isExhibitorOrPartnerType(personalType) ||
      isExhibitorOrPartnerType(companyType);

    if (isExhibitorPartnerAdmin(user) && isExhibitorOrPartner) {
      return {
        canTransfer: false,
        reason: "Exhibitor/partner admins cannot transfer personal tickets",
        isAdminBlocked: true,
      };
    }

    // Rule 2 & 3: Others can transfer if:
    // - Single ticket: Can transfer (they can lose access)
    // - Multiple tickets: Must have assigned all others first
    const totalTickets = tickets.length;
    const availableToAssign = tickets.filter(
      (t) => !t.isPersonal && t.isUnassigned,
    );
    const availableSlots = availableToAssign.reduce(
      (sum, t) => sum + (t.availableCount ?? 1),
      0,
    );

    if (totalTickets === 1) {
      return { canTransfer: true }; // Allow single ticket transfer
    }

    if (availableSlots > 0) {
      return {
        canTransfer: false,
        reason: `You must assign ${availableSlots} available ticket(s) first`,
      };
    }

    return { canTransfer: true };
  }

  // Default behavior for other events (current logic)
  const totalTickets = tickets.length;
  const availableToAssign = tickets.filter(
    (t) => !t.isPersonal && t.isUnassigned,
  );
  const availableSlots = availableToAssign.reduce(
    (sum, t) => sum + (t.availableCount ?? 1),
    0,
  );

  if (totalTickets <= 1) {
    return {
      canTransfer: false,
      reason:
        "You only have one ticket. Transferring it would remove your access.",
    };
  }

  if (availableSlots > 0) {
    return {
      canTransfer: false,
      reason: `You must assign ${availableSlots} available ticket(s) first`,
    };
  }

  return { canTransfer: true };
}

function MyTicketView({
  tickets,
  loading,
  error,
  onViewQR,
  onTransfer,
  onUpgrade,
  onEditAssignment,
  user,
  eventId,
}: {
  tickets: Ticket[];
  loading?: boolean;
  error?: string | null;
  onViewQR: (
    title: string,
    ticketNumber: string,
    canTransfer: boolean,
    totalTickets: number,
    availableToAssignCount: number,
  ) => void;
  onTransfer: (
    title: string,
    ticketNumber: string,
    assignedTo: string,
    backgroundColor?: string,
    isUnassigned?: boolean,
    ticket?: Ticket,
  ) => void;
  onUpgrade?: (ticket: Ticket) => void;
  onEditAssignment: (
    title: string,
    ticketNumber: string,
    backgroundColor: string,
    assignedTo: string,
    assigneeEmail?: string,
    assigneePhone?: string,
    assignedDate?: string,
    allocationId?: number | null,
    allocationStatus?: "pending" | "accepted" | "rejected" | "cancelled",
  ) => void;
  user: {
    user_id: string;
    company?: { admin_user?: string | null } | null;
  } | null;
  eventId: number;
}) {
  // Calculate ticket counts
  const personalTickets = tickets.filter((t) => t.isPersonal);
  const availableToAssignTickets = tickets.filter(
    (t) => !t.isPersonal && t.isUnassigned,
  );
  const assignedOtherTickets = tickets.filter(
    (t) => !t.isPersonal && !t.isUnassigned,
  );

  // Use helper function to determine if personal ticket can be transferred
  const totalTickets = tickets.length;
  const transferResult = canTransferPersonalTicket(eventId, user, tickets);
  const canTransfer = transferResult.canTransfer;
  const isAdminBlocked = transferResult.isAdminBlocked || false;

  // Get tickets by category (order per Figma: My Ticket, Assigned, Available)
  const myPersonalTickets = tickets.filter((t) => t.isPersonal);
  const assignedTickets = tickets.filter(
    (t) => !t.isPersonal && !t.isUnassigned,
  );
  const unassignedTickets = tickets.filter(
    (t) => !t.isPersonal && t.isUnassigned,
  );
  const availableToAssignSlots = unassignedTickets.reduce(
    (sum, t) => sum + (t.availableCount ?? 1),
    0,
  );

  const [benefitsModal, setBenefitsModal] = useState<{
    tierLabel: string;
    items: string[];
    ticketType?: string;
  } | null>(null);

  if (loading) {
    return (
      <View className="flex-1">
        <SkeletonMyTicketView count={1} />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-4">
        <Text className="text-base text-red-600 text-center mb-4">{error}</Text>
      </View>
    );
  }

  if (tickets.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20 px-4">
        <Text className="text-base text-neutral-600 text-center">
          No tickets found for this event.
        </Text>
      </View>
    );
  }

  return (
    <>
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-4 pt-4">
        <Text className="text-[20px] font-semibold text-black mb-4">
          My Ticket
        </Text>
        {myPersonalTickets.map((ticket) => {
          const benefits = getTicketBenefits(ticket.ticketType ?? ticket.title);
          return (
            <View
              key={ticket.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 16,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                padding: 10,
                overflow: "hidden",
                marginBottom: 16,
              }}
            >
              <TicketCard
                title={ticket.title}
                ticketNumber={ticket.ticketNumber}
                backgroundColor={ticket.backgroundColor}
                ticketType={ticket.ticketType}
                assignedTo={ticket.assignedTo}
                isMyTicket={true}
                canTransfer={canTransfer}
                totalTickets={totalTickets}
                availableToAssignCount={availableToAssignSlots}
                isAdminBlocked={isAdminBlocked}
                eventId={eventId}
                canUpgrade={false}
                onViewQR={() =>
                  onViewQR(
                    ticket.title,
                    ticket.ticketNumber,
                    canTransfer,
                    totalTickets,
                    availableToAssignSlots,
                  )
                }
                onTransfer={() =>
                  canTransfer
                    ? onTransfer(
                        ticket.title,
                        ticket.ticketNumber,
                        ticket.assignedTo || "",
                        ticket.backgroundColor,
                        false,
                      )
                    : undefined
                }
                onUpgrade={undefined}
                onViewBenefits={
                  benefits
                    ? () => {
                        setBenefitsModal({
                          tierLabel: benefits.tierLabel,
                          items: benefits.items,
                          ticketType: ticket.ticketType,
                        });
                        void trackEvent("ticket_benefits_opened", {
                          source: "scan_qr_screen",
                          ticket_type: ticket.ticketType ?? "",
                          tier: benefits.tier,
                        });
                      }
                    : undefined
                }
              />
            </View>
          );
        })}

        {assignedTickets.length > 0 && (
          <>
            <Text className="text-[20px] font-semibold text-black mb-4 mt-6">
              Assigned Ticket(s)
            </Text>
            {assignedTickets.map((ticket) => (
              <View
                key={ticket.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  padding: 10,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <TicketCard
                  title={ticket.title}
                  ticketNumber={ticket.ticketNumber}
                  backgroundColor={ticket.backgroundColor}
                  ticketType={ticket.ticketType}
                  assignedTo={ticket.assignedTo}
                  isMyTicket={false}
                  allocationStatus={ticket.allocationStatus}
                  onEditAssignment={() => {
                    const allocId =
                      typeof ticket.id === "string" &&
                      ticket.id.startsWith("alloc-")
                        ? parseInt(ticket.id.replace("alloc-", ""), 10)
                        : null;
                    onEditAssignment(
                      ticket.title,
                      ticket.ticketNumber,
                      ticket.backgroundColor,
                      ticket.assignedTo || "",
                      ticket.assigneeEmail,
                      ticket.assigneePhone,
                      ticket.assignedDate,
                      Number.isNaN(allocId) ? null : allocId,
                      ticket.allocationStatus,
                    );
                  }}
                />
              </View>
            ))}
          </>
        )}

        {/* Always show Available to Assign when user has quotas (even 0 remaining) */}
        {unassignedTickets.length > 0 && (
          <>
            <Text className="text-[20px] font-semibold text-black mb-4 mt-6">
              Available to Assign
            </Text>
            {unassignedTickets.map((ticket) => (
              <View
                key={ticket.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                  padding: 10,
                  overflow: "hidden",
                  marginBottom: 16,
                }}
              >
                <TicketCard
                  title={ticket.title}
                  ticketNumber={ticket.ticketNumber}
                  backgroundColor={ticket.backgroundColor}
                  ticketType={ticket.ticketType}
                  isUnassigned
                  availableCount={ticket.availableCount}
                  onAssign={
                    (ticket.availableCount ?? 0) > 0
                      ? () =>
                          onTransfer(
                            ticket.title,
                            ticket.ticketNumber,
                            "",
                            ticket.backgroundColor,
                            true,
                            ticket,
                          )
                      : undefined
                  }
                />
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
    <TicketBenefitsModal
      visible={benefitsModal != null}
      onClose={() => setBenefitsModal(null)}
      tierLabel={benefitsModal?.tierLabel ?? ""}
      items={benefitsModal?.items ?? []}
      ticketType={benefitsModal?.ticketType}
    />
    </>
  );
}

type ScanQRScreenProps = RootStackScreenProps<"ScanQR">;

// UUID validation function
const validateUUID = (uuid: string): { valid: boolean; error?: string } => {
  const trimmed = uuid.trim();
  if (!trimmed) {
    return { valid: false, error: "Ticket code is required" };
  }
  // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (accepts any UUID version)
  // More lenient regex that accepts any UUID format (v1, v4, etc.)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(trimmed)) {
    return {
      valid: false,
      error: "Invalid ticket code format. Please enter a valid UUID.",
    };
  }
  return { valid: true };
};

// Format UUID for display - shows first 8 characters (e.g., "123e4567")
const formatTicketCodeForDisplay = (uuid: string): string => {
  if (!uuid) return "";
  // Remove hyphens and take first 8 characters
  const cleaned = uuid.replace(/-/g, "");
  return cleaned.substring(0, 8).toUpperCase();
};

export default function ScanQRScreen({ route }: ScanQRScreenProps) {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { toast, showToast, hideToast } = useToast();
  const { user, logout } = useAuth();
  const postEventMode = isPostEventMode();
  const initialTab =
    route.params?.initialTab || (postEventMode ? "My Ticket" : "Scan Ticket");
  const [activeTab, setActiveTab] = useState<"My Ticket" | "Scan Ticket">(
    initialTab,
  );
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [qrModalData, setQrModalData] = useState<{
    title: string;
    ticketNumber: string;
    assignedTo: string;
    canTransfer?: boolean;
    totalTickets?: number;
    availableToAssignCount?: number;
    isAdminBlocked?: boolean;
    eventId?: number;
  }>({
    title: "",
    ticketNumber: "",
    assignedTo: "",
  });
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [transferModalData, setTransferModalData] = useState<{
    title: string;
    ticketNumber: string;
    assignedTo: string;
    backgroundColor: string;
    isUnassigned: boolean;
    ticketClassId?: number;
    quotaId?: number;
  }>({
    title: "",
    ticketNumber: "",
    assignedTo: "",
    backgroundColor: "#000000",
    isUnassigned: false,
  });
  const [recipientModalVisible, setRecipientModalVisible] = useState(false);
  const [assigningTicketsModalVisible, setAssigningTicketsModalVisible] =
    useState(false);
  const [confirmationModalVisible, setConfirmationModalVisible] =
    useState(false);
  const [editAssignedTicketModalVisible, setEditAssignedTicketModalVisible] =
    useState(false);
  const [editAssignedTicketData, setEditAssignedTicketData] = useState<{
    title: string;
    ticketNumber: string;
    backgroundColor: string;
    assignedTo: string;
    assigneeEmail: string;
    assigneePhone: string;
    assignedDate: string;
    allocationId: number | null;
    allocationStatus?: "pending" | "accepted" | "rejected" | "cancelled";
  } | null>(null);
  const [updateAssignmentModalVisible, setUpdateAssignmentModalVisible] =
    useState(false);
  const [revokeAccessModalVisible, setRevokeAccessModalVisible] =
    useState(false);
  const [
    ticketReassignedConfirmationVisible,
    setTicketReassignedConfirmationVisible,
  ] = useState(false);
  const [
    ticketRevokedConfirmationVisible,
    setTicketRevokedConfirmationVisible,
  ] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrScannerModalVisible, setQrScannerModalVisible] = useState(false);
  const [recipientData, setRecipientData] = useState<{
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  } | null>(null);

  // Ticket state management
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [isAllocating, setIsAllocating] = useState(false);

  // Fetch tickets: personal + quotas (Available) + allocations (Assigned)
  const fetchTickets = React.useCallback(async () => {
    setTicketsLoading(true);
    setTicketsError(null);

    const allTickets: Ticket[] = [];

    // Step 1: Personal ticket (bypassCache so pass type/colors stay correct after backend change)
    try {
      const backendTicket = await ticketService.getUserTicket(EVENT_ID, {
        bypassCache: true,
      });
      const userType =
        backendTicket.type?.name ??
        backendTicket.type?.user_type ??
        backendTicket.ticket_class?.name ??
        backendTicket.ticket_class?.user_type ??
        "";
      allTickets.push({
        id: String(backendTicket.id),
        title: backendTicket.type?.name || "Ticket",
        ticketNumber: backendTicket.ticket_code,
        backgroundColor: getTicketBackgroundColor(userType),
        assignedTo: "You",
        isPersonal: true,
        isUnassigned: false,
        backendTicketId: backendTicket.id,
        ticketType: userType,
      });
    } catch (error: any) {
      const responseCode =
        error?.responseCode || error?.response_code || error?.statusCode;
      if (responseCode !== 404) {
        setTicketsError("Failed to load tickets. Please try again.");
      }
    }

    // Step 2: Assigned tickets from allocations (exclude revoked: denied, cancelled, rejected)
    try {
      const allocations = await ticketService.getUserAllocations(EVENT_ID);
      const activeStatuses = ["pending", "accepted"];
      for (const alloc of allocations) {
        const status = (alloc.status || "").toLowerCase();
        if (!activeStatuses.includes(status)) continue; // Skip denied, cancelled, rejected
        const firstName = alloc.first_name ?? alloc.recipient_first_name;
        const lastName = alloc.last_name ?? alloc.recipient_last_name;
        const assigneeName = [firstName, lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        // Backend must return first_name + last_name in allocation response. Until then, fallback to email heuristic.
        const displayName =
          assigneeName ||
          (alloc.email
            ? alloc.email
                .split("@")[0]
                .replace(/[._]/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase())
            : null) ||
          "Recipient";
        const assignedDate = alloc.created_at
          ? new Date(alloc.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })
          : "";
        allTickets.push({
          id: `alloc-${alloc.id}`,
          title: alloc.ticket_class_name,
          ticketNumber: "",
          backgroundColor: getTicketBackgroundColor(alloc.ticket_class_name),
          ticketType: alloc.ticket_class_name,
          assignedTo: displayName,
          assigneeEmail: alloc.email,
          assigneePhone: alloc.phone ?? alloc.recipient_phone ?? "",
          assignedDate,
          isPersonal: false,
          isUnassigned: false,
          allocationStatus: alloc.status,
        });
      }
    } catch (error: any) {
      console.error("Error fetching allocations:", error);
    }

    // Step 3: Unassigned from quotas - one card per quota, include 0 remaining
    try {
      const quotas = await ticketService.getUserQuotas(EVENT_ID);
      for (const quota of quotas) {
        const ticketClass = quota.ticket_class;
        const ticketClassId = ticketClass?.id;
        // Skip if no ticket_class (required for allocation)
        if (!ticketClass || ticketClassId == null) continue;
        const remaining =
          quota.remaining_quota ?? quota.quota - (quota.allocated_tickets ?? 0);
        const userType =
          ticketClass?.name ??
          ticketClass?.user_type ??
          ticketClass?.type ??
          "";
        const title = ticketClass?.name ?? "Ticket";
        allTickets.push({
          id: `quota-${quota.id}`,
          title,
          ticketNumber: "",
          backgroundColor: getTicketBackgroundColor(userType),
          ticketType: userType,
          isPersonal: false,
          isUnassigned: true,
          quotaId: quota.id,
          ticketClassId,
          availableCount: remaining,
        });
      }
    } catch (error: any) {
      console.error("Error fetching quotas:", error);
      if (allTickets.length === 0) {
        setTicketsError("Failed to load tickets. Please try again.");
      }
    }

    setTickets(allTickets);
    setTicketsLoading(false);
    markTicketsFetched();
    return allTickets;
  }, []);

  const ticketsCountRef = React.useRef(0);
  React.useEffect(() => {
    ticketsCountRef.current = tickets.length;
  }, [tickets.length]);

  useFocusEffect(
    React.useCallback(() => {
      if (shouldRefetchTicketsOnFocus(ticketsCountRef.current > 0)) {
        void fetchTickets();
      }
    }, [fetchTickets]),
  );

  // Update tab when route params change
  useEffect(() => {
    if (route.params?.initialTab) {
      setActiveTab(route.params.initialTab);
    }
  }, [route.params?.initialTab]);

  useEffect(() => {
    if (postEventMode && activeTab === "Scan Ticket") {
      setActiveTab("My Ticket");
    }
  }, [postEventMode, activeTab]);

  useEffect(() => {
    if (activeTab === "My Ticket") {
      void trackTicketEvent("viewed", { source: "scan_qr_screen" });
    }
  }, [activeTab]);

  // Calculate transfer logic based on current ticket state
  const calculateTransferLogic = () => {
    const transferResult = canTransferPersonalTicket(EVENT_ID, user, tickets);
    const totalTickets = tickets.length;
    const availableToAssignTickets = tickets.filter(
      (t) => !t.isPersonal && t.isUnassigned,
    );
    const availableToAssignSlots = availableToAssignTickets.reduce(
      (sum, t) => sum + (t.availableCount ?? 1),
      0,
    );
    return {
      totalTickets,
      availableToAssignCount: availableToAssignSlots,
      canTransferPersonalTicket: transferResult.canTransfer,
    };
  };

  const handleViewQR = (
    title: string,
    ticketNumber: string,
    canTransfer: boolean,
    totalTickets: number,
    availableToAssignCount: number,
  ) => {
    const ticket = tickets.find((t) => t.ticketNumber === ticketNumber);
    // Compute transfer result to get isAdminBlocked
    const transferResult = canTransferPersonalTicket(EVENT_ID, user, tickets);
    setQrModalData({
      title,
      ticketNumber,
      assignedTo: ticket?.assignedTo || "John Doe",
      canTransfer,
      totalTickets,
      availableToAssignCount,
      isAdminBlocked: transferResult.isAdminBlocked || false,
      eventId: EVENT_ID,
    });
    setQrModalVisible(true);
  };

  /** Deep link: open personal ticket QR after the same ticket fetch as My Ticket tab (no extra API). */
  const openingPersonalQrFromRouteRef = useRef(false);
  useEffect(() => {
    if (!route.params?.openPersonalTicketQr) {
      openingPersonalQrFromRouteRef.current = false;
      return;
    }
    if (ticketsLoading) return;
    if (openingPersonalQrFromRouteRef.current) return;
    openingPersonalQrFromRouteRef.current = true;

    navigation.setParams({ openPersonalTicketQr: undefined });

    if (ticketsError) {
      showToast(
        typeof ticketsError === "string"
          ? ticketsError
          : "Could not load your ticket. Try again.",
        "error",
      );
      return;
    }

    const personal = tickets.find((t) => t.isPersonal);
    if (!personal?.ticketNumber) {
      showToast(
        "No ticket found yet. Check your connection and try again.",
        "error",
      );
      return;
    }

    const totalTickets = tickets.length;
    const transferResult = canTransferPersonalTicket(EVENT_ID, user, tickets);
    const unassignedTickets = tickets.filter(
      (t) => !t.isPersonal && t.isUnassigned,
    );
    const availableToAssignSlots = unassignedTickets.reduce(
      (sum, t) => sum + (t.availableCount ?? 1),
      0,
    );
    const ticketRow = tickets.find(
      (t) => t.ticketNumber === personal.ticketNumber,
    );
    setQrModalData({
      title: personal.title,
      ticketNumber: personal.ticketNumber,
      assignedTo: ticketRow?.assignedTo || "John Doe",
      canTransfer: transferResult.canTransfer,
      totalTickets,
      availableToAssignCount: availableToAssignSlots,
      isAdminBlocked: transferResult.isAdminBlocked || false,
      eventId: EVENT_ID,
    });
    setQrModalVisible(true);
  }, [
    route.params?.openPersonalTicketQr,
    ticketsLoading,
    tickets,
    ticketsError,
    user,
    navigation,
    showToast,
  ]);

  const handleTransfer = (
    title: string,
    ticketNumber: string,
    assignedTo: string,
    backgroundColor?: string,
    isUnassigned?: boolean,
    ticket?: Ticket,
  ) => {
    if (isTicketTransferBlockedForEvent(EVENT_ID)) {
      showTicketTransferDeadlineAlert();
      return;
    }

    setTransferModalData({
      title,
      ticketNumber,
      assignedTo,
      backgroundColor: backgroundColor || "#000000",
      isUnassigned: isUnassigned || false,
      ticketClassId: ticket?.ticketClassId,
      quotaId: ticket?.quotaId,
    });
    setTransferModalVisible(true);
  };

  const handleTransferContinue = () => {
    setTransferModalVisible(false);
    setTimeout(() => {
      setRecipientModalVisible(true);
    }, 300);
  };

  const handleRecipientBack = () => {
    setRecipientModalVisible(false);
    setTimeout(() => {
      setTransferModalVisible(true);
    }, 300);
  };

  const handleRecipientTransfer = async (data: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  }) => {
    const recipientData = {
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName,
      email: data.email,
      phoneNumber: data.phoneNumber,
      countryCode: data.countryCode || "",
    };

    // Quota allocation: call allocate-ticket API
    if (transferModalData.isUnassigned && transferModalData.ticketClassId) {
      setIsAllocating(true);
      try {
        const result = await ticketService.allocateTicket(
          EVENT_ID,
          transferModalData.ticketClassId,
          recipientData,
        );
        // Log response for debugging - backend returns first_name, last_name (no recipient_ prefix)
        const alloc = Array.isArray(result) ? result[0] : result;
        const fullName =
          alloc &&
          [
            alloc.first_name ?? alloc.recipient_first_name,
            alloc.last_name ?? alloc.recipient_last_name,
          ]
            .filter(Boolean)
            .join(" ")
            .trim();
        console.log("[allocateTicket] response:", {
          raw: result,
          fullName: fullName || "Recipient",
        });
        setRecipientData({
          firstName: data.firstName,
          lastName: data.lastName,
          fullName: data.fullName,
          email: data.email,
          phoneNumber: data.phoneNumber,
          countryCode: data.countryCode || "",
        });
        setRecipientModalVisible(false);
        clearTicketCache();
        invalidateTicketsFetchedAt();
        await fetchTickets();
        void trackTicketEvent("assigned", {
          source: "scan_qr_screen",
          ticket_class_id: String(transferModalData.ticketClassId ?? ""),
        });
        setTimeout(() => setConfirmationModalVisible(true), 300);
      } catch (error: any) {
        logError(
          error,
          {
            screen: "ScanQR",
            action: "allocateTicket",
            recipientEmail: data?.email,
            eventId: EVENT_ID,
            ticketClassId: transferModalData.ticketClassId,
            message: error?.message,
          },
          { error_type: ERROR_TAGS.VALIDATION }
        );
        setIsAllocating(false);
        const message =
          error?.message || "Failed to allocate ticket. Please try again.";
        setRecipientModalVisible(false);
        setTimeout(() => showToast(message, "error"), 100);
      } finally {
        setIsAllocating(false);
      }
      return;
    }

    // Personal ticket transfer: POST /tickets/transfer/initiate/ (transfer is immediate)
    setIsAllocating(true);
    try {
      await ticketService.transferTicketInitiate(EVENT_ID, recipientData);
      void trackTicketEvent("transferred", { source: "scan_qr_screen" });
      setRecipientData({
        firstName: data.firstName,
        lastName: data.lastName,
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        countryCode: data.countryCode || "",
      });
      setRecipientModalVisible(false);
      clearTicketCache();
      invalidateTicketsFetchedAt();
      const updatedTickets = await fetchTickets();
      const hasPersonalTicket = updatedTickets.some((t) => t.isPersonal);
      if (!hasPersonalTicket) {
        setConfirmationModalVisible(false);
        setRecipientData(null);
        await logout();
      } else {
        setTimeout(() => setConfirmationModalVisible(true), 300);
      }
    } catch (error: any) {
      logError(
        error,
        {
          screen: "ScanQR",
          action: "transferTicketInitiate",
          recipientEmail: data?.email,
          eventId: EVENT_ID,
          message: error?.message,
        },
        { error_type: ERROR_TAGS.VALIDATION }
      );
      setIsAllocating(false);
      const message =
        error?.message || "Failed to transfer ticket. Please try again.";
      setRecipientModalVisible(false);
      setTimeout(() => showToast(message, "error"), 100);
    } finally {
      setIsAllocating(false);
    }
  };

  const handleBackToHome = () => {
    // Close the confirmation modal but stay on the My Ticket screen
    // so user can see the updated ticket sections
    setConfirmationModalVisible(false);
    setRecipientData(null);
    // Don't navigate away - let user see the updated state
  };

  // TODO: BACKEND INTEGRATION - Assign ticket to recipient via API
  // API Endpoint: POST /api/tickets/{ticketId}/assign
  // Request Body: { recipient: { fullName, email, phoneNumber, countryCode } }
  // Response: { success: boolean, ticket: Ticket, message?: string }
  // TODO: BACKEND - Call API before updating local state
  // TODO: BACKEND - Handle validation errors
  // TODO: BACKEND - Refresh tickets list after successful assignment
  const handleAssignTicket = (ticket: {
    title: string;
    ticketNumber: string;
    backgroundColor: string;
  }) => {
    console.log("Assign ticket with recipient:", {
      ticket,
      recipient: recipientData,
      originalTicket: transferModalData,
    });
    // TODO: BACKEND - Call API: await api.post(`/tickets/${ticketId}/assign`, { recipient: recipientData })
    setAssigningTicketsModalVisible(false);
    setRecipientData(null);
    // Add your assign/transfer logic here
  };

  const handleEditAssignment = (
    title: string,
    ticketNumber: string,
    backgroundColor: string,
    assignedTo: string,
    assigneeEmail?: string,
    assigneePhone?: string,
    assignedDate?: string,
    allocationId?: number | null,
    allocationStatus?: "pending" | "accepted" | "rejected" | "cancelled",
  ) => {
    setEditAssignedTicketData({
      title,
      ticketNumber,
      backgroundColor,
      assignedTo,
      assigneeEmail: assigneeEmail ?? "",
      assigneePhone: assigneePhone ?? "",
      assignedDate: assignedDate ?? "",
      allocationId: allocationId ?? null,
      allocationStatus,
    });
    setEditAssignedTicketModalVisible(true);
  };

  const handleUpdateAssignment = () => {
    // Close the edit modal and open update assignment modal
    setEditAssignedTicketModalVisible(false);
    setTimeout(() => {
      setUpdateAssignmentModalVisible(true);
    }, 300);
  };

  const handleRevokeAccess = () => {
    // Close the edit modal and open revoke access modal
    setEditAssignedTicketModalVisible(false);
    setTimeout(() => {
      setRevokeAccessModalVisible(true);
    }, 300);
  };

  const handleUpdateAssignmentBack = () => {
    setUpdateAssignmentModalVisible(false);
    setTimeout(() => {
      setEditAssignedTicketModalVisible(true);
    }, 300);
  };

  const handleRevokeAccessBack = () => {
    setRevokeAccessModalVisible(false);
    setTimeout(() => {
      setEditAssignedTicketModalVisible(true);
    }, 300);
  };

  const [isUpdatingAssignment, setIsUpdatingAssignment] = useState(false);
  const [isRevokingAccess, setIsRevokingAccess] = useState(false);

  const handleUpdateAssignmentConfirm = async (data: {
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    countryCode: string;
  }) => {
    // Backend does not expose update-allocation endpoint (see Spark EMS YAML).
    // Only allocate-ticket and cancel-allocation exist. Show friendly message.
    showToast(
      "Update assignment is not yet supported by the backend. Cancel and re-allocate instead.",
      "error",
    );
    setUpdateAssignmentModalVisible(false);
    setTimeout(() => setEditAssignedTicketModalVisible(true), 300);
  };

  const handleRevokeAccessConfirm = async (reason: string) => {
    const allocationId = editAssignedTicketData?.allocationId;
    if (!allocationId) {
      showToast("Cannot revoke: allocation ID missing.", "error");
      return;
    }
    setIsRevokingAccess(true);
    try {
      await ticketService.revokeAllocation(allocationId, reason);
      void trackTicketEvent("revoked", { source: "scan_qr_screen" });
      setRevokeAccessModalVisible(false);
      clearTicketCache();
      invalidateTicketsFetchedAt();
      await fetchTickets();
      setTimeout(() => setTicketRevokedConfirmationVisible(true), 300);
    } catch (error: any) {
      const msg = error?.message || error?.data?.message || "";
      const isAcceptedAllocation =
        typeof msg === "string" && msg.toLowerCase().includes("pending");
      showToast(
        isAcceptedAllocation
          ? "This ticket has already been accepted. Only pending allocations can be revoked."
          : msg || "Failed to revoke access. Please try again.",
        "error",
      );
    } finally {
      setIsRevokingAccess(false);
    }
  };

  const handleReassignedConfirmationClose = () => {
    setTicketReassignedConfirmationVisible(false);
    setEditAssignedTicketData(null);
  };

  const handleRevokedConfirmationClose = () => {
    setTicketRevokedConfirmationVisible(false);
    setEditAssignedTicketData(null);
  };

  // Handle QR code scanner press - open unified scan flow
  const handleQRCodePress = () => {
    void trackQrEvent("started", { source: "scan_qr_screen" });
    setQrScannerModalVisible(true);
  };

  const handleScannerClose = () => {
    setQrScannerModalVisible(false);
  };

  const { markRequestMeetingComplete, markConnectAttendeesComplete } =
    useChecklist();

  const handleRequestMeetingGuard = async (
    attendee: Attendee,
    helpers: ScanFlowHelpers,
  ): Promise<boolean> => {
    const canBook = await getCanUserBookMeetings();
    if (!canBook) {
      showExpoCannotBookMeetingAlert(navigation);
      return false;
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
        return false;
      }
    }
    const peerId = String(attendee.user?.id ?? "").trim();
    const me = String(user?.user_id ?? "").trim();
    if (peerId && me) {
      const pending = await hasPendingMeetingWithPeer(peerId, me);
      if (pending) {
        helpers.showToast(
          "You already have a pending meeting request with this person. Wait for them to accept or decline before sending another.",
          "info",
        );
        return false;
      }
    }
    return true;
  };

  const handleMeetingRequestSubmit = async (
    formData: MeetingFormData,
    attendee: Attendee,
    helpers: ScanFlowHelpers,
  ) => {
    try {
      await meetingService.submitMeetingRequestFromForm(
        EVENT_ID,
        formData,
        String(attendee.user.id),
      );
      void trackMeetingEvent("request_submitted", { source: "scan_qr_screen" });
      markRequestMeetingComplete();
      helpers.showToast("Meeting request sent successfully!", "success");
      helpers.closeScanner();
      navigation.navigate("Meetings", {
        primaryTab: "requests",
        secondaryTab: "outbound",
      });
    } catch (e: unknown) {
      throw e;
    }
  };

  const handleConnect = async (
    attendee: Attendee,
    helpers: ScanFlowHelpers,
  ) => {
    if (isConnecting) {
      return;
    }

    const currentUser = user;
    if (!currentUser?.user_id) {
      helpers.showToast("User authentication required", "error");
      return;
    }

    setIsConnecting(true);

    try {
      const canInitiateConnection = await getCanUserInitiateConnection();
      if (!canInitiateConnection) {
        showExhibitionCannotInitiateConnectionAlert(navigation);
        return;
      }

      await connectionService.createConnection(
        currentUser.user_id,
        attendee.user.id,
      );
      void trackConnectionEvent("sent", { source: "scan_qr_screen" });
      markConnectAttendeesComplete();
      helpers.showToast("Connection request sent successfully!", "success");
      helpers.closeScanner();
      navigation.navigate("Connections");
    } catch (error: unknown) {
      const err = error as {
        responseCode?: number;
        response_code?: number;
        statusCode?: number;
        message?: string;
      };
      const responseCode =
        err?.responseCode || err?.response_code || err?.statusCode;
      const errorMessageText = err?.message || "";

      const isAlreadyExists =
        errorMessageText.toLowerCase().includes("connection already exists") ||
        errorMessageText.toLowerCase().includes("already exists");

      let errorMessage = "Failed to send connection request. Please try again.";
      let isSuccessCase = false;

      if (responseCode === 400 && isAlreadyExists) {
        errorMessage = "Connection request already exists.";
        isSuccessCase = true;
        void trackConnectionEvent("sent", {
          source: "scan_qr_screen",
          outcome: "already_exists",
        });
        markConnectAttendeesComplete();
        helpers.showToast(errorMessage, "success");
        helpers.closeScanner();
        navigation.navigate("Connections");
      } else if (responseCode === 409) {
        errorMessage = "Connection request already exists.";
        isSuccessCase = true;
        void trackConnectionEvent("sent", {
          source: "scan_qr_screen",
          outcome: "already_exists",
        });
        markConnectAttendeesComplete();
        helpers.showToast(errorMessage, "success");
        helpers.closeScanner();
        navigation.navigate("Connections");
      } else if (responseCode === 400) {
        errorMessage = "Invalid connection request.";
        helpers.showToast(errorMessage, "error");
      } else if (responseCode === 404) {
        errorMessage = "User not found.";
        helpers.showToast(errorMessage, "error");
      } else {
        helpers.showToast(errorMessage, "error");
      }

      if (__DEV__ && !isSuccessCase) {
        console.error("Error creating connection:", error);
        console.error("Error response code:", responseCode);
        console.error("Error message:", errorMessageText);
      }
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <View className="flex-1 bg-white">
      <SafeAreaView edges={["top"]} className="flex-1">
        <StatusBar style="dark" />
        <Header />
        <SegmentedControl
          activeTab={activeTab}
          onTabChange={setActiveTab}
          hideScanTab={postEventMode}
        />
        {activeTab === "My Ticket" ? (
          <MyTicketView
            tickets={tickets}
            loading={ticketsLoading}
            error={ticketsError}
            onViewQR={handleViewQR}
            onTransfer={handleTransfer}
            onEditAssignment={handleEditAssignment}
            user={user}
            eventId={EVENT_ID}
          />
        ) : (
          <>
            <ScanFrame onQRCodePress={handleQRCodePress} />
            <Instructions />
          </>
        )}
        <QRCodeModal
          visible={qrModalVisible}
          onClose={() => setQrModalVisible(false)}
          title={qrModalData.title}
          ticketNumber={qrModalData.ticketNumber}
          assignedTo={qrModalData.assignedTo}
          canTransfer={qrModalData.canTransfer}
          totalTickets={qrModalData.totalTickets}
          availableToAssignCount={qrModalData.availableToAssignCount}
          isAdminBlocked={qrModalData.isAdminBlocked}
          eventId={qrModalData.eventId}
          onTransfer={handleTransfer}
        />
        <TransferTicketModal
          visible={transferModalVisible}
          onClose={() => setTransferModalVisible(false)}
          title={transferModalData.title}
          ticketNumber={transferModalData.ticketNumber}
          backgroundColor={transferModalData.backgroundColor}
          isUnassigned={transferModalData.isUnassigned}
          onContinue={handleTransferContinue}
        />
        <RecipientDetailsModal
          visible={recipientModalVisible}
          onClose={() => setRecipientModalVisible(false)}
          onBack={handleRecipientBack}
          onTransfer={handleRecipientTransfer}
          isSubmitting={isAllocating}
        />
        <AssigningTicketsModal
          visible={assigningTicketsModalVisible}
          onClose={() => {
            setAssigningTicketsModalVisible(false);
            setRecipientData(null);
          }}
          recipientName={recipientData?.fullName || ""}
          availableTickets={[
            {
              title: "Startup Pass",
              ticketNumber: "223e4567-e89b-12d3-a456-426614174001",
              backgroundColor: "#7C3AED",
              ticketType: "exhibitor",
            },
            {
              title: "Attendee Pass",
              ticketNumber: "323e4567-e89b-12d3-a456-426614174002",
              backgroundColor: "#059669",
              ticketType: "attendee",
            },
          ]}
          onAssignTicket={handleAssignTicket}
        />
        <TicketTransferConfirmationModal
          visible={confirmationModalVisible}
          onClose={() => {
            setConfirmationModalVisible(false);
            setRecipientData(null);
          }}
          ticketTitle={transferModalData.title}
          recipientName={recipientData?.fullName || ""}
          onBackToHome={handleBackToHome}
        />
        {editAssignedTicketData && (
          <EditAssignedTicketModal
            visible={editAssignedTicketModalVisible}
            onClose={() => {
              setEditAssignedTicketModalVisible(false);
              setEditAssignedTicketData(null);
            }}
            title={editAssignedTicketData.title}
            ticketNumber={editAssignedTicketData.ticketNumber}
            backgroundColor={editAssignedTicketData.backgroundColor}
            assignedTo={editAssignedTicketData.assignedTo}
            assigneeEmail={editAssignedTicketData.assigneeEmail}
            assigneePhone={editAssignedTicketData.assigneePhone}
            assignedDate={editAssignedTicketData.assignedDate}
            allocationStatus={editAssignedTicketData.allocationStatus}
            onUpdateAssignment={handleUpdateAssignment}
            onRevokeAccess={handleRevokeAccess}
          />
        )}
        {editAssignedTicketData && (
          <UpdateAssignmentDetailsModal
            visible={updateAssignmentModalVisible}
            onClose={() => {
              setUpdateAssignmentModalVisible(false);
              setEditAssignedTicketData(null);
            }}
            onBack={handleUpdateAssignmentBack}
            onUpdate={handleUpdateAssignmentConfirm}
            assigneeName={editAssignedTicketData.assignedTo}
            assigneeEmail={editAssignedTicketData.assigneeEmail}
            assigneePhone={editAssignedTicketData.assigneePhone}
            isLoading={isUpdatingAssignment}
          />
        )}
        {editAssignedTicketData && (
          <RevokeTicketAccessModal
            visible={revokeAccessModalVisible}
            onClose={() => {
              setRevokeAccessModalVisible(false);
              setEditAssignedTicketData(null);
            }}
            onBack={handleRevokeAccessBack}
            onConfirm={handleRevokeAccessConfirm}
            assigneeName={editAssignedTicketData.assignedTo}
            isLoading={isRevokingAccess}
          />
        )}
        <TicketReassignedConfirmationModal
          visible={ticketReassignedConfirmationVisible}
          onClose={handleReassignedConfirmationClose}
          onConfirm={handleReassignedConfirmationClose}
        />
        <TicketRevokedConfirmationModal
          visible={ticketRevokedConfirmationVisible}
          onClose={handleRevokedConfirmationClose}
          onConfirm={handleRevokedConfirmationClose}
        />
        <AttendeeQRScannerFlow
          visible={qrScannerModalVisible}
          onClose={handleScannerClose}
          onRequestMeetingGuard={handleRequestMeetingGuard}
          onMeetingSubmit={handleMeetingRequestSubmit}
          onExpoBlocked={() => showExpoCannotBookMeetingAlert(navigation)}
          onConnect={handleConnect}
          isConnecting={isConnecting}
          analyticsSource="scan_qr_screen"
        />
        <Toast
          message={toast.message}
          visible={toast.visible}
          type={toast.type}
          duration={toast.duration}
          onHide={hideToast}
        />
      </SafeAreaView>
    </View>
  );
}
