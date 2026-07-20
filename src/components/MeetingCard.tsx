import React from "react";
import { View, Text, Pressable } from "react-native";
import StatusTag from "./StatusTag";
import { PersonProfileIcon, ClockIcon, LocationPinIcon, TableIcon } from "./icons";
import { VideoIcon } from "./MenuIcons";
import MeetingLinkPressable from "./MeetingLinkPressable";

export interface MeetingCardProps {
  title: string;
  participantName: string;
  company: string;
  date: string;
  startTime: string;
  endTime: string;
  location?: string;
  /** If set, shown as own row with table icon (physical meetings) */
  tableNumber?: string;
  meetingType?: "physical" | "virtual";
  meetingLink?: string;
  status: "pending" | "approved" | "cancelled";
  approvalMessage?: string;
  expiresIn?: string; // e.g. "2h", "45m", "Expired"
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
  tableNumber,
  meetingType = "physical",
  meetingLink,
  status,
  approvalMessage,
  expiresIn,
  onPress,
}: MeetingCardProps) {
  const isVirtual = meetingType === "virtual";
  const displayLocation = isVirtual
    ? meetingLink || "Meeting link pending"
    : location || "TBD";
  return (
    <Pressable
      onPress={onPress}
      className="bg-white p-4 mb-4 border border-gray-200"
      style={{
        borderRadius: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
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
        <ClockIcon size={16} active={false} />
        <Text className="text-sm text-black ml-2">
          {date} • {startTime} - {endTime}
        </Text>
      </View>

      {/* Location or Meeting Link */}
      {isVirtual && meetingLink ? (
        <View className="flex-row items-center mb-3">
          <VideoIcon size={16} color="#404040" />
          <View className="flex-1 ml-2">
            <MeetingLinkPressable url={meetingLink} />
          </View>
        </View>
      ) : (
        <>
          {location && (
            <View className={`flex-row items-center ${tableNumber ? "mb-2" : "mb-3"}`}>
              <LocationPinIcon size={16} color="#404040" />
              <Text className="text-sm text-black ml-2">{location}</Text>
            </View>
          )}
          {tableNumber && (
            <View className="flex-row items-center mb-3">
              <TableIcon size={16} color="#404040" />
              <Text className="text-sm text-black ml-2">{tableNumber}</Text>
            </View>
          )}
          {!location && !tableNumber && (
            <View className="flex-row items-center mb-3">
              <LocationPinIcon size={16} color="#404040" />
              <Text className="text-sm text-black ml-2">{displayLocation}</Text>
            </View>
          )}
        </>
      )}

      {/* Approval Status Message */}
      {approvalMessage && (
        <View className="bg-orange-50 px-3 py-2.5" style={{ borderRadius: 0 }}>
          <Text className="text-sm text-black">
            {approvalMessage}
            {expiresIn !== undefined &&
              (expiresIn === "Expired"
                ? " Expired."
                : ` Expires in ${expiresIn}.`)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
