import React from 'react';
import { View, Text } from 'react-native';
import Svg, { Path } from 'react-native-svg';

interface ChecklistItemProps {
  title: string;
  description: string;
  completed?: boolean;
}

export default function ChecklistItem({ 
  title, 
  description, 
  completed = false 
}: ChecklistItemProps) {
  return (
    <View 
      className="bg-neutral-100 rounded-xl p-4 mb-3 flex-row items-start justify-between"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View className="flex-1 mr-3">
        <Text className="text-base font-semibold text-neutral-900 mb-1.5">
          {title}
        </Text>
        <Text className="text-sm text-neutral-600 leading-5">
          {description}
        </Text>
      </View>
      <View className="pt-0.5">
        {completed ? (
          <View className="w-6 h-6 rounded-full bg-[#10B981] items-center justify-center">
            <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <Path
                d="M11.6667 3.5L5.25 9.91667L2.33334 7"
                stroke="white"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        ) : (
          <View className="w-6 h-6 rounded-full border-2 border-white bg-white" />
        )}
      </View>
    </View>
  );
}

