import React from "react";
import { View, Text, Pressable } from "react-native";
import { CalendarIconWhite } from "./SocialIcons";
import LoadingSpinner from "./LoadingSpinner";

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
  onRemoveFromSchedule?: () => void; // For My Schedule tab
  isInMySchedule?: boolean; // Show "Added" when true
  isAddingToSchedule?: boolean;
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
  onRemoveFromSchedule,
  isInMySchedule,
  isAddingToSchedule = false,
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

  const showActions =
    !!onRemoveFromSchedule ||
    !!onAddToSchedule ||
    !!onLeaveFeedback ||
    !!isInMySchedule;

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

      {showActions ? (
      <View className="flex-row items-center gap-3">
        {onRemoveFromSchedule ? (
          <Pressable
            onPress={onRemoveFromSchedule}
            className="flex-row items-center rounded-md px-4 py-2.5 border border-red-500"
          >
            <Text className="text-red-500 font-medium text-sm">Remove from schedule</Text>
          </Pressable>
        ) : isInMySchedule ? (
          <View className="flex-row items-center bg-neutral-200 rounded-md px-4 py-2.5">
            <CalendarIconWhite size={16} color="#737373" />
            <Text className="text-neutral-500 font-medium text-sm ml-2">Added</Text>
          </View>
        ) : onAddToSchedule ? (
          <Pressable
            onPress={onAddToSchedule}
            disabled={isAddingToSchedule}
            className={`flex-row items-center rounded-md px-4 py-2.5 ${
              isAddingToSchedule ? "bg-neutral-700" : "bg-black"
            }`}
          >
            {isAddingToSchedule ? (
              <LoadingSpinner size="small" color="#FFFFFF" />
            ) : (
              <CalendarIconWhite size={16} color="#FFFFFF" />
            )}
            <Text className="text-white font-medium text-sm ml-2">
              {isAddingToSchedule ? "Adding…" : "Add to schedule"}
            </Text>
          </Pressable>
        ) : null}

        {onLeaveFeedback ? (
        <Pressable onPress={onLeaveFeedback} className="px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-md">
          <Text className="text-gray-800 text-sm">Leave a Feedback</Text>
        </Pressable>
        ) : null}
      </View>
      ) : null}
    </View>
  );
}
