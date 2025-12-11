import React from "react";
import { View, Text, Pressable } from "react-native";
import { CloseIcon } from "./MenuIcons";

interface FilterTagProps {
  label: string;
  onRemove: () => void;
}

export default function FilterTag({ label, onRemove }: FilterTagProps) {
  return (
    <View className="flex-row items-center bg-neutral-100 rounded-lg px-3 py-1.5 mr-2 mb-2">
      <Text className="text-sm text-neutral-900 mr-2">{label}</Text>
      <Pressable onPress={onRemove} hitSlop={8}>
        <CloseIcon size={14} color="#404040" />
      </Pressable>
    </View>
  );
}

