import { useCallback } from "react";
import { Dimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

export const SCANNED_ATTENDEE_SHEET_HEIGHT_RATIO = 0.7;

const DISMISS_DRAG_THRESHOLD = 110;
const DISMISS_VELOCITY = 750;

export function getScannedAttendeeSheetHeight(
  screenHeight = Dimensions.get("window").height,
): number {
  return screenHeight * SCANNED_ATTENDEE_SHEET_HEIGHT_RATIO;
}

export function useScannedAttendeeSheetDismiss(onDismiss: () => void) {
  const translateY = useSharedValue(0);
  const isClosing = useSharedValue(false);
  const screenHeight = Dimensions.get("window").height;

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  const panGesture = Gesture.Pan()
    .activeOffsetY(6)
    .failOffsetX([-24, 24])
    .onUpdate((event) => {
      if (isClosing.value) return;
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (isClosing.value) return;

      const shouldDismiss =
        event.translationY > DISMISS_DRAG_THRESHOLD ||
        event.velocityY > DISMISS_VELOCITY;

      if (shouldDismiss) {
        isClosing.value = true;
        translateY.value = withTiming(
          screenHeight,
          { duration: 240 },
          (finished) => {
            if (!finished) return;
            translateY.value = 0;
            isClosing.value = false;
            runOnJS(dismiss)();
          },
        );
        return;
      }

      translateY.value = withSpring(0, {
        damping: 24,
        stiffness: 220,
        mass: 0.85,
      });
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const resetSheet = useCallback(() => {
    translateY.value = 0;
    isClosing.value = false;
  }, [translateY, isClosing]);

  return { panGesture, sheetAnimatedStyle, resetSheet };
}
