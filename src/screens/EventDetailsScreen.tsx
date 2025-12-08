import React from 'react';
import { View, Text } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'EventDetails'>;

export default function EventDetailsScreen({ route }: Props) {
  const { eventId } = route.params;

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-neutral-900">Event Details</Text>
      <Text className="text-base text-neutral-600 mt-2">Event ID: {eventId}</Text>
    </View>
  );
}

