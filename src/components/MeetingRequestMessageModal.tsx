import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  Modal,
  Animated,
  Dimensions,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle, Rect } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface MeetingRequestMessageModalProps {
  visible: boolean;
  onClose: () => void;
  attendeeName?: string;
  meetingType?: "Physical" | "Virtual";
  meetingTitle?: string;
}

function CalendarCheckIcon({ size = 80, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="4" width="18" height="18" rx="2" stroke={color} strokeWidth="2" />
      <Path d="M16 2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M8 2V6" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Path d="M3 10H21" stroke={color} strokeWidth="2" />
      <Circle cx="12" cy="15" r="3" fill={color} />
      <Path
        d="M10.5 15L11.5 16L13.5 14"
        stroke="#22C55E"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function SparkleIcon({ size = 24, color = "#FCD34D" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill={color}
      />
      <Circle cx="18" cy="6" r="2" fill={color} />
      <Circle cx="6" cy="18" r="1.5" fill={color} />
      <Circle cx="20" cy="16" r="1" fill={color} />
    </Svg>
  );
}

function LocationIcon({ size = 20, color = "#404040" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="9" r="3" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

function VideoIcon({ size = 20, color = "#404040" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M23 7L16 12L23 17V7Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="1" y="5" width="15" height="14" rx="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

export default function MeetingRequestMessageModal({
  visible,
  onClose,
  attendeeName = "Attendee",
  meetingType = "Physical",
  meetingTitle,
}: MeetingRequestMessageModalProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sparkle1Scale = useRef(new Animated.Value(0)).current;
  const sparkle2Scale = useRef(new Animated.Value(0)).current;
  const sparkle3Scale = useRef(new Animated.Value(0)).current;
  const sparkle4Scale = useRef(new Animated.Value(0)).current;
  const sparkle1Opacity = useRef(new Animated.Value(0)).current;
  const sparkle2Opacity = useRef(new Animated.Value(0)).current;
  const sparkle3Opacity = useRef(new Animated.Value(0)).current;
  const sparkle4Opacity = useRef(new Animated.Value(0)).current;
  const calendarRotation = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(20)).current;
  const detailsOpacity = useRef(new Animated.Value(0)).current;
  const detailsTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Reset all animations
      scale.setValue(0);
      opacity.setValue(0);
      sparkle1Scale.setValue(0);
      sparkle2Scale.setValue(0);
      sparkle3Scale.setValue(0);
      sparkle4Scale.setValue(0);
      sparkle1Opacity.setValue(0);
      sparkle2Opacity.setValue(0);
      sparkle3Opacity.setValue(0);
      sparkle4Opacity.setValue(0);
      calendarRotation.setValue(0);
      messageOpacity.setValue(0);
      messageTranslateY.setValue(20);
      detailsOpacity.setValue(0);
      detailsTranslateY.setValue(20);

      // Animate backdrop
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Animate main container with spring
      Animated.spring(scale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      // Animate calendar icon rotation
      Animated.sequence([
        Animated.timing(calendarRotation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate sparkles with staggered timing
      const sparkleAnimations = [
        { scale: sparkle1Scale, opacity: sparkle1Opacity, delay: 250 },
        { scale: sparkle2Scale, opacity: sparkle2Opacity, delay: 400 },
        { scale: sparkle3Scale, opacity: sparkle3Opacity, delay: 550 },
        { scale: sparkle4Scale, opacity: sparkle4Opacity, delay: 700 },
      ];

      sparkleAnimations.forEach(({ scale: scaleAnim, opacity: opacityAnim, delay }) => {
        setTimeout(() => {
          Animated.parallel([
            Animated.spring(scaleAnim, {
              toValue: 1,
              tension: 100,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();

          // Pulse animation for sparkles
          Animated.loop(
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 800,
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
              }),
            ])
          ).start();
        }, delay);
      });

      // Animate message text
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(messageOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(messageTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 400);

      // Animate details section
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(detailsOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.spring(detailsTranslateY, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      }, 600);

      // Auto close after 3 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    } else {
      // Reset on close
      scale.setValue(0);
      opacity.setValue(0);
      sparkle1Scale.setValue(0);
      sparkle2Scale.setValue(0);
      sparkle3Scale.setValue(0);
      sparkle4Scale.setValue(0);
      sparkle1Opacity.setValue(0);
      sparkle2Opacity.setValue(0);
      sparkle3Opacity.setValue(0);
      sparkle4Opacity.setValue(0);
      calendarRotation.setValue(0);
      messageOpacity.setValue(0);
      messageTranslateY.setValue(20);
      detailsOpacity.setValue(0);
      detailsTranslateY.setValue(20);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const calendarRotate = calendarRotation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ["-180deg", "10deg", "0deg"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.modalContainer}>
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [{ scale }],
              opacity: scale,
            },
          ]}
        >
          {/* Sparkles around the calendar icon */}
          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle1,
              {
                transform: [{ scale: sparkle1Scale }],
                opacity: sparkle1Opacity,
              },
            ]}
          >
            <SparkleIcon size={32} color="#FCD34D" />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle2,
              {
                transform: [{ scale: sparkle2Scale }],
                opacity: sparkle2Opacity,
              },
            ]}
          >
            <SparkleIcon size={24} color="#FCD34D" />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle3,
              {
                transform: [{ scale: sparkle3Scale }],
                opacity: sparkle3Opacity,
              },
            ]}
          >
            <SparkleIcon size={28} color="#FCD34D" />
          </Animated.View>

          <Animated.View
            style={[
              styles.sparkle,
              styles.sparkle4,
              {
                transform: [{ scale: sparkle4Scale }],
                opacity: sparkle4Opacity,
              },
            ]}
          >
            <SparkleIcon size={20} color="#FCD34D" />
          </Animated.View>

          {/* Main calendar icon */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.calendarCircle,
                {
                  transform: [{ rotate: calendarRotate }],
                },
              ]}
            >
              <CalendarCheckIcon size={80} color="#FFFFFF" />
            </Animated.View>
          </View>

          {/* Message text */}
          <Animated.View
            style={[
              styles.messageContainer,
              {
                opacity: messageOpacity,
                transform: [{ translateY: messageTranslateY }],
              },
            ]}
          >
            <Text style={styles.successTitle}>Meeting Request Sent!</Text>
            <Text style={styles.successMessage}>
              Your meeting request has been sent to{" "}
              <Text style={styles.nameText}>{attendeeName}</Text>
            </Text>
          </Animated.View>

          {/* Meeting details */}
          {meetingTitle && (
            <Animated.View
              style={[
                styles.detailsContainer,
                {
                  opacity: detailsOpacity,
                  transform: [{ translateY: detailsTranslateY }],
                },
              ]}
            >
              <View style={styles.detailsCard}>
                <View style={styles.detailsHeader}>
                  {meetingType === "Physical" ? (
                    <LocationIcon size={18} color="#404040" />
                  ) : (
                    <VideoIcon size={18} color="#404040" />
                  )}
                  <Text style={styles.meetingTypeText}>
                    {meetingType} Meeting
                  </Text>
                </View>
                <Text style={styles.meetingTitleText} numberOfLines={2}>
                  {meetingTitle}
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Sub message */}
          <Animated.View
            style={[
              styles.subMessageContainer,
              {
                opacity: detailsOpacity,
                transform: [{ translateY: detailsTranslateY }],
              },
            ]}
          >
            <Text style={styles.subMessage}>
              They'll receive a notification and can confirm or suggest an alternative time
            </Text>
          </Animated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    padding: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
    position: "relative",
  },
  iconContainer: {
    marginBottom: 24,
    position: "relative",
  },
  calendarCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#0284C7",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284C7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  sparkle: {
    position: "absolute",
  },
  sparkle1: {
    top: -20,
    right: 20,
  },
  sparkle2: {
    bottom: 40,
    left: -10,
  },
  sparkle3: {
    top: 60,
    right: -15,
  },
  sparkle4: {
    bottom: -10,
    right: 40,
  },
  messageContainer: {
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#171717",
    marginBottom: 12,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 16,
    color: "#404040",
    textAlign: "center",
    lineHeight: 24,
  },
  nameText: {
    fontWeight: "600",
    color: "#171717",
  },
  detailsContainer: {
    width: "100%",
    marginBottom: 16,
  },
  detailsCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  detailsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  meetingTypeText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#404040",
    marginLeft: 8,
  },
  meetingTitleText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#171717",
    lineHeight: 22,
  },
  subMessageContainer: {
    width: "100%",
  },
  subMessage: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    lineHeight: 20,
  },
});

