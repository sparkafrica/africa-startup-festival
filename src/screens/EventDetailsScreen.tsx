import React from "react";
import { View, Text } from "react-native";
import type { RootStackScreenProps } from "../navigation/types";

type Props = RootStackScreenProps<"EventDetails">;

export default function EventDetailsScreen({ route }: Props) {
  const { eventId } = route.params;

  // TODO: BACKEND INTEGRATION - Fetch event details from backend
  // API Endpoint: GET /api/events/{eventId}
  // Response: { event: Event } (includes full speaker details, description, sponsors)
  // TODO: BACKEND - Fetch event data on component mount using route.params.eventId
  // TODO: BACKEND - Handle loading and error states
  // TODO: BACKEND - Display event details (title, description, speakers, time, location, etc.)
  // TODO: BACKEND - Add "Add to Schedule" functionality
  // TODO: BACKEND - Add "Leave Feedback" functionality

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-neutral-900">Event Details</Text>
      <Text className="text-base text-neutral-600 mt-2">
        Event ID: {eventId}
      </Text>
    </View>
  );
}
