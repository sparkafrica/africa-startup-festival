import React from "react";
import { Pressable, Text, TextStyle, StyleSheet } from "react-native";
import { openMeetingLink } from "../utils/meetingLink";

type MeetingLinkPressableProps = {
  url: string;
  className?: string;
  style?: TextStyle;
  numberOfLines?: number;
};

export default function MeetingLinkPressable({
  url,
  className,
  style,
  numberOfLines = 1,
}: MeetingLinkPressableProps) {
  const trimmed = url.trim();
  if (!trimmed) return null;

  return (
    <Pressable
      onPress={() => openMeetingLink(trimmed)}
      accessibilityRole="link"
    >
      <Text
        className={className}
        style={[styles.link, style]}
        numberOfLines={numberOfLines}
        ellipsizeMode="middle"
      >
        {trimmed}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    fontSize: 14,
    color: "#007AFF",
    textDecorationLine: "underline",
  },
});
