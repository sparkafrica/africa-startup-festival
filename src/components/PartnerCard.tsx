import React from "react";
import { View, Text, Pressable, Image, ImageSourcePropType } from "react-native";

const LOGO_SIZE = 64;
const LOGO_RADIUS = 12;

interface PartnerCardProps {
  name?: string;
  logo?: ImageSourcePropType;
  logoColor?: string;
  onPress?: () => void;
}

export default function PartnerCard({
  name,
  logo,
  logoColor = "#3B82F6",
  onPress,
}: PartnerCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="bg-neutral-100 rounded-xl p-3 items-center justify-center border border-neutral-200 w-full"
      style={{
        minHeight: 90,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      {logo ? (
        <Image
          source={logo}
          style={{
            width: LOGO_SIZE,
            height: LOGO_SIZE,
            borderRadius: LOGO_RADIUS,
          }}
          resizeMode="contain"
        />
      ) : (
        <View
          className="w-16 h-16 rounded-xl items-center justify-center"
          style={{ backgroundColor: logoColor }}
        >
          <Text className="text-white font-bold text-2xl">
            {name ? name.charAt(0) : "?"}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
