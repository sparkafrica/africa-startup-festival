import React from "react";
import { View, Text } from "react-native";
import type { ScheduleBadgeColor } from "../utils/scheduleMetadata";

const BADGE_COLORS: Record<
  ScheduleBadgeColor,
  { bg: string; dot: string; text: string }
> = {
  blue: {
    bg: "bg-blue-100",
    dot: "bg-blue-700",
    text: "text-blue-700",
  },
  purple: {
    bg: "bg-purple-100",
    dot: "bg-purple-700",
    text: "text-purple-700",
  },
  green: {
    bg: "bg-green-100",
    dot: "bg-green-700",
    text: "text-green-700",
  },
};

type ScheduleBadgeProps = {
  text: string;
  color?: ScheduleBadgeColor;
  className?: string;
};

export default function ScheduleBadge({
  text,
  color = "blue",
  className = "mb-3",
}: ScheduleBadgeProps) {
  const palette = BADGE_COLORS[color];
  return (
    <View
      className={`flex-row items-center ${palette.bg} px-3 py-1 self-start ${className}`}
      style={{ borderRadius: 0 }}
    >
      <View className={`w-1.5 h-1.5 ${palette.dot} rounded-full mr-2`} />
      <Text className={`text-xs font-medium ${palette.text}`}>{text}</Text>
    </View>
  );
}
