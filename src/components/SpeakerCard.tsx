import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
} from "react-native";

interface SpeakerCardProps {
  name: string;
  role: string;
  avatar?: ImageSourcePropType;
  avatarColor?: string;
  variant?: "horizontal" | "vertical";
  onPress?: () => void;
}

export default function SpeakerCard({
  name,
  role,
  avatar,
  avatarColor = "#3B82F6",
  variant = "horizontal",
  onPress,
}: SpeakerCardProps) {
  if (variant === "vertical") {
    return (
      <Pressable
        onPress={onPress}
        className="bg-white p-4 items-center w-full"
        style={{
          borderRadius: 0,
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
            className="w-16 h-16 rounded-full mb-3"
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-16 h-16 rounded-full items-center justify-center mb-3"
            style={{ backgroundColor: avatarColor || "#000000" }}
          >
            <Text className="text-white font-bold text-2xl">{name.charAt(0)}</Text>
          </View>
        )}
        <View className="items-center w-full">
          <Text
            className="text-base font-semibold text-neutral-900 text-center"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {name}
          </Text>
          {role && (
            <Text
              className="text-sm text-neutral-600 leading-5 mt-0.5 text-center"
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {role}
            </Text>
          )}
        </View>
      </Pressable>
    );
  }

  // Horizontal variant (default)
  return (
    <Pressable
      onPress={onPress}
      className="bg-neutral-100 p-3 flex-row items-center w-full"
      style={{
        borderRadius: 0,
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
          className="w-9 h-9 rounded-full mr-3"
          resizeMode="cover"
        />
      ) : (
        <View
          className="w-9 h-9 rounded-full items-center justify-center mr-3"
          style={{ backgroundColor: avatarColor || "#000000" }}
        >
          <Text className="text-white font-bold text-lg">{name.charAt(0)}</Text>
        </View>
      )}
      <View className="flex-1">
        <Text
          className="text-base font-semibold text-neutral-900"
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {name}
        </Text>
        {role && (
          <Text
            className="text-sm text-neutral-600 leading-5 mt-0.5"
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {role}
          </Text>
        )}
      </View>
    </Pressable>
  );
}
