import React from "react";
import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { getTicketGradientColors } from "../utils/ticketColors";

interface TicketCardProps {
  ticketClassName: string;
  ticketType?: string; // "founder" | "exhibitor" | "partner" | "attendee"
  quota: number;
  allocatedTickets: number;
  remainingQuota?: number;
  isSelected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export default function TicketCard({
  ticketClassName,
  ticketType,
  quota,
  allocatedTickets,
  remainingQuota,
  isSelected = false,
  onPress,
  disabled = false,
}: TicketCardProps) {
  const availableQuota = remainingQuota !== undefined ? remainingQuota : quota - allocatedTickets;

  const type = ticketType ?? ticketClassName;
  const gradientColors = getTicketGradientColors(type);

  const cardStyle = {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: isSelected ? 4 : 2 },
    shadowOpacity: isSelected ? 0.15 : 0.1,
    shadowRadius: isSelected ? 6 : 4,
    elevation: isSelected ? 4 : 2,
  };

  const cardClassName = `rounded-2xl p-5 relative overflow-hidden ${isSelected ? "border-2 border-white" : ""}`;

  const inner = (
    <>
      {/* Decorative pattern in top right corner */}
      <View className="absolute top-0 right-0 w-24 h-24 opacity-20">
        <View className="absolute top-3 right-3 w-10 h-10 border-2 border-white/30 rounded-lg" />
        <View className="absolute top-8 right-8 w-5 h-5 border-2 border-white/30 rounded" />
        <View className="absolute top-14 right-14 w-3 h-3 border border-white/30 rounded" />
      </View>

      {/* Selection checkbox in top right corner */}
      <View className="absolute top-4 right-4 z-10 w-6 h-6 rounded-full items-center justify-center border-2 border-white/50">
        {isSelected && (
          <View className="w-full h-full bg-white rounded-full items-center justify-center">
            <Text className="text-black text-xs font-bold">✓</Text>
          </View>
        )}
      </View>

      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <Text className="text-white text-2xl font-bold mb-2">
            {ticketClassName}
          </Text>

          {/* Quota Information */}
          <View className="mb-4">
            <View className="flex-row items-center flex-wrap mb-2">
              <Text className="text-white/90 text-base">
                Available: <Text className="font-semibold text-white">{availableQuota}</Text>
              </Text>
              {allocatedTickets > 0 && (
                <Text className="text-white/80 text-base ml-4">
                  Allocated: {allocatedTickets}
                </Text>
              )}
            </View>
            <Text className="text-white/70 text-sm">
              Total Quota: {quota}
            </Text>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || availableQuota === 0}
      className={`mb-4 ${disabled || availableQuota === 0 ? "opacity-50" : ""}`}
      style={{
        opacity: isSelected ? 1 : (disabled || availableQuota === 0 ? 0.5 : 1),
      }}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className={cardClassName}
        style={cardStyle}
      >
        {inner}
      </LinearGradient>
    </Pressable>
  );
}
