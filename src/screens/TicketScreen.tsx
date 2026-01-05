import React from "react";
import { View, Text } from "react-native";
import type { RootStackScreenProps } from "../navigation/types";

type Props = RootStackScreenProps<"Ticket">;

export default function TicketScreen({ route }: Props) {
  const { ticketId } = route.params;

  // TODO: BACKEND INTEGRATION - Fetch ticket details from backend
  // API Endpoint: GET /api/tickets/{ticketId}
  // Response: { ticket: Ticket } (includes full ticket details, QR code, assignment info)
  // TODO: BACKEND - Fetch ticket data on component mount using route.params.ticketId
  // TODO: BACKEND - Handle loading and error states
  // TODO: BACKEND - Display ticket details (type, ticket number, assigned to, QR code, etc.)
  // TODO: BACKEND - Add ticket actions (transfer, assign, revoke, download, share)

  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold text-neutral-900">Ticket Screen</Text>
      <Text className="text-base text-neutral-600 mt-2">
        Ticket ID: {ticketId}
      </Text>
    </View>
  );
}
