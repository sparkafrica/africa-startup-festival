import React, { useEffect, useRef, useCallback } from "react";
import { Text, Animated, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

/**
 * Top banner toast — same layering model as ScheduleSuccessToast: in-tree absolute
 * overlay (no React Native Modal). Avoids iOS stacking a full-screen modal above
 * bottom sheets, which caused touch blocking and gesture jank.
 *
 * Mount this as the last child of each screen’s root (flex:1) so `position: absolute`
 * anchors to the full screen. It will sit under other native Modals (e.g. sheets).
 */
export default function Toast({
  message,
  visible,
  onHide,
  type = "success",
  duration = 3000,
}: ToastProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const hideToast = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide();
    });
  }, [fadeAnim, slideAnim, onHide]);

  useEffect(() => {
    if (visible) {
      fadeAnim.setValue(0);
      slideAnim.setValue(-100);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, fadeAnim, slideAnim, hideToast]);

  const backgroundColor =
    type === "success"
      ? "#10B981"
      : type === "error"
        ? "#EF4444"
        : type === "warning"
          ? "#F59E0B"
          : "#3B82F6";

  if (!visible) return null;

  return (
    <SafeAreaView
      edges={["top"]}
      style={styles.container}
      pointerEvents="box-none"
    >
      <Animated.View
        pointerEvents="auto"
        style={[
          styles.toast,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
            backgroundColor,
          },
        ]}
      >
        <Text style={styles.message}>{message}</Text>
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
    paddingTop: Platform.OS === "ios" ? 8 : 12,
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    minWidth: 200,
    maxWidth: "92%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 12 }),
  },
  message: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
