import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowRightIcon } from './icons';

interface BannerCardProps {
  badge?: string;
  title: string;
  description: string;
  buttonText: string;
  gradient: string[];
  onPress?: () => void;
}

export default function BannerCard({
  badge,
  title,
  description,
  buttonText,
  gradient,
  onPress,
}: BannerCardProps) {
  return (
    <View className="mr-4 w-80 rounded-2xl overflow-hidden" style={{
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    }}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-6"
      >
        {badge && (
          <Text className="text-xs font-semibold text-white/80 mb-2 uppercase tracking-wide">
            {badge}
          </Text>
        )}
        <Text className="text-2xl font-bold text-white mb-2 leading-tight">
          {title}
        </Text>
        <Text className="text-sm text-white/90 mb-4 leading-5">
          {description}
        </Text>
        <Pressable
          onPress={onPress}
          className="bg-white/20 rounded-full px-4 py-2 flex-row items-center self-start"
        >
          <Text className="text-sm font-semibold text-white mr-2">
            {buttonText}
          </Text>
          <ArrowRightIcon size={16} color="#FFFFFF" />
        </Pressable>
      </LinearGradient>
    </View>
  );
}

