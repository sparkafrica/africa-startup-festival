import React, { useEffect, useRef } from "react";
import { View, Text, Animated, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface MeetingActionToastProps {
  visible: boolean;
  onHide: () => void;
  action: "accepted" | "declined";
  duration?: number;
}

function CheckmarkIcon({
  size = 20,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill={color}
      />
      <Path
        d="M8 12L11 15L16 9"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function XIcon({
  size = 20,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="2"
        fill={color}
      />
      <Path
        d="M15 9L9 15M9 9L15 15"
        stroke="#FFFFFF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function MeetingActionToast({
  visible,
  onHide,
  action,
  duration = 3000,
}: MeetingActionToastProps) {
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const iconScale = useRef(new Animated.Value(0)).current;

  const isAccepted = action === "accepted";
  const backgroundColor = isAccepted ? "#10B981" : "#EF4444";
  const message = isAccepted
    ? "Meeting time change accepted"
    : "Meeting time change declined";

  useEffect(() => {
    if (visible) {
      // Reset animations
      translateY.setValue(-100);
      opacity.setValue(0);
      scale.setValue(0.8);
      iconScale.setValue(0);

      // Animate in
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
      ]).start();

      // Animate icon with bounce
      Animated.sequence([
        Animated.spring(iconScale, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 100,
          friction: 3,
        }),
        Animated.spring(iconScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 5,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 250,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onHide();
        });
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Reset when hidden
      translateY.setValue(-100);
      opacity.setValue(0);
      scale.setValue(0.8);
      iconScale.setValue(0);
    }
  }, [visible, duration, onHide, translateY, opacity, scale, iconScale]);

  if (!visible) return null;

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.container}
      pointerEvents="box-none"
    >
      <Animated.View
        style={[
          styles.toast,
          {
            transform: [{ translateY }, { scale }],
            opacity,
            backgroundColor,
          },
        ]}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Animated.View
            style={[
              styles.iconCircle,
              {
                transform: [{ scale: iconScale }],
                backgroundColor: "#FFFFFF",
              },
            ]}
          >
            {isAccepted ? (
              <CheckmarkIcon size={20} color={backgroundColor} />
            ) : (
              <XIcon size={20} color={backgroundColor} />
            )}
          </Animated.View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: "center",
    paddingTop: 60,
  },
  toast: {
    borderRadius: 0,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    width: SCREEN_WIDTH - 32,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  iconContainer: {
    marginRight: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

