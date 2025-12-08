import React from 'react';
import { View, Text } from 'react-native';
import type { RootStackScreenProps } from '../navigation/types';

type Props = RootStackScreenProps<'Ticket'>;

export default function TicketScreen({ route }: Props) {
  const { ticketId } = route.params;

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-neutral-900">Ticket Screen</Text>
      <Text className="text-base text-neutral-600 mt-2">Ticket ID: {ticketId}</Text>
    </View>
  );
}

