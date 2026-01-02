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
        style={{ minHeight: 200 }}
      >
        <View style={{ flex: 1, justifyContent: 'space-between' }}>
          <View>
            <Text className="text-[22px] text-white font-inter-semibold leading-tight mb-2">
              {title}
            </Text>

            <Text className="text-[15px] text-white/90 font-inter-normal leading-[20px]">
              {description}
            </Text>
          </View>

          <Pressable
            onPress={onPress}
            className="w-full bg-white/10 border border-white/20 py-3 rounded-2xl flex-row items-center justify-center mt-5"
          >
            <Text className="text-white text-[14px] font-inter-medium mr-2">
              {buttonText}
            </Text>
            <ArrowRightIcon size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
