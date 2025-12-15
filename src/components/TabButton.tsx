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
      className={`flex-1 rounded-lg px-2 py-2.5 items-center justify-center min-h-[40px] ${
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
        numberOfLines={1}
        adjustsFontSizeToFit={true}
        minimumFontScale={0.85}
      >
        {label}
        {count !== undefined && ` (${count})`}
      </Text>
    </Pressable>
  );
}
