import React from "react";
import { View, Pressable, Text } from "react-native";
import { ChevronUpIcon, ChevronDownIcon } from "./icons";

interface EventChecklistProps {
  title: string;
  description: string;
  expanded?: boolean;
  onToggle?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export default function EventChecklist({
  title,
  description,
  expanded = true,
  onToggle,
  children,
  className = "",
}: EventChecklistProps) {
  return (
    <View
      className={`bg-white p-5 mb-4 ${className}`}
      style={{
        borderRadius: 0,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Header - Title and Chevron always on same row */}
      <Pressable onPress={onToggle} className="mb-4">
        <View className="flex-row items-center justify-between mb-2">
          <Text
            className="text-lg font-bold text-neutral-900 flex-1"
            style={{ lineHeight: 28 }}
          >
            {title}
          </Text>
          <View
            className="items-center justify-center ml-2 flex-shrink-0"
            style={{
              width: 28,
              height: 28,
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {expanded ? (
              <ChevronUpIcon size={24} color="#A3A3A3" />
            ) : (
              <ChevronDownIcon size={24} color="#A3A3A3" />
            )}
          </View>
        </View>
        <Text className="text-sm text-neutral-600 leading-5">
          {description}
        </Text>
      </Pressable>

      {/* Checklist Items - Only show when expanded */}
      {expanded && <View>{children}</View>}
    </View>
  );
}
