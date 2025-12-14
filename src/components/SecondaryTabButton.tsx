import React from "react";
import { Pressable, Text, View } from "react-native";

interface SecondaryTabButtonProps {
  label: string;
  icon?: React.ReactNode;
  isActive: boolean;
  onPress: () => void;
}

export default function SecondaryTabButton({
  label,
  icon,
  isActive,
  onPress,
}: SecondaryTabButtonProps) {
  return (
    <Pressable onPress={onPress} className="flex-1 items-center py-3">
      <View className="flex-row items-center">
        {icon && <View className="mr-2">{icon}</View>}
        <Text
          className={`text-base font-medium ${
            isActive ? "text-black" : "text-black"
          }`}
        >
          {label}
        </Text>
      </View>
      {isActive && (
        <View className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800" />
      )}
    </Pressable>
  );
}
