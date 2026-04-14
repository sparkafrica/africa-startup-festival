import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
  useWindowDimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRightIcon } from "./icons";

interface BannerCardProps {
  title: string;
  description: string;
  buttonText: string;
  gradient: string[];
  backgroundImage?: ImageSourcePropType;
  onPress?: () => void;
}

export default function BannerCard({
  title,
  description,
  buttonText,
  gradient,
  backgroundImage,
  onPress,
}: BannerCardProps) {
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.min(320, Math.round(windowWidth * 0.85));
  /** Tall hero — same 180px as original w-80 design; not tied to narrow %-of-width. */
  const imageHeight = 180;

  return (
    <Pressable
      onPress={onPress}
      className="mr-3 rounded-3xl overflow-hidden"
      style={{ width: cardWidth }}
    >
      {backgroundImage && (
        <Image
          source={backgroundImage}
          className="w-full rounded-t-3xl"
          style={{ height: imageHeight }}
          resizeMode="cover"
        />
      )}

      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="px-4 pt-4 pb-4 rounded-b-3xl"
        style={{ minHeight: 156 }}
      >
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <View>
            <Text className="text-lg text-white font-inter-semibold leading-snug mb-1.5">
              {title}
            </Text>

            <Text className="text-[14px] text-white/90 font-inter-normal leading-5">
              {description}
            </Text>
          </View>

          <Pressable
            onPress={onPress}
            className="w-full bg-white/10 border border-white/20 py-2.5 rounded-xl flex-row items-center justify-center mt-4"
          >
            <Text className="text-white text-[13px] font-inter-medium mr-2">
              {buttonText}
            </Text>
            <ArrowRightIcon size={16} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
