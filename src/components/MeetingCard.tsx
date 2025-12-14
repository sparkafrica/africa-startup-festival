import React from "react";
import { View, Text, Pressable } from "react-native";
import StatusTag from "./StatusTag";
import { PersonProfileIcon, ClockIcon, LocationPinIcon } from "./icons";

export interface MeetingCardProps {
  title: string;
  participantName: string;
  company: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  status: "pending" | "approved" | "cancelled";
  approvalMessage?: string;
  expiresIn?: number; // hours
  onPress?: () => void;
}

export default function MeetingCard({
  title,
  participantName,
  company,
  date,
  startTime,
  endTime,
  location,
  status,
  approvalMessage,
  expiresIn,
  onPress,
}: MeetingCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Header with Title and Status */}
      <View className="flex-row items-start justify-between mb-3">
        <Text className="text-lg font-bold text-black flex-1 mr-2">
          {title}
        </Text>
        <StatusTag label="Pending" variant={status} />
      </View>

      {/* Participant Info */}
      <View className="flex-row items-center mb-2">
        <PersonProfileIcon size={16} color="#404040" />
        <Text className="text-sm text-black ml-2">{participantName}</Text>
        <View className="w-1 h-1 bg-gray-400 rounded-full mx-2" />
        <Text className="text-sm text-black">{company}</Text>
      </View>

      {/* Date and Time */}
      <View className="flex-row items-center mb-2">
        <ClockIcon size={16} color="#404040" />
        <Text className="text-sm text-black ml-2">
          {date} • {startTime} - {endTime}
        </Text>
      </View>

      {/* Location */}
      <View className="flex-row items-center mb-3">
        <LocationPinIcon size={16} color="#404040" />
        <Text className="text-sm text-black ml-2">{location}</Text>
      </View>

      {/* Approval Status Message */}
      {approvalMessage && (
        <View className="bg-orange-50 rounded-lg px-3 py-2.5">
          <Text className="text-sm text-black">
            {approvalMessage}
            {expiresIn !== undefined && ` Expires in ${expiresIn} hours.`}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
