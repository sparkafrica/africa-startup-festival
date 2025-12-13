import React from "react";
import { View, Text, Pressable } from "react-native";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "./MenuIcons";

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
      className="bg-white rounded-2xl mx-4 mb-3 flex-row items-center py-4 px-4"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      }}
      android_ripple={{ color: "#F5F5F5" }}
    >
      {icon && (
        <View className="mr-4 flex-shrink-0">
          {icon}
        </View>
      )}
      <View className="flex-1 min-w-0">
        <Text
          className="text-base font-semibold text-neutral-900 mb-1"
          style={{ fontSize: 16, lineHeight: 22 }}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {title}
        </Text>
        <Text
          className="text-sm text-neutral-600 mb-1"
          style={{ fontSize: 14, lineHeight: 20 }}
          numberOfLines={1}
          ellipsizeMode="tail"
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
      <View className="ml-3 flex-shrink-0">
        <ChevronRightIcon size={18} color="#A3A3A3" />
      </View>
    </Pressable>
  );
}

