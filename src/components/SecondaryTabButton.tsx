import React from "react";
import { Pressable, Text, View } from "react-native";

interface SecondaryTabButtonProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  count?: number;
  onPress: () => void;
}

export default function SecondaryTabButton({
  label,
  icon,
  isActive,
  count,
  onPress,
}: SecondaryTabButtonProps) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center py-3 relative">
      <View className="flex-row items-center">
        {icon && <View className="mr-2">{icon}</View>}
        <Text
          className={`text-base font-medium ${
            isActive ? "text-black" : "text-black"
          }`}
        >
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <View className="ml-2 bg-gray-800 rounded-full min-w-[20px] h-5 px-1.5 items-center justify-center">
            <Text className="text-white text-xs font-semibold">{count}</Text>
          </View>
        )}
      </View>
      {isActive && (
        <View className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800" />
      )}
    </Pressable>
  );
}
