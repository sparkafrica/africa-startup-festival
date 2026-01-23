import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path } from "react-native-svg";
import { ClockIcon } from "./BottomNavIcons";
import { LocationPinIcon, PersonProfileIcon } from "./icons";
import { VideoIcon } from "./MenuIcons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;

interface MeetingAcceptedModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  meetingType?: "physical" | "virtual";
  meetingLink?: string;
  participantName: string;
  participantRole: string;
  participantCompany: string;
}

function CheckCircleIcon({ size = 80 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Outer light green circle */}
      <Path
        d="M50 10C28.5 10 10 28.5 10 50C10 71.5 28.5 90 50 90C71.5 90 90 71.5 90 50C90 28.5 71.5 10 50 10Z"
        fill="#D1FAE5"
      />
      {/* Inner dark green circle */}
      <Path
        d="M50 20C33.4 20 20 33.4 20 50C20 66.6 33.4 80 50 80C66.6 80 80 66.6 80 50C80 33.4 66.6 20 50 20Z"
        fill="#10B981"
      />
      {/* Checkmark */}
      <Path
        d="M35 50L45 60L65 40"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function MeetingAcceptedModal({
  visible,
  onClose,
  title,
  date,
  startTime,
  endTime,
  location,
  meetingType = "physical",
  meetingLink,
  participantName,
  participantRole,
  participantCompany,
}: MeetingAcceptedModalProps) {
  const isVirtual = meetingType === "virtual";
  
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalHeight = useRef(SCREEN_HEIGHT);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0) {
      modalHeight.current = height;
    }
  };

  useEffect(() => {
    if (visible) {
      translateY.setValue(modalHeight.current || SCREEN_HEIGHT);
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

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 5 && gestureState.dy > 0;
      },
      onPanResponderGrant: () => {
        translateY.setOffset((translateY as any)._value || 0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        translateY.flattenOffset();
        const currentValue = (translateY as any)._value || 0;

        if (currentValue > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: modalHeight.current || SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <Animated.View
          style={[
            styles.bottomSheet,
            {
              transform: [{ translateY: translateY }],
            },
          ]}
          onLayout={handleLayout}
        >
          <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
            {/* Handle */}
            <View style={styles.handleContainer} {...panResponder.panHandlers}>
              <View style={styles.handle} />
            </View>

            {/* Success Icon */}
            <View style={styles.iconContainer}>
              <CheckCircleIcon size={80} />
            </View>

            {/* Title */}
            <Text style={styles.title}>Meeting Accepted!</Text>

            {/* Meeting Details Card */}
            <View style={styles.detailsCard}>
              <Text style={styles.meetingTitle}>{title}</Text>

              {/* Participant */}
              <View style={styles.detailRow}>
                <PersonProfileIcon size={18} color="#404040" />
                <Text style={styles.detailText}>
                  {participantName} • {participantCompany}
                </Text>
              </View>

              {/* Date and Time */}
              <View style={styles.detailRow}>
                <ClockIcon size={18} color="#404040" />
                <Text style={styles.detailText}>
                  {date} • {startTime} - {endTime}
                </Text>
              </View>

              {/* Location or Meeting Link */}
              {isVirtual && meetingLink ? (
                <View style={styles.detailRow}>
                  <VideoIcon size={18} color="#404040" />
                  <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="middle">
                    {meetingLink}
                  </Text>
                </View>
              ) : (
                <View style={styles.detailRow}>
                  <LocationPinIcon size={18} color="#404040" />
                  <Text style={styles.detailText}>{location || "TBD"}</Text>
                </View>
              )}
            </View>

            {/* Instruction Text */}
            <Text style={styles.instructionText}>
              View this meeting in <Text style={styles.linkText}>schedule</Text>{" "}
              section for more info
            </Text>

            {/* Action Button */}
            <Pressable style={styles.actionButton} onPress={onClose}>
              <Text style={styles.actionButtonText}>Okay, nice</Text>
            </Pressable>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: "100%",
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1,
    overflow: "hidden",
  },
  safeArea: {
    paddingBottom: 0,
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 0,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 24,
  },
  detailsCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  meetingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  detailText: {
    fontSize: 14,
    color: "#404040",
    marginLeft: 8,
    flex: 1,
  },
  instructionText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginHorizontal: 20,
    marginBottom: 24,
  },
  linkText: {
    textDecorationLine: "underline",
    color: "#111827",
  },
  actionButton: {
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

