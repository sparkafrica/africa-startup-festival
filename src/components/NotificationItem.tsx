import React from "react";
import { View, Text, Pressable } from "react-native";
import type { ReactNode } from "react";

interface NotificationItemProps {
  icon?: ReactNode;
  title: string;
  description: string;
  time: string;
  unread?: boolean;
  onPress?: () => void;
}

export default function NotificationItem({
  icon,
  title,
  description,
  time,
  unread = false,
  onPress,
}: NotificationItemProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-start py-4 px-6 ${
        unread ? "bg-[#F5F8FF]" : "bg-white"
      } active:bg-neutral-50`}
      style={{ borderBottomWidth: 1, borderBottomColor: "#F5F5F5" }}
    >
      {icon && (
        <View className="w-12 h-12 rounded-full items-center justify-center mr-4 flex-shrink-0">
          {icon}
        </View>
      )}
      <View className="flex-1">
        <View className="flex-row items-start justify-between mb-1">
          <Text
            className={`text-base font-semibold flex-1 ${
              unread ? "text-neutral-900" : "text-neutral-700"
            }`}
            style={{ fontSize: 16, lineHeight: 22 }}
          >
            {title}
          </Text>
          {unread && (
            <View
              className="w-2 h-2 rounded-full ml-2 mt-1"
              style={{ flexShrink: 0, backgroundColor: "#2762C7" }}
            />
          )}
        </View>
        <Text
          className="text-sm text-neutral-600 mb-1"
          style={{ fontSize: 14, lineHeight: 20 }}
        >
          {description}
        </Text>
        <Text
          className="text-xs text-neutral-400"
          style={{ fontSize: 12, lineHeight: 16 }}
        >
          {time}
        </Text>
      </View>
    </Pressable>
  );
}

