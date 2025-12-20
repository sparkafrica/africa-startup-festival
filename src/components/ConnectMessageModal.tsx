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
import Svg, { Path, Circle } from "react-native-svg";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ConnectMessageModalProps {
  visible: boolean;
  onClose: () => void;
  attendeeName?: string;
}

function CheckmarkIcon({ size = 80, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" />
      <Path
        d="M8 12L11 15L16 9"
        stroke={color}
        strokeWidth="2.5"
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

export default function ConnectMessageModal({
  visible,
  onClose,
  attendeeName = "Attendee",
}: ConnectMessageModalProps) {
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const sparkle1Scale = useRef(new Animated.Value(0)).current;
  const sparkle2Scale = useRef(new Animated.Value(0)).current;
  const sparkle3Scale = useRef(new Animated.Value(0)).current;
  const sparkle1Opacity = useRef(new Animated.Value(0)).current;
  const sparkle2Opacity = useRef(new Animated.Value(0)).current;
  const sparkle3Opacity = useRef(new Animated.Value(0)).current;
  const checkmarkRotation = useRef(new Animated.Value(0)).current;
  const messageOpacity = useRef(new Animated.Value(0)).current;
  const messageTranslateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (visible) {
      // Reset all animations
      scale.setValue(0);
      opacity.setValue(0);
      sparkle1Scale.setValue(0);
      sparkle2Scale.setValue(0);
      sparkle3Scale.setValue(0);
      sparkle1Opacity.setValue(0);
      sparkle2Opacity.setValue(0);
      sparkle3Opacity.setValue(0);
      checkmarkRotation.setValue(0);
      messageOpacity.setValue(0);
      messageTranslateY.setValue(20);

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

      // Animate checkmark rotation
      Animated.sequence([
        Animated.timing(checkmarkRotation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate sparkles with staggered timing
      const sparkleAnimations = [
        { scale: sparkle1Scale, opacity: sparkle1Opacity, delay: 200 },
        { scale: sparkle2Scale, opacity: sparkle2Opacity, delay: 350 },
        { scale: sparkle3Scale, opacity: sparkle3Opacity, delay: 500 },
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
      }, 300);

      // Auto close after 2.5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 2500);

      return () => clearTimeout(timer);
    } else {
      // Reset on close
      scale.setValue(0);
      opacity.setValue(0);
      sparkle1Scale.setValue(0);
      sparkle2Scale.setValue(0);
      sparkle3Scale.setValue(0);
      sparkle1Opacity.setValue(0);
      sparkle2Opacity.setValue(0);
      sparkle3Opacity.setValue(0);
      checkmarkRotation.setValue(0);
      messageOpacity.setValue(0);
      messageTranslateY.setValue(20);
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

  const checkmarkRotate = checkmarkRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["-180deg", "0deg"],
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
          {/* Sparkles around the checkmark */}
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

          {/* Main checkmark circle */}
          <View style={styles.checkmarkContainer}>
            <Animated.View
              style={[
                styles.checkmarkCircle,
                {
                  transform: [{ rotate: checkmarkRotate }],
                },
              ]}
            >
              <CheckmarkIcon size={80} color="#FFFFFF" />
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
            <Text style={styles.successTitle}>Connection Sent!</Text>
            <Text style={styles.successMessage}>
              Your connection request has been sent to{" "}
              <Text style={styles.nameText}>{attendeeName}</Text>
            </Text>
            <Text style={styles.subMessage}>
              They'll be notified and can accept your request
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
  checkmarkContainer: {
    marginBottom: 24,
    position: "relative",
  },
  checkmarkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#22C55E",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#22C55E",
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
  messageContainer: {
    alignItems: "center",
    width: "100%",
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
    marginBottom: 8,
  },
  nameText: {
    fontWeight: "600",
    color: "#171717",
  },
  subMessage: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    marginTop: 4,
  },
});

