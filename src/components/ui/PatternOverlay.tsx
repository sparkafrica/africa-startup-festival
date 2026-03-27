import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import Svg, { Defs, Pattern, Rect, Path } from "react-native-svg";

type PatternOverlayProps = {
  /** Overall layer opacity (recommended 0.05 - 0.15). */
  opacity?: number;
  /** Stroke color for lines; white works well on colored cards. */
  strokeColor?: string;
  /** Pattern tile size; smaller = denser pattern. */
  tileSize?: number;
  /** Optional style override for absolute layer. */
  style?: ViewStyle;
};

export default function PatternOverlay({
  opacity = 0.24,
  strokeColor = "#FFFFFF",
  tileSize = 220,
  style,
}: PatternOverlayProps) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { opacity }, style]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="none">
        <Defs>
          <Pattern
            id="fluidPattern"
            x={0}
            y={0}
            width={tileSize}
            height={tileSize}
            patternUnits="userSpaceOnUse"
          >
            {/* Organic contour lines */}
            <Path
              d="M12 118 C 42 26, 154 18, 192 100 S 328 180, 388 104"
              fill="none"
              stroke={strokeColor}
              strokeWidth={1.7}
              opacity={0.75}
            />
            <Path
              d="M4 64 C 52 152, 152 140, 214 52"
              fill="none"
              stroke={strokeColor}
              strokeWidth={1.35}
              opacity={0.62}
            />
            <Path
              d="M-8 156 C 40 120, 112 196, 194 150 C 234 128, 276 124, 316 156"
              fill="none"
              stroke={strokeColor}
              strokeWidth={1.15}
              opacity={0.65}
            />
            <Path
              d="M16 18 C 58 2, 96 18, 124 44 C 154 70, 194 76, 226 52"
              fill="none"
              stroke={strokeColor}
              strokeWidth={1.1}
              opacity={0.65}
            />
          </Pattern>
        </Defs>

        <Rect width="100%" height="100%" fill="url(#fluidPattern)" />
      </Svg>
    </View>
  );
}

