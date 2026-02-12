/**
 * LoadingSpinner
 *
 * Cross-platform loading spinner that looks consistent on both iOS and Android.
 * Uses a circular arc instead of the native ActivityIndicator (which shows a
 * gear on iOS vs Material circular on Android).
 */

import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

const BRAND_COLOR = "#1BB273";

function withAlpha(color: string, alphaHex: string): string {
  const c = color.replace(/^#/, "");
  if (c.length === 3) {
    return `#${c[0]}${c[0]}${c[1]}${c[1]}${c[2]}${c[2]}${alphaHex}`;
  }
  if (c.length === 6) return `#${c}${alphaHex}`;
  return color;
}

export interface LoadingSpinnerProps {
  size?: "small" | "large";
  color?: string;
}

const SIZES = {
  small: 24,
  large: 40,
};

export default function LoadingSpinner({
  size = "large",
  color = BRAND_COLOR,
}: LoadingSpinnerProps) {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 800, easing: Easing.linear }),
      -1
    );
  }, [rotation]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const dim = SIZES[size];

  return (
    <View style={[styles.container, { width: dim, height: dim }]}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: dim,
            height: dim,
            borderRadius: dim / 2,
            borderWidth: size === "small" ? 2 : 3,
            borderColor: withAlpha(color, "33"),
            borderTopColor: color,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  spinner: {},
});
