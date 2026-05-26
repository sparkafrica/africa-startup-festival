import React from "react";
import { Animated } from "react-native";

type ListRowHighlightOverlayProps = {
  visible: boolean;
  opacity: Animated.Value;
};

/** Green pulse border overlay for deeplink / cross-screen highlights. */
export default function ListRowHighlightOverlay({
  visible,
  opacity,
}: ListRowHighlightOverlayProps) {
  if (!visible) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 2,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: "#1BB273",
        backgroundColor: "rgba(27, 178, 115, 0.14)",
        opacity,
      }}
    />
  );
}
