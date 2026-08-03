import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Path } from "react-native-svg";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";

const FRAME_SIZE = 256;
const CORNER_LEN = 28;
const CORNER_W = 3;

function CornerBracket({
  flipX,
  flipY,
}: {
  flipX?: boolean;
  flipY?: boolean;
}) {
  const transform = [];
  if (flipX) transform.push({ scaleX: -1 as const });
  if (flipY) transform.push({ scaleY: -1 as const });

  return (
    <View
      style={[
        styles.corner,
        flipX && !flipY && { top: 0, right: 0 },
        flipY && !flipX && { bottom: 0, left: 0 },
        flipX && flipY && { bottom: 0, right: 0 },
        !flipX && !flipY && { top: 0, left: 0 },
        transform.length > 0 ? { transform } : undefined,
      ]}
    >
      <View style={[styles.cornerH, { width: CORNER_LEN }]} />
      <View style={[styles.cornerV, { height: CORNER_LEN }]} />
    </View>
  );
}

export default function ScanCameraOverlay() {
  const scanY = useSharedValue(0);

  useEffect(() => {
    scanY.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [scanY]);

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanY.value * (FRAME_SIZE - 4) }],
    opacity: 0.85,
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={styles.dimTop} />
      <View style={styles.middleRow}>
        <View style={styles.dimSide} />
        <View style={styles.frame}>
          <CornerBracket />
          <CornerBracket flipX />
          <CornerBracket flipY />
          <CornerBracket flipX flipY />
          <Animated.View style={[styles.scanLine, lineStyle]} />
        </View>
        <View style={styles.dimSide} />
      </View>
      <View style={styles.dimBottom} />
    </View>
  );
}

export function ScanSuccessFlash({ visible }: { visible: boolean }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.6);

  useEffect(() => {
    if (!visible) {
      opacity.value = 0;
      scale.value = 0.6;
      return;
    }
    opacity.value = withSequence(
      withTiming(1, { duration: 120 }),
      withTiming(0, { duration: 380 }),
    );
    scale.value = withSequence(
      withTiming(1, { duration: 200, easing: Easing.out(Easing.back(1.4)) }),
      withTiming(1.05, { duration: 300 }),
    );
  }, [visible, opacity, scale]);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!visible) return null;

  return (
    <View style={styles.flashRoot} pointerEvents="none">
      <Animated.View style={[styles.flashCircle, circleStyle]}>
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 13L9 17L19 7"
            stroke="#FFFFFF"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  dimTop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  middleRow: {
    flexDirection: "row",
    height: FRAME_SIZE,
  },
  dimSide: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dimBottom: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  frame: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    overflow: "hidden",
  },
  corner: {
    position: "absolute",
    width: CORNER_LEN,
    height: CORNER_LEN,
  },
  cornerH: {
    position: "absolute",
    top: 0,
    left: 0,
    height: CORNER_W,
    backgroundColor: "#FFFFFF",
  },
  cornerV: {
    position: "absolute",
    top: 0,
    left: 0,
    width: CORNER_W,
    backgroundColor: "#FFFFFF",
  },
  scanLine: {
    position: "absolute",
    left: 8,
    right: 8,
    top: 0,
    height: 2,
    backgroundColor: "#22C55E",
    shadowColor: "#22C55E",
    shadowOpacity: 0.9,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  flashRoot: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  flashCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#171717",
    alignItems: "center",
    justifyContent: "center",
  },
});
