import React from "react";
import { View, Text, Pressable, Image } from "react-native";
import { UserAvatarIcon } from "./MenuIcons";
import Svg, { Path } from "react-native-svg";

interface AttendeeCardProps {
  name: string;
  role?: string;
  company?: string;
  avatar?: string | number;
  tags?: string[];
  onConnect?: () => void;
}

// Connect Icon (two people icon)
function ConnectIcon({ size = 16, color = "#404040" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      {/* First person */}
      <Path
        d="M6 6C7.10457 6 8 5.10457 8 4C8 2.89543 7.10457 2 6 2C4.89543 2 4 2.89543 4 4C4 5.10457 4.89543 6 6 6Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2 12C2 10.3431 3.79086 9 6 9C8.20914 9 10 10.3431 10 12"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Second person */}
      <Path
        d="M12 6C13.1046 6 14 5.10457 14 4C14 2.89543 13.1046 2 12 2C10.8954 2 10 2.89543 10 4C10 5.10457 10.8954 6 12 6Z"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 12C8 10.3431 9.79086 9 12 9C14.2091 9 16 10.3431 16 12"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function AttendeeCard({
  name,
  role,
  company,
  avatar,
  tags = [],
  onConnect,
}: AttendeeCardProps) {
  return (
    <View
      className="bg-white rounded-2xl p-4 mb-3"
      style={{
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View className="flex-row items-start">
        {/* Avatar */}
        <View className="w-14 h-14 rounded-full bg-neutral-100 items-center justify-center mr-4 flex-shrink-0">
          {avatar ? (
            <Image
              source={typeof avatar === "string" ? { uri: avatar } : avatar}
              className="w-14 h-14 rounded-full"
              resizeMode="cover"
            />
          ) : (
            <UserAvatarIcon size={28} color="#404040" />
          )}
        </View>

        {/* Content */}
        <View className="flex-1 mr-3">
          <Text className="text-base font-bold text-neutral-900 mb-1">
            {name}
          </Text>

          {/* Role & Company */}
          {(role || company) && (
            <Text className="text-sm text-neutral-600 mb-2">
              {role && company ? `${role} · ${company}` : role || company}
            </Text>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <View className="flex-row flex-wrap">
              {tags.map((tag, index) => (
                <View
                  key={index}
                  className="px-2 py-1 bg-neutral-100 rounded-md mr-2 mb-1"
                >
                  <Text className="text-xs text-neutral-700">{tag}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Connect Button */}
        <Pressable
          onPress={onConnect}
          className="px-3 py-2 rounded-xl border border-neutral-200 items-center justify-center flex-shrink-0"
        >
          <ConnectIcon size={16} color="#404040" />
          <Text className="text-xs font-medium text-neutral-900 mt-1">
            Connect
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

