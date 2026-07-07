import React from "react";
import { View, Image, StyleSheet, useWindowDimensions } from "react-native";

const WATERMARK_IMG = require("../assets/images/logo.png");

/** Single centered ASF watermark — subtle, not tiled. */
export default function ChatWatermark() {
  const { width, height } = useWindowDimensions();
  const logoWidth = Math.min(width * 0.92, 320);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View
        style={[
          styles.centerWrap,
          { transform: [{ translateY: -height * 0.05 }] },
        ]}
      >
        <Image
          source={WATERMARK_IMG}
          style={{ width: logoWidth, height: logoWidth * 0.55 }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.2,
  },
});
