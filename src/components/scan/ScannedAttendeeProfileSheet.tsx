import React from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { CalendarIcon } from "../BottomNavIcons";
import { LoadingSpinner } from "../index";
import GuidelinePatternOverlay from "../GuidelinePatternOverlay";
import ScannedAttendeeProfileContent from "../ScannedAttendeeProfileContent";
import type { Attendee } from "../../services/ticketService";
import { getScannedAttendeeSheetHeight } from "../../utils/scannedAttendeeSheet";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

/** Light dim — camera stays visible; safe because this is one modal, not stacked modals. */
const BACKDROP_DIM = "rgba(0, 0, 0, 0.28)";

function ConnectIcon({ size = 20, color = "#000000" }: { size?: number; color?: string }) {
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

interface Props {
  visible: boolean;
  attendee: Attendee | null;
  isEnriching?: boolean;
  isConnecting?: boolean;
  isRequestMeetingLoading?: boolean;
  onClose: () => void;
  onScanAnother: () => void;
  onRequestMeeting: () => void;
  onConnect: () => void;
}

export default function ScannedAttendeeProfileSheet({
  visible,
  attendee,
  isEnriching = false,
  isConnecting = false,
  isRequestMeetingLoading = false,
  onClose,
  onScanAnother,
  onRequestMeeting,
  onConnect,
}: Props) {
  const insets = useSafeAreaInsets();
  const sheetHeight = getScannedAttendeeSheetHeight(SCREEN_HEIGHT);
  const footerPaddingBottom = Math.max(insets.bottom, 12);

  if (!visible || !attendee) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      <Pressable
        style={styles.backdrop}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close profile"
      />
      <View style={[styles.sheet, { height: sheetHeight }]}>
        <GuidelinePatternOverlay isLightCard opacity={0.05} />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces
        >
          <ScannedAttendeeProfileContent
            attendee={attendee}
            variant="modal"
            isEnriching={isEnriching}
            onClose={onClose}
          />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: footerPaddingBottom }]}>
          <Pressable
            style={[
              styles.primaryBtn,
              (isRequestMeetingLoading || isConnecting) && styles.btnDisabled,
            ]}
            onPress={onRequestMeeting}
            disabled={isRequestMeetingLoading || isConnecting}
          >
            {isRequestMeetingLoading ? (
              <LoadingSpinner size="small" color="#FFFFFF" />
            ) : (
              <CalendarIcon size={20} color="#FFFFFF" />
            )}
            <Text style={styles.primaryBtnText}>
              {isRequestMeetingLoading ? "Checking..." : "Request Meeting"}
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.secondaryBtn,
              (isConnecting || isRequestMeetingLoading) && styles.btnDisabled,
            ]}
            onPress={onConnect}
            disabled={isConnecting || isRequestMeetingLoading}
          >
            {isConnecting ? (
              <LoadingSpinner size="small" color="#000000" />
            ) : (
              <ConnectIcon size={20} color="#000000" />
            )}
            <Text style={styles.secondaryBtnText}>
              {isConnecting ? "Connecting..." : "Connect"}
            </Text>
          </Pressable>

          <Pressable onPress={onScanAnother} style={styles.scanAnother}>
            <Text style={styles.scanAnotherText}>Scan another code</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
    zIndex: 30,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BACKDROP_DIM,
  },
  sheet: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#171717",
    flexDirection: "column",
    overflow: "hidden",
    borderRadius: 0,
    position: "relative",
  },
  scroll: {
    flex: 1,
    zIndex: 10,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000000",
    borderRadius: 0,
    paddingVertical: 16,
    marginBottom: 12,
    gap: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "500",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 0,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingVertical: 16,
    marginBottom: 8,
    gap: 8,
  },
  secondaryBtnText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "500",
  },
  btnDisabled: {
    opacity: 0.6,
  },
  scanAnother: {
    alignItems: "center",
    paddingVertical: 8,
  },
  scanAnotherText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#737373",
  },
});
