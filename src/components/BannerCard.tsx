import React from "react";
import {
  View,
  Text,
  Pressable,
  Image,
  ImageSourcePropType,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ArrowRightIcon } from "./icons";

interface BannerCardProps {
  badge?: string;
  title: string;
  description: string;
  buttonText: string;
  gradient: string[];
  backgroundImage?: ImageSourcePropType;
  onPress?: () => void;
}

export default function BannerCard({
  badge,
  title,
  description,
  buttonText,
  gradient,
  backgroundImage,
  onPress,
}: BannerCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mr-4 w-80 rounded-3xl overflow-hidden"
    >
      {/* Top Image */}
      {backgroundImage && (
        <Image
          source={backgroundImage}
          className="w-full h-[180px] rounded-t-3xl"
          resizeMode="cover"
        />
      )}

      {/* Gradient Content Section */}
      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-5 rounded-b-3xl"
      >
        {badge && (
          <Text className="text-[11px] text-white/70 uppercase tracking-wide mb-2">
            {badge}
          </Text>
        )}

        <Text className="text-[22px] text-white font-semibold leading-tight mb-2">
          {title}
        </Text>

        <Text className="text-[15px] text-white/90 leading-[20px] mb-5">
          {description}
        </Text>

        <Pressable
          onPress={onPress}
          className="w-full bg-white/10 border border-white/20 py-3 rounded-2xl flex-row items-center justify-center"
        >
          <Text className="text-white text-[14px] font-medium mr-2">
            {buttonText}
          </Text>
          <ArrowRightIcon size={18} color="#FFFFFF" />
        </Pressable>
      </LinearGradient>
    </Pressable>
  );
}
