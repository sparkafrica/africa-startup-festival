import React from "react";
import { View, Text, Pressable, Image, ImageSourcePropType } from "react-native";

interface SpeakerCardProps {
  name: string;
  role: string;
  avatar?: ImageSourcePropType;
  avatarColor?: string;
  onPress?: () => void;
}

export default function SpeakerCard({
  name,
  role,
  avatar,
  avatarColor = "#3B82F6",
  onPress,
}: SpeakerCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white rounded-xl p-4 items-center justify-between border border-neutral-200 w-full"
      style={{
        height: 160,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {avatar ? (
        <Image
          source={avatar}
          className="w-16 h-16 rounded-full"
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: avatarColor }}
        >
          <Text className="text-white font-bold text-xl">
            {name.charAt(0)}
          </Text>
        </View>
      )}
      <View className="items-center w-full flex-1 justify-center">
        <Text
          className="text-base font-semibold text-neutral-900 text-center mb-1"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
        <Text
          className="text-sm text-neutral-600 text-center leading-5"
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {role}
        </Text>
      </View>
    </Pressable>
  );
}

