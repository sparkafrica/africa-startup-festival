import React from "react";
import { View, Image, StyleSheet, type ViewStyle } from "react-native";

const guidelineImage = require("../assets/images/guideline.png");

type GuidelinePatternOverlayProps = {
  /** Overall layer opacity. Defaults vary by card tone. */
  opacity?: number;
  /** Light cards (e.g. exhibition/explorer) use a subtler overlay. */
  isLightCard?: boolean;
  style?: ViewStyle;
};

/**
 * Subtle ASF guideline texture over ticket gradients.
 * Keeps foreground text legible while adding brand depth.
 */
export default function GuidelinePatternOverlay({
  opacity,
  isLightCard = false,
  style,
}: GuidelinePatternOverlayProps) {
  const resolvedOpacity = opacity ?? (isLightCard ? 0.07 : 0.11);

  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, style]}>
      <Image
        source={guidelineImage}
        style={[StyleSheet.absoluteFillObject, { opacity: resolvedOpacity }]}
        resizeMode="cover"
      />
    </View>
  );
}
