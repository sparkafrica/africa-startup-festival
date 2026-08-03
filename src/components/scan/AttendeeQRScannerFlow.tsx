import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import type { Attendee } from "../../services/ticketService";
import { ticketService } from "../../services/ticketService";
import { EVENT_ID } from "../../config/env";
import { trackQrEvent } from "../../utils/analytics";
import { useScannedAttendeeEnrich } from "../../hooks/useScannedAttendeeEnrich";
import {
  getCanUserBookMeetings,
  getCanUserInitiateConnection,
} from "../../utils/meetingRestrictions";
import { currentUserIsInvestor } from "../../utils/asfNetworking";
import { useToast } from "../../hooks/useToast";
import Toast from "../Toast";
import RequestMeetingModal, {
  type MeetingFormData,
} from "../RequestMeetingModal";
import ScanCameraOverlay, { ScanSuccessFlash } from "./ScanCameraOverlay";
import ScannedAttendeeProfileSheet from "./ScannedAttendeeProfileSheet";
import {
  SCAN_DEBOUNCE_MS,
  triggerScanSuccessHaptic,
  validateTicketQrCode,
} from "./scanUtils";

type FlowPhase = "scanning" | "processing" | "profile" | "requestMeeting";

export type ScanFlowToastType = "success" | "error" | "info" | "warning";

export interface ScanFlowHelpers {
  showToast: (message: string, type?: ScanFlowToastType) => void;
  closeScanner: () => void;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onAttendeeChange?: (attendee: Attendee | null) => void;
  onRequestMeetingGuard: (
    attendee: Attendee,
    helpers: ScanFlowHelpers,
  ) => Promise<boolean>;
  onMeetingSubmit: (
    formData: MeetingFormData,
    attendee: Attendee,
    helpers: ScanFlowHelpers,
  ) => Promise<void>;
  onExpoBlocked: () => void;
  onConnect: (attendee: Attendee, helpers: ScanFlowHelpers) => Promise<void>;
  isConnecting?: boolean;
  analyticsSource?: string;
  virtualOnly?: boolean;
}

function CloseIcon({ size = 24, color = "#FFFFFF" }: { size?: number; color?: string }) {
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

export default function AttendeeQRScannerFlow({
  visible,
  onClose,
  onAttendeeChange,
  onRequestMeetingGuard,
  onMeetingSubmit,
  onExpoBlocked,
  onConnect,
  isConnecting = false,
  analyticsSource = "scan_qr_screen",
  virtualOnly = false,
}: Props) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [phase, setPhase] = useState<FlowPhase>("scanning");
  const [scanSource, setScanSource] = useState<Attendee | null>(null);
  const [showFlash, setShowFlash] = useState(false);
  const [isRequestMeetingLoading, setIsRequestMeetingLoading] = useState(false);
  const processingRef = useRef(false);
  const lastScanAtRef = useRef(0);
  const { toast, showToast, hideToast } = useToast();

  const profileVisible = phase === "profile";
  const meetingVisible = phase === "requestMeeting";
  const { attendee, isEnriching } = useScannedAttendeeEnrich(scanSource, {
    enabled: profileVisible && !!scanSource,
  });

  const resetFlow = useCallback(() => {
    setPhase("scanning");
    setScanSource(null);
    setShowFlash(false);
    setIsRequestMeetingLoading(false);
    processingRef.current = false;
    lastScanAtRef.current = 0;
    onAttendeeChange?.(null);
  }, [onAttendeeChange]);

  const handleClose = useCallback(() => {
    resetFlow();
    onClose();
  }, [onClose, resetFlow]);

  const flowHelpers = useMemo<ScanFlowHelpers>(
    () => ({
      showToast,
      closeScanner: handleClose,
    }),
    [showToast, handleClose],
  );

  useEffect(() => {
    if (!visible) resetFlow();
  }, [visible, resetFlow]);

  useEffect(() => {
    if (attendee) onAttendeeChange?.(attendee);
  }, [attendee, onAttendeeChange]);

  useEffect(() => {
    if (!profileVisible || !attendee?.user?.id) return;
    void getCanUserBookMeetings();
    void getCanUserInitiateConnection();
    void currentUserIsInvestor();
  }, [profileVisible, attendee?.user?.id]);

  const handleModalRequestClose = useCallback(() => {
    if (phase === "requestMeeting") {
      setPhase("profile");
      return;
    }
    handleClose();
  }, [phase, handleClose]);

  const handleScanAnother = useCallback(() => {
    setPhase("scanning");
    setScanSource(null);
    setShowFlash(false);
    processingRef.current = false;
    onAttendeeChange?.(null);
  }, [onAttendeeChange]);

  const handleRequestMeetingPress = useCallback(async () => {
    if (!attendee || isRequestMeetingLoading || meetingVisible) return;
    setIsRequestMeetingLoading(true);
    try {
      const allowed = await onRequestMeetingGuard(attendee, flowHelpers);
      if (allowed) setPhase("requestMeeting");
    } finally {
      setIsRequestMeetingLoading(false);
    }
  }, [
    attendee,
    flowHelpers,
    isRequestMeetingLoading,
    meetingVisible,
    onRequestMeetingGuard,
  ]);

  const handleConnectPress = useCallback(async () => {
    if (!attendee || isConnecting) return;
    await onConnect(attendee, flowHelpers);
  }, [attendee, flowHelpers, isConnecting, onConnect]);

  const handleMeetingFormClose = useCallback(() => {
    setPhase("profile");
  }, []);

  const handleMeetingFormSubmit = useCallback(
    async (formData: MeetingFormData) => {
      if (!attendee) {
        showToast("No attendee data available", "error");
        throw new Error("No attendee");
      }
      await onMeetingSubmit(formData, attendee, flowHelpers);
    },
    [attendee, flowHelpers, onMeetingSubmit, showToast],
  );

  const handleBarCodeScanned = useCallback(
    async ({ data }: { data: string }) => {
      if (processingRef.current || phase !== "scanning") return;

      const now = Date.now();
      if (now - lastScanAtRef.current < SCAN_DEBOUNCE_MS) return;

      const trimmed = data?.trim();
      if (!trimmed) return;

      const validation = validateTicketQrCode(trimmed);
      if (!validation.valid) {
        void trackQrEvent("failed", {
          source: "scan_qr_screen",
          reason: "invalid_format",
        });
        showToast(validation.error || "Invalid QR code format", "error");
        return;
      }

      processingRef.current = true;
      lastScanAtRef.current = now;
      setPhase("processing");

      try {
        const scanned = await ticketService.scanTicketByCode(EVENT_ID, trimmed);
        void triggerScanSuccessHaptic();
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 520);

        setScanSource(scanned);
        setPhase("profile");
        void trackQrEvent("success", { source: "scan_qr_screen" });
      } catch (error: unknown) {
        const err = error as {
          responseCode?: number;
          response_code?: number;
          statusCode?: number;
        };
        const responseCode =
          err?.responseCode ?? err?.response_code ?? err?.statusCode;

        let errorMessage = "Failed to scan ticket. Please try again.";
        if (responseCode === 404) {
          errorMessage = "Ticket not found. Please check the QR code and try again.";
        } else if (responseCode === 401) {
          errorMessage = "Unauthorized. Please log in and try again.";
        } else if (responseCode === 403) {
          errorMessage = "You don't have permission to scan this ticket.";
        } else if (responseCode != null && responseCode >= 500) {
          errorMessage = "Server error. Please try again later.";
        }

        void trackQrEvent("failed", {
          source: "scan_qr_screen",
          reason: "api_error",
          response_code: responseCode ?? "unknown",
        });
        showToast(errorMessage, "error");
        setPhase("scanning");
      } finally {
        processingRef.current = false;
      }
    },
    [phase, showToast],
  );

  if (!visible) return null;

  if (permission === null) {
    return (
      <Modal visible animationType="fade" onRequestClose={handleClose}>
        <View className="flex-1 bg-black items-center justify-center">
          <ActivityIndicator color="#FFFFFF" />
          <Text className="text-white mt-4">Requesting camera permission...</Text>
        </View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide" onRequestClose={handleClose}>
        <View
          className="flex-1 bg-white px-6 justify-center"
          style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
        >
          <Text className="text-xl font-semibold text-black mb-3 text-center">
            Camera permission required
          </Text>
          <Text className="text-base text-neutral-600 mb-8 text-center">
            We need camera access to scan attendee QR codes at the event.
          </Text>
          <Pressable
            onPress={requestPermission}
            className="w-full items-center bg-black rounded-xl py-4 mb-3"
          >
            <Text className="text-base font-medium text-white">Grant permission</Text>
          </Pressable>
          <Pressable
            onPress={handleClose}
            className="w-full items-center border border-neutral-300 rounded-xl py-4"
          >
            <Text className="text-base font-medium text-black">Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  const topBarPadding = Math.max(insets.top, 12) + 8;
  const bottomHintPadding = Math.max(insets.bottom, 16) + 12;
  const cameraActive = phase === "scanning";

  const attendeeName = attendee
    ? `${attendee.user.first_name} ${attendee.user.last_name}`.trim()
    : undefined;

  return (
    <Modal
      visible
      animationType="slide"
      onRequestClose={handleModalRequestClose}
      statusBarTranslucent
    >
      <View className="flex-1 bg-black">
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          onBarcodeScanned={cameraActive ? handleBarCodeScanned : undefined}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        />

        {cameraActive ? <ScanCameraOverlay /> : null}

        <ScanSuccessFlash visible={showFlash} />

        {phase === "processing" ? (
          <View style={styles.processingOverlay} pointerEvents="none">
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        ) : null}

        {cameraActive ? (
          <View
            style={[styles.topBar, { paddingTop: topBarPadding }]}
            pointerEvents="box-none"
          >
            <Pressable
              onPress={handleClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Close scanner"
              style={styles.closeButton}
            >
              <CloseIcon />
            </Pressable>
          </View>
        ) : null}

        {cameraActive ? (
          <View
            style={[styles.hintBar, { paddingBottom: bottomHintPadding }]}
            pointerEvents="none"
          >
            <Text className="text-white text-center text-base font-medium">
              Align the QR code within the frame
            </Text>
            <Text className="text-white/70 text-center text-sm mt-1">
              Profile appears after a successful scan
            </Text>
          </View>
        ) : null}

        <ScannedAttendeeProfileSheet
          visible={profileVisible}
          attendee={attendee}
          isEnriching={isEnriching}
          isConnecting={isConnecting}
          isRequestMeetingLoading={isRequestMeetingLoading}
          onClose={handleClose}
          onScanAnother={handleScanAnother}
          onRequestMeeting={handleRequestMeetingPress}
          onConnect={handleConnectPress}
        />

        <RequestMeetingModal
          presentation="embedded"
          visible={meetingVisible}
          analyticsSource={analyticsSource}
          onClose={handleMeetingFormClose}
          onSubmit={handleMeetingFormSubmit}
          onExpoBlocked={onExpoBlocked}
          attendeeName={attendeeName}
          requesteeUserId={
            attendee ? String(attendee.user.id) : undefined
          }
          virtualOnly={virtualOnly}
        />

        <Toast
          message={toast.message}
          visible={toast.visible}
          type={toast.type}
          duration={toast.duration}
          onHide={hideToast}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 20,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  hintBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    zIndex: 10,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
});
