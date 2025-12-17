import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Rect, Circle } from "react-native-svg";

export default function EmptyCancelledMeetings() {
  return (
    <View style={styles.container}>
      {/* Illustration */}
      <View style={styles.illustrationContainer}>
        <Svg width={120} height={120} viewBox="0 0 120 120">
          {/* Outer circle */}
          <Circle cx="60" cy="60" r="60" fill="#F3F4F6" />
          {/* Document/Card illustration */}
          <Rect x="30" y="25" width="60" height="70" rx="4" fill="#FFFFFF" />
          {/* Header lines */}
          <Rect x="35" y="30" width="50" height="8" rx="2" fill="#000000" />
          <Rect x="35" y="42" width="40" height="6" rx="2" fill="#000000" />
          {/* Body lines */}
          <Rect x="35" y="55" width="45" height="4" rx="2" fill="#E5E7EB" />
          <Rect x="35" y="63" width="40" height="4" rx="2" fill="#E5E7EB" />
          <Rect x="35" y="71" width="50" height="4" rx="2" fill="#E5E7EB" />
          <Rect x="35" y="79" width="35" height="4" rx="2" fill="#E5E7EB" />
        </Svg>
      </View>

      {/* Message */}
      <Text style={styles.message}>You don't have any cancelled meetings</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  illustrationContainer: {
    marginBottom: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    fontSize: 26,
    color: "#404040",
    textAlign: "center",
  },
});
