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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const DRAG_THRESHOLD = 100;
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.9;

interface FeedbackSentModalProps {
  visible: boolean;
  onClose: () => void;
  meetingTitle?: string;
}

function CheckCircleIcon({
  size = 24,
  color = "#FFFFFF",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function FeedbackSentModal({
  visible,
  onClose,
  meetingTitle,
}: FeedbackSentModalProps) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const modalHeight = useRef(SCREEN_HEIGHT);
  const hasMeasured = useRef(false);
  const isAnimating = useRef(false);

  const handleLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    if (height > 0 && !hasMeasured.current) {
      modalHeight.current = Math.min(height, MAX_MODAL_HEIGHT);
      hasMeasured.current = true;
    }
  };

  useEffect(() => {
    if (visible) {
      translateY.stopAnimation();
      isAnimating.current = false;

      const initialHeight = hasMeasured.current
        ? modalHeight.current
        : SCREEN_HEIGHT;
      translateY.setValue(initialHeight);

      isAnimating.current = true;

      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start(() => {
        isAnimating.current = false;
      });
    } else {
      translateY.stopAnimation();
      isAnimating.current = false;
      translateY.setValue(SCREEN_HEIGHT);
      hasMeasured.current = false;
    }
  }, [visible, translateY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isAnimating.current,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return (
          !isAnimating.current &&
          Math.abs(gestureState.dy) > 5 &&
          gestureState.dy > 0
        );
      },
      onPanResponderGrant: () => {
        if (isAnimating.current) return;
        translateY.stopAnimation();
        translateY.setOffset((translateY as any)._value || 0);
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        if (isAnimating.current) return;
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isAnimating.current) return;
        translateY.flattenOffset();
        const currentValue = (translateY as any)._value || 0;

        if (currentValue > DRAG_THRESHOLD || gestureState.vy > 0.5) {
          isAnimating.current = true;
          Animated.timing(translateY, {
            toValue: modalHeight.current || SCREEN_HEIGHT,
            duration: 250,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(0);
            isAnimating.current = false;
            onClose();
          });
        } else {
          isAnimating.current = true;
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start(() => {
            isAnimating.current = false;
          });
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

            {/* Content */}
            <View style={styles.content}>
              {/* Success Icon */}
              <View style={styles.iconContainer}>
                <View style={styles.iconOuterCircle}>
                  <View style={styles.iconInnerCircle}>
                    <CheckCircleIcon size={32} color="#FFFFFF" />
                  </View>
                </View>
              </View>

              {/* Title */}
              <Text style={styles.title}>Feedback Sent</Text>

              {/* Optional Meeting Title */}
              {meetingTitle && (
                <Text style={styles.subtitle}>{meetingTitle}</Text>
              )}

              {/* Success Message */}
              <Text style={styles.message}>
                Thank you for your feedback! Your input helps us improve the
                experience for everyone.
              </Text>

              {/* Action Button */}
              <Pressable style={styles.actionButton} onPress={onClose}>
                <Text style={styles.actionButtonText}>Okay, nice</Text>
              </Pressable>
            </View>
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
    zIndex: 0,
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
    zIndex: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
    maxHeight: MAX_MODAL_HEIGHT,
  },
  safeArea: {
    backgroundColor: "#FFFFFF",
  },
  handleContainer: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: "#FFFFFF",
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 20,
    alignItems: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 16,
    marginBottom: 24,
  },
  iconOuterCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E6F7E6",
    alignItems: "center",
    justifyContent: "center",
  },
  iconInnerCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000000",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#404040",
    textAlign: "center",
    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    color: "#404040",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  actionButton: {
    backgroundColor: "#000000",
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 48,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#FFFFFF",
  },
});
