import React from "react";
import { Pressable, Text, View } from "react-native";

interface TabButtonProps {
  label: string;
  count?: number;
  isActive: boolean;
  onPress: () => void;
}

export default function TabButton({
  label,
  count,
  isActive,
  onPress,
}: TabButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-1 rounded-lg px-4 py-2.5 ${
        isActive ? "bg-white" : "bg-transparent"
      }`}
      style={
        isActive
          ? {
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
            }
          : undefined
      }
    >
      <Text
        className={`text-sm font-medium text-center ${
          isActive ? "text-black" : "text-gray-400"
        }`}
      >
        {label}
        {count !== undefined && ` (${count})`}
      </Text>
    </Pressable>
  );
}
