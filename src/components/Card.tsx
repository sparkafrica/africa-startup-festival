import React from "react";
import { View, Pressable, Text } from "react-native";
import { ChevronUpIcon, ChevronDownIcon } from "./icons";

interface CardProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  expandable?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
  className?: string;
}

export default function Card({
  children,
  title,
  description,
  expandable = false,
  expanded = true,
  onToggle,
  className = "",
}: CardProps) {
  return (
    <View
      className={`bg-white rounded-2xl p-5 mb-4 ${className}`}
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {(title || description) && (
        <Pressable
          onPress={expandable ? onToggle : undefined}
          className="mb-4"
          disabled={!expandable}
        >
          <View className="flex-row items-center justify-between mb-1">
            {title && (
              <Text className="text-lg font-bold text-neutral-900 flex-1 mr-2">
                {title}
              </Text>
            )}
            {expandable && (
              <View className="w-7 h-7 items-center justify-center">
                {expanded ? (
                  <ChevronUpIcon size={20} color="#A3A3A3" />
                ) : (
                  <ChevronDownIcon size={30} color="#A3A3A3" />
                )}
              </View>
            )}
          </View>
          {description && (
            <Text className="text-sm text-neutral-600 leading-5">
              {description}
            </Text>
          )}
        </Pressable>
      )}
      {expanded && children}
    </View>
  );
}
