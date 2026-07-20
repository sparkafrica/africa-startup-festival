import React from "react";
import { View, Text, Pressable } from "react-native";
import { PersonProfileIcon, ClockIcon } from "./icons";
import { VideoIcon } from "./MenuIcons";

export interface CancelledMeetingCardProps {
  title: string;
  participantName: string;
  company: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingType: "physical" | "virtual";
  onPress?: () => void;
}

export default function CancelledMeetingCard({
  title,
  participantName,
  company,
  date,
  startTime,
  endTime,
  meetingType,
  onPress,
}: CancelledMeetingCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white p-4 mb-4"
      style={{
        borderRadius: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      {/* Header with Title and Cancelled Tag */}
      <View className="flex-row items-start justify-between mb-3">
        <Text className="text-lg font-bold text-black flex-1 mr-2">
          {title}
        </Text>
        <View
          className="flex-row items-center px-3 py-1 self-start"
          style={{ backgroundColor: "#FF3B30", borderRadius: 0 }}
        >
          <Text className="text-white text-xs font-medium">Cancelled</Text>
        </View>
      </View>

      {/* Participant Info */}
      <View className="flex-row items-center mb-2">
        <PersonProfileIcon size={16} color="#404040" />
        <Text className="text-sm text-black ml-2">
          {participantName} • {company}
        </Text>
      </View>

      {/* Date & Time */}
      <View className="flex-row items-center mb-2">
        <ClockIcon size={16} active={false} />
        <Text className="text-sm text-black ml-2">
          {date} • {startTime} - {endTime}
        </Text>
      </View>

      {/* Meeting Type */}
      <View className="flex-row items-center">
        <VideoIcon size={16} color="#404040" />
        <Text className="text-sm text-black ml-2">
          {meetingType === "virtual" ? "Virtual Meeting" : "Physical Meeting"}
        </Text>
      </View>
    </Pressable>
  );
}
