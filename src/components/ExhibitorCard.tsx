import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
} from "react-native";

const LOGO_SIZE = 72;

interface ExhibitorCardProps {
  name?: string;
  logo?: string | number;
  logoColor?: string;
  onPress?: () => void;
}

export default function ExhibitorCard({
  name,
  logo,
  logoColor = "#3B82F6",
  onPress,
}: ExhibitorCardProps) {
  const imageSource: ImageSourcePropType | undefined = logo
    ? typeof logo === "string"
      ? { uri: logo }
      : logo
    : undefined;

  return (
    <Pressable
      onPress={onPress}
      className="items-center justify-center w-full bg-white border border-neutral-200 py-3 px-2"
      style={{ borderRadius: 0 }}
    >
      {logo ? (
        <Image
          source={imageSource}
          style={{
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            borderRadius: 0,
          }}
          resizeMode="contain"
        />
      ) : (
        <View
          className="items-center justify-center"
          style={{
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            backgroundColor: logoColor,
            borderRadius: 0,
          }}
        >
          <Text className="text-white font-bold text-2xl">
            {name ? name.charAt(0) : "?"}
          </Text>
        </View>
      )}
      {name ? (
        <Text
          className="text-xs text-neutral-700 text-center font-medium mt-2 px-1"
          numberOfLines={2}
        >
          {name}
        </Text>
      ) : null}
    </Pressable>
  );
}
