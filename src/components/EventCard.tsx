import React from "react";
import { View, Text, Pressable } from "react-native";
import { CalendarIconWhite } from "./SocialIcons";

export interface EventCardProps {
  title: string;
  stage: string;
  day: string;
  startTime: string;
  endTime: string;
  sponsoredBy?: {
    name: string;
    color: "blue" | "purple";
  };
  onAddToSchedule?: () => void;
  onLeaveFeedback?: () => void;
}

export default function EventCard({
  title,
  stage,
  day,
  startTime,
  endTime,
  sponsoredBy,
  onAddToSchedule,
  onLeaveFeedback,
}: EventCardProps) {
  const sponsorColors = {
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
  };

  const sponsorColor = sponsoredBy ? sponsorColors[sponsoredBy.color] : null;

  return (
    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-100">
      {sponsoredBy && sponsorColor && (
        <View
          className={`flex-row items-center ${sponsorColor.bg} rounded-full px-3 py-1 mb-3 self-start`}
        >
          <View
            className={`w-1.5 h-1.5 ${sponsorColor.dot} rounded-full mr-2`}
          />
          <Text className={`text-xs font-medium ${sponsorColor.text}`}>
            Sponsored by {sponsoredBy.name}
          </Text>
        </View>
      )}

      <Text className="text-lg font-bold text-gray-900 mb-2">{title}</Text>

      <Text className="text-sm text-gray-500 mb-4">
        {stage} · {day} · {startTime} - {endTime}
      </Text>

      <View className="flex-row items-center gap-3">
        <Pressable
          onPress={onAddToSchedule}
          className="flex-row items-center bg-black rounded-md px-4 py-2.5"
        >
          <CalendarIconWhite size={16} color="#FFFFFF" />
          <Text className="text-white font-medium text-sm ml-2">
            Add to schedule
          </Text>
        </Pressable>

        <Pressable onPress={onLeaveFeedback} className="px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-md">
          <Text className="text-gray-800 text-sm">Leave feedback</Text>
        </Pressable>
      </View>
    </View>
  );
}
