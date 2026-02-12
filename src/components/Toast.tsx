import React, { useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  Animated,
  StyleSheet,
  Modal,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface ToastProps {
  message: string;
  visible: boolean;
  onHide: () => void;
  type?: "success" | "error" | "info" | "warning";
  duration?: number;
}

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
      // Reset animation values when showing
      fadeAnim.setValue(0);
      slideAnim.setValue(-100);

      // Show animation
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

      // Auto hide after duration
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

  // Render in a Modal so the toast always appears on top of other modals and
  // the transparent overlay — not under modal shadow/backdrop
  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      supportedOrientations={["portrait", "landscape"]}
      onRequestClose={hideToast}
    >
      <View style={styles.modalOverlay} pointerEvents="box-none">
        <SafeAreaView
          edges={["top"]}
          style={styles.container}
          pointerEvents="box-none"
        >
          <Animated.View
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "transparent",
  },
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 8 : 12,
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    minWidth: 200,
    // Strong shadow so toast is boldly visible above transparent/modal backdrop
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    ...(Platform.OS === "android" && { elevation: 24 }),
  },
  message: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
});
