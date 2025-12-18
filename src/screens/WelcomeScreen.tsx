import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp } from "@react-navigation/native";
import type { RootStackParamList } from "../navigation/types";
import { useAuth } from "../context/AuthContext";
import Svg, { Path, Rect } from "react-native-svg";

// Checkmark Icon
function CheckmarkIcon({
  size = 32,
  color = "#10B981",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
        stroke={color}
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Checkbox Icon
function CheckboxIcon({
  checked = false,
  size = 24,
}: {
  checked?: boolean;
  size?: number;
}) {
  if (checked) {
    return (
      <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <Rect
          x="3"
          y="3"
          width="18"
          height="18"
          rx="2"
          fill="#FFFFFF"
          stroke="#FFFFFF"
          strokeWidth="2"
        />
        <Path
          d="M8 12L11 15L16 9"
          stroke="#000000"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x="3"
        y="3"
        width="18"
        height="18"
        rx="2"
        stroke="#FFFFFF"
        strokeWidth="2"
      />
    </Svg>
  );
}

interface Ticket {
  id: string;
  type: string;
  ticketId: string;
  assignedTo?: string;
  color: string;
}

// Mock ticket data - will be replaced with API call
const mockTickets: Ticket[] = [
  {
    id: "1",
    type: "Founder Pass",
    ticketId: "#SPK2025-1234",
    assignedTo: "John Doe",
    color: "#000000",
  },
  {
    id: "2",
    type: "Exhibitor Pass",
    ticketId: "#SPK2025-5678",
    color: "#10B981",
  },
  {
    id: "3",
    type: "Attendee Pass",
    ticketId: "#SPK2025-5678",
    color: "#3B82F6",
  },
];

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { markWelcomeSeen } = useAuth();
  const [selectedTickets, setSelectedTickets] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Mark welcome as seen when component mounts
  // This happens after navigation, so AppNavigator won't reset
  useEffect(() => {
    markWelcomeSeen();
  }, [markWelcomeSeen]);

  const toggleTicketSelection = (ticketId: string) => {
    setSelectedTickets((prev) =>
      prev.includes(ticketId)
        ? prev.filter((id) => id !== ticketId)
        : [...prev, ticketId]
    );
  };

  const handleTransferTickets = () => {
    if (selectedTickets.length === 0) {
      return;
    }
    // TODO: Implement ticket transfer functionality
    console.log("Transfer tickets:", selectedTickets);
  };

  const handleSkip = () => {
    // Navigate to CompleteProfile screen for initial profile setup
    navigation.navigate("CompleteProfile");
  };

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 py-8">
          {/* Success Checkmark */}
          <View className="items-center mb-6">
            <View className="w-28 h-28 rounded-full bg-green-50 items-center justify-center border-2 border-green-200">
              <CheckmarkIcon size={60} color="#10B981" />
            </View>
          </View>

          {/* Welcome Message */}
          <Text className="text-[30px] font-medium text-neutral-900 text-center mb-2">
            Welcome to ATE 2026!
          </Text>
          <Text className="text-base text-neutral-600 text-center mb-6">
            You have {mockTickets.length} tickets in your quota
          </Text>

          {/* Instructional Banner */}
          <View
            className="rounded-xl p-4 mb-6"
            style={{
              backgroundColor: "#FEF3C7",
              borderWidth: 1,
              borderColor: "#FDE68A",
            }}
          >
            <Text className="text-sm font-medium text-neutral-900 mb-1">
              Transfer tickets to team members or attendees
            </Text>
            <Text className="text-xs text-neutral-700">
              Select tickets below to transfer, or skip to continue to your
              profile
            </Text>
          </View>

          {/* Your Tickets Heading */}
          <Text className="text-[16px] font-semibold text-neutral-900 mb-4">
            Your Tickets ({mockTickets.length})
          </Text>

          {/* Ticket Cards */}
          <View className="gap-4 mb-12">
            {mockTickets.map((ticket) => {
              const isSelected = selectedTickets.includes(ticket.id);
              return (
                <Pressable
                  key={ticket.id}
                  onPress={() => toggleTicketSelection(ticket.id)}
                  className="rounded-2xl p-5 relative overflow-hidden"
                  style={{
                    backgroundColor: ticket.color,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 3,
                  }}
                >
                  {/* Checkbox */}
                  <View className="absolute top-4 right-4">
                    <CheckboxIcon checked={isSelected} size={24} />
                  </View>

                  {/* Diagonal Pattern Background */}
                  <View
                    className="absolute right-0 top-0 bottom-0 w-32 opacity-10"
                    style={{
                      backgroundColor: "#FFFFFF",
                      transform: [{ rotate: "45deg" }],
                    }}
                  />

                  {/* Ticket Content */}
                  <View className="relative z-10">
                    <Text className="text-2xl font-bold text-white mb-2">
                      {ticket.type}
                    </Text>
                    <Text className="text-sm text-neutral-300 mb-3">
                      {ticket.ticketId}
                    </Text>
                    {ticket.assignedTo && (
                      <View className="flex-row items-center">
                        <Text className="text-sm text-neutral-300">
                          Assigned to{" "}
                        </Text>
                        <Text className="text-sm font-semibold text-white">
                          {ticket.assignedTo}
                        </Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Fixed Action Buttons */}
      <View
        className="absolute bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-6 pt-4 pb-6"
        style={{
          paddingBottom: 34,
        }}
      >
        <Pressable
          onPress={handleTransferTickets}
          disabled={selectedTickets.length === 0 || isProcessing}
          className={`rounded-xl py-4 items-center justify-center mb-3 ${
            selectedTickets.length > 0 && !isProcessing
              ? "bg-black"
              : "bg-neutral-300"
          }`}
          style={{
            opacity: selectedTickets.length > 0 && !isProcessing ? 1 : 0.6,
          }}
        >
          <Text className="text-white text-base font-semibold">
            Transfer Tickets
          </Text>
        </Pressable>

        <Pressable
          onPress={handleSkip}
          disabled={isProcessing}
          className="bg-white border-2 border-neutral-300 rounded-xl py-4 items-center justify-center"
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text className="text-black text-base font-semibold">
              Skip for now
            </Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
