import React from 'react';
import { View, Text } from 'react-native';

interface ChecklistItemProps {
  title: string;
  description: string;
}

export default function ChecklistItem({ title, description }: ChecklistItemProps) {
  return (
    <View className="bg-neutral-50 rounded-xl p-4 mb-3">
      <Text className="text-base font-semibold text-neutral-900 mb-1.5">
        {title}
      </Text>
      <Text className="text-sm text-neutral-600 leading-5">
        {description}
      </Text>
    </View>
  );
}

